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
  HANDWRITTEN_LEVELS,
  HANDWRITTEN_TOPICS,
  type HandwrittenEvaluation,
  type HandwrittenLevel,
  type HandwrittenSubmissionResult,
  type HandwrittenTopic,
} from "@/lib/handwritten-writing";
import { cn } from "@/lib/cn";
import type { WritingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";
import { localizeWritingError } from "@/i18n/writing";

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
  messages: WritingLabMessages["errors"],
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
  if (!context) throw new Error(messages.browserPhotoFailed);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error(messages.photoFailed)),
      "image/jpeg",
      quality,
    ),
  );
}

async function preparePhoto(
  source: File,
  messages: WritingLabMessages["errors"],
): Promise<File> {
  if (source.size > MAX_SOURCE_BYTES) {
    throw new Error(
      formatMessage(messages.photoTooLarge, { name: source.name }),
    );
  }
  const bitmap = await createImageBitmap(source);
  try {
    if (
      Math.max(bitmap.width, bitmap.height) < 900 ||
      Math.min(bitmap.width, bitmap.height) < 500
    ) {
      throw new Error(
        formatMessage(messages.photoTooSmall, { name: source.name }),
      );
    }
    let blob = await canvasBlob(bitmap, MAX_DIMENSION, 0.84, messages);
    if (blob.size > TARGET_FILE_BYTES)
      blob = await canvasBlob(bitmap, MAX_DIMENSION, 0.72, messages);
    if (blob.size > TARGET_FILE_BYTES)
      blob = await canvasBlob(bitmap, SECONDARY_MAX_DIMENSION, 0.72, messages);
    if (blob.size > 2 * 1024 * 1024) {
      throw new Error(
        formatMessage(messages.photoCompressionFailed, { name: source.name }),
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

export function HandwrittenParagraph({
  onExit,
  messages,
}: {
  onExit: () => void;
  messages: WritingLabMessages;
}) {
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

  const levelConfig = messages.handwritten.levels[level];
  const topicConfig = messages.handwritten.topics[topic];

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUnreadableReason(null);
    const available = MAX_PHOTOS - photos.length;
    if (files.length > available) {
      setError(
        formatMessage(messages.errors.tooManyPhotos, { max: MAX_PHOTOS }),
      );
      return;
    }
    const selected = Array.from(files);
    if (
      selected.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
    ) {
      setError(messages.errors.photoFormats);
      return;
    }
    setPreparing(true);
    try {
      const prepared = await Promise.all(
        selected.map((photo) => preparePhoto(photo, messages.errors)),
      );
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
          : messages.errors.photoPreparationFailed,
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
            ? localizeWritingError(payload.error, messages.errors)
            : messages.errors.photoEvaluationFailed,
        );
        return;
      }
      const result = payload as HandwrittenSubmissionResult;
      if (!result.readable) {
        setUnreadableReason(
          localizeWritingError(result.reason, messages.errors),
        );
        return;
      }
      setEvaluation(result.evaluation);
    } catch {
      setError(messages.errors.photoSendFailed);
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
          <PageTitle>{messages.handwritten.feedbackTitle}</PageTitle>
          <Button type="button" variant="secondary" onClick={startAgain}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {messages.handwritten.tryAnotherTopic}
          </Button>
        </div>
        <HandwrittenWritingFeedback
          evaluation={evaluation}
          messages={messages.handwritten}
        />
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
        {messages.common.back}
      </Button>

      <div className="flex flex-col gap-1">
        <PageTitle>{messages.home.paragraphTitle}</PageTitle>
        <Body className="text-text-secondary">
          {messages.handwritten.description}
        </Body>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>{messages.handwritten.chooseLevel}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {HANDWRITTEN_LEVELS.map((option) => {
            const config = messages.handwritten.levels[option];
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
        <SectionTitle>{messages.handwritten.chooseTopic}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {HANDWRITTEN_TOPICS.map((option) => {
            const config = messages.handwritten.topics[option];
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
          {formatMessage(messages.handwritten.target, {
            lineTarget: levelConfig.lineTarget,
            characterTarget: levelConfig.characterTarget,
          })}
        </Caption>
      </InformationBanner>

      <section className="flex flex-col gap-3">
        <SectionTitle>{messages.handwritten.uploadTitle}</SectionTitle>
        <Body className="text-text-secondary">
          {messages.handwritten.uploadDescription}
        </Body>

        {error && (
          <InformationBanner variant="error">{error}</InformationBanner>
        )}
        {unreadableReason && (
          <InformationBanner
            variant="warning"
            title={messages.handwritten.retakeTitle}
          >
            {unreadableReason} {messages.handwritten.unreadableSuffix}
          </InformationBanner>
        )}

        {photos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <Card key={photo.id} className="relative overflow-hidden p-2">
                <div className="relative aspect-3/4 overflow-hidden rounded-control bg-elevated">
                  <Image
                    src={photo.previewUrl}
                    alt={formatMessage(messages.handwritten.photoAlt, {
                      page: index + 1,
                    })}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Caption>
                    {formatMessage(messages.handwritten.page, {
                      page: index + 1,
                    })}
                  </Caption>
                  <Button
                    type="button"
                    variant="tertiary"
                    className="p-1"
                    aria-label={formatMessage(messages.handwritten.removePage, {
                      page: index + 1,
                    })}
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
              {preparing
                ? messages.handwritten.preparingPhotos
                : messages.handwritten.addPhotos}
            </CardTitle>
            <Caption>
              {formatMessage(messages.handwritten.supportedPhotos, {
                max: MAX_PHOTOS,
              })}
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
          {messages.handwritten.evaluate}
        </Button>
        <Caption>{messages.handwritten.evaluationNote}</Caption>
      </section>
    </div>
  );
}
