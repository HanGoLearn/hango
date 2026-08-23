"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, FileImage, RotateCcw, Trash2 } from "lucide-react";
import { InformationBanner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Body,
  Caption,
  CardTitle,
  PageTitle,
  SectionTitle,
} from "@/components/ui/typography";
import { HandwrittenWritingFeedback } from "@/components/writing/handwritten-writing-feedback";
import {
  HANDWRITTEN_LEVEL_CONFIG,
  HANDWRITTEN_LEVELS,
  HANDWRITTEN_TOPIC_CONFIG,
  HANDWRITTEN_TOPICS,
  type HandwrittenEvaluation,
  type HandwrittenLevel,
  type HandwrittenSubmissionResult,
  type HandwrittenTopic,
} from "@/lib/handwritten-writing";
import { cn } from "@/lib/cn";

const MAX_PHOTOS = 3;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 1_800;
const SECONDARY_MAX_DIMENSION = 1_400;
const TARGET_FILE_BYTES = 1.8 * 1024 * 1024;

interface PreparedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

async function canvasBlob(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the photo.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("This photo could not be prepared.")),
      "image/jpeg",
      quality,
    ),
  );
}

async function preparePhoto(source: File): Promise<File> {
  if (source.size > MAX_SOURCE_BYTES) {
    throw new Error(`${source.name} is too large. Choose a photo under 15 MB.`);
  }
  const bitmap = await createImageBitmap(source);
  try {
    if (
      Math.max(bitmap.width, bitmap.height) < 900 ||
      Math.min(bitmap.width, bitmap.height) < 500
    ) {
      throw new Error(
        `${source.name} is too small to read Chinese characters clearly.`,
      );
    }
    let blob = await canvasBlob(bitmap, MAX_DIMENSION, 0.84);
    if (blob.size > TARGET_FILE_BYTES)
      blob = await canvasBlob(bitmap, MAX_DIMENSION, 0.72);
    if (blob.size > TARGET_FILE_BYTES)
      blob = await canvasBlob(bitmap, SECONDARY_MAX_DIMENSION, 0.72);
    if (blob.size > 2 * 1024 * 1024) {
      throw new Error(
        `${source.name} could not be compressed enough. Try a closer crop.`,
      );
    }
    return new File(
      [blob],
      `${source.name.replace(/\.[^.]+$/, "") || "page"}.jpg`,
      {
        type: "image/jpeg",
      },
    );
  } finally {
    bitmap.close();
  }
}

export function HandwrittenParagraph({ onExit }: { onExit: () => void }) {
  const [level, setLevel] = useState<HandwrittenLevel>("BASIC");
  const [topic, setTopic] = useState<HandwrittenTopic>("FAMILY");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadableReason, setUnreadableReason] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<HandwrittenEvaluation | null>(
    null,
  );
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(
    () => () => {
      for (const photo of photosRef.current)
        URL.revokeObjectURL(photo.previewUrl);
    },
    [],
  );

  const levelConfig = HANDWRITTEN_LEVEL_CONFIG[level];
  const topicConfig = HANDWRITTEN_TOPIC_CONFIG[topic];

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUnreadableReason(null);
    const available = MAX_PHOTOS - photos.length;
    if (files.length > available) {
      setError(`You can upload up to ${MAX_PHOTOS} photos in one submission.`);
      return;
    }
    const selected = Array.from(files);
    if (
      selected.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
    ) {
      setError("Use JPG, PNG, or WebP photos.");
      return;
    }
    setPreparing(true);
    try {
      const prepared = await Promise.all(selected.map(preparePhoto));
      setPhotos((current) => [
        ...current,
        ...prepared.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "The photos could not be prepared.",
      );
    } finally {
      setPreparing(false);
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
    setUnreadableReason(null);
  }

  async function submitPhotos() {
    if (photos.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    setUnreadableReason(null);
    const formData = new FormData();
    formData.set("level", level);
    formData.set("topic", topic);
    for (const photo of photos) formData.append("images", photo.file);

    try {
      const response = await fetch("/api/writing/handwritten", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        HandwrittenSubmissionResult | { error?: string } | null;
      if (!response.ok) {
        setError(
          payload && "error" in payload && payload.error
            ? payload.error
            : "The photos could not be evaluated.",
        );
        return;
      }
      const result = payload as HandwrittenSubmissionResult;
      if (!result.readable) {
        setUnreadableReason(result.reason);
        return;
      }
      setEvaluation(result.evaluation);
    } catch {
      setError(
        "The photos could not be sent. Check your connection and try again when ready.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startAgain() {
    for (const photo of photos) URL.revokeObjectURL(photo.previewUrl);
    setPhotos([]);
    setEvaluation(null);
    setUnreadableReason(null);
    setError(null);
  }

  if (evaluation) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle>Your handwriting feedback</PageTitle>
          <Button type="button" variant="secondary" onClick={startAgain}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try another topic
          </Button>
        </div>
        <HandwrittenWritingFeedback evaluation={evaluation} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        type="button"
        variant="tertiary"
        className="w-fit gap-1.5 px-0"
        onClick={onExit}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <div className="flex flex-col gap-1">
        <PageTitle>Write a Paragraph</PageTitle>
        <Body className="text-text-secondary">
          Write Chinese by hand as separate sentences or one continuous text,
          then upload clear photos for feedback.
        </Body>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>1. Choose your level</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {HANDWRITTEN_LEVELS.map((option) => {
            const config = HANDWRITTEN_LEVEL_CONFIG[option];
            const selected = level === option;
            return (
              <Card
                key={option}
                interactive
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                className={cn(
                  "cursor-pointer",
                  selected && "border-primary-500 ring-2 ring-primary-500/20",
                )}
                onClick={() => setLevel(option)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setLevel(option);
                  }
                }}
              >
                <CardTitle>{config.label}</CardTitle>
                <Body className="text-text-secondary">{config.lineTarget}</Body>
                <Caption>{config.characterTarget}</Caption>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>2. Choose a topic</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {HANDWRITTEN_TOPICS.map((option) => {
            const config = HANDWRITTEN_TOPIC_CONFIG[option];
            const selected = topic === option;
            return (
              <Card
                key={option}
                interactive
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                className={cn(
                  "cursor-pointer",
                  selected && "border-primary-500 ring-2 ring-primary-500/20",
                )}
                onClick={() => setTopic(option)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setTopic(option);
                  }
                }}
              >
                <CardTitle>{config.label}</CardTitle>
                <Body className="text-text-secondary">
                  {config.prompts[level]}
                </Body>
              </Card>
            );
          })}
        </div>
      </section>

      <InformationBanner title={`${topicConfig.label} · ${levelConfig.label}`}>
        <Body>{topicConfig.prompts[level]}</Body>
        <Caption className="mt-1 block">
          Target: {levelConfig.lineTarget.toLowerCase()} (
          {levelConfig.characterTarget.toLowerCase()}).
        </Caption>
      </InformationBanner>

      <section className="flex flex-col gap-3">
        <SectionTitle>3. Upload your handwriting</SectionTitle>
        <Body className="text-text-secondary">
          Upload 1–3 photos in page order. Use bright, even light and keep the
          whole text in focus.
        </Body>

        {error && (
          <InformationBanner variant="error">{error}</InformationBanner>
        )}
        {unreadableReason && (
          <InformationBanner variant="warning" title="Please retake the photo">
            {unreadableReason} No score was created. Replace the unclear photo
            and submit again when ready.
          </InformationBanner>
        )}

        {photos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <Card key={photo.id} className="relative overflow-hidden p-2">
                <div className="relative aspect-3/4 overflow-hidden rounded-control bg-elevated">
                  <Image
                    src={photo.previewUrl}
                    alt={`Handwritten page ${index + 1}`}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Caption>Page {index + 1}</Caption>
                  <Button
                    type="button"
                    variant="tertiary"
                    className="p-1"
                    aria-label={`Remove page ${index + 1}`}
                    onClick={() => removePhoto(photo.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {photos.length < MAX_PHOTOS && (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-elevated p-6 text-center hover:border-primary-500">
            {preparing ? (
              <FileImage
                className="size-6 text-primary-500"
                aria-hidden="true"
              />
            ) : (
              <Camera className="size-6 text-primary-500" aria-hidden="true" />
            )}
            <CardTitle>
              {preparing ? "Preparing photos…" : "Add photos"}
            </CardTitle>
            <Caption>
              JPG, PNG, or WebP · up to {MAX_PHOTOS} pages total
            </Caption>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={preparing || submitting}
              className="sr-only"
              onChange={(event) => {
                void addPhotos(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        )}

        <Button
          type="button"
          className="w-fit"
          loading={submitting}
          disabled={photos.length === 0 || preparing || submitting}
          onClick={() => void submitPhotos()}
        >
          Evaluate my handwriting
        </Button>
        <Caption>
          Han first checks photo quality. A paid evaluation is sent only when
          you press this button, and failed calls are never retried
          automatically.
        </Caption>
      </section>
    </div>
  );
}
