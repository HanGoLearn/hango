# HanGo Storage Architecture

Version: 1.0

Status: Official

Last Updated: August 2026

> **2026-09-05 audit note:** the "files outside the database, metadata
> inside" principle holds up. What's understated: today there is exactly
> **one** real provider, `LocalStorageProvider`
> (`src/lib/storage/providers/local.ts`), writing to a gitignored
> `.storage/` folder on local disk - no cloud object storage (S3, Blob, or
> otherwise) is configured, and the code's own comment calls this
> explicitly a "dev-only stand-in." The suggested nested directory layout
> below (`users/`, `images/`, `lessons/`, `simulations/`, `ai/`, `system/`)
> doesn't match reality either - real storage keys are flat, content-
> addressed feature prefixes (`speaking/`, `dialogue-audio/`,
> `vocabulary-audio/`, `grammar-audio/`, `placement-audio/`,
> `welcome-audio/`, `han-speech/`), hashed from the exact text being
> spoken so identical content is never regenerated or stored twice.
>
> **2026-09-19 privacy update:** learner-created Speaking Lab recordings are
> the only private object family currently stored (`speaking/{userId}/...`).
> Their 0/7/30/90/365-day or indefinite retention preference is now enforced
> by a daily authenticated job. Physical deletion uses a durable PostgreSQL
> outbox, exponential retries and a strict namespace guard; account deletion
> inventories these objects transactionally before its database cascade.
> Unreferenced timestamped recordings are removed after a 24-hour grace period.
> Completed outbox audit metadata is retained for 30 days and then purged.
> Shared curriculum/AI audio prefixes are never eligible for this process.

---

# Purpose

This document defines how HanGo stores, organizes, retrieves, and manages all digital assets used throughout the platform.

The Storage System is responsible for handling educational resources, user-generated content, AI-generated assets, audio, images, and future multimedia resources.

The objective is to provide secure, scalable, and efficient storage while minimizing operational costs.

---

# Storage Philosophy

The storage system should be:

- Scalable.
- Reliable.
- Secure.
- Cost-efficient.
- Independent from business logic.

Large files should never be stored inside the relational database.

The database stores metadata.

Storage stores files.

---

# Storage Categories

HanGo stores several types of assets.

```
Educational Content

↓

Audio

↓

Images

↓

User Content

↓

AI Generated Content

↓

System Assets
```

---

# Educational Content

Includes:

- Lesson illustrations.
- Grammar diagrams.
- Vocabulary images.
- Reading resources.
- Downloadable materials.

Educational resources should be versioned.

---

# Audio Storage

Stores:

- Dialogue audio.
- Vocabulary pronunciation.
- Grammar examples.
- Listening exercises.
- AI Teacher speech.
- Simulation voices.

Learner recordings should also be stored separately.

Only metadata should remain inside the database.

---

# User Content

Stores learner-created information.

Examples:

- Speaking recordings.
- Writing drafts.
- Uploaded profile pictures.
- Saved notes.
- Bookmarks.

Users should always retain ownership of their personal learning content.

---

# AI Generated Content

Stores:

- Generated dialogues.
- Generated exercises.
- AI lesson variations.
- Personalized explanations.
- Generated audio.
- Generated reports.

AI-generated assets may be cached to reduce costs.

---

# System Assets

Stores:

- Logos.
- Icons.
- Illustrations.
- UI resources.
- Application images.

System assets should be optimized for fast delivery.

---

# Storage Organization

Suggested directory structure:

```
users/

audio/

images/

lessons/

dialogues/

grammar/

vocabulary/

missions/

simulations/

ai/

system/
```

Each category should remain independent.

---

# File Naming

Every stored file should have:

- Unique identifier.
- Related entity.
- Version.
- Creation timestamp.

File names should never depend on user-entered values.

---

# Versioning

Educational resources should support version control.

Examples:

Lesson v1

↓

Lesson v2

↓

Lesson v3

Learners using completed lessons should continue referencing the correct version.

---

# Metadata

Every stored asset should include metadata.

Examples:

- ID.
- Owner.
- File type.
- Size.
- Creation date.
- Last modified.
- Related lesson.
- Language.
- Version.

Metadata enables efficient searching and organization.

---

# Storage Providers

The architecture should support cloud object storage.

The provider should be replaceable without affecting application logic.

Storage access must occur through the backend.

The frontend should never access private storage directly.

---

# Upload Flow

```
User Upload

↓

Frontend

↓

Backend Validation

↓

Storage Service

↓

Metadata Database

↓

Success Response
```

Validation must occur before storage.

---

# Download Flow

```
User Request

↓

Authentication

↓

Authorization

↓

Storage Retrieval

↓

Secure Delivery

↓

Frontend
```

Protected resources should never be publicly accessible.

---

# Caching

Frequently accessed assets should be cached.

Examples:

- Vocabulary audio.
- Lesson images.
- Dialogue audio.
- Grammar illustrations.

Caching reduces loading time and infrastructure costs.

---

# Compression

Uploaded assets should be optimized automatically.

Examples:

Images:

- Resize.
- Compress.

Audio:

- Optimize bitrate.
- Normalize volume.

Optimization should preserve educational quality.

---

# Security

Storage security includes:

- Access control.
- Signed URLs when necessary.
- Encryption at rest.
- Secure transmission.
- Malware scanning for uploads.

Unauthorized users should never access private assets.

Current learner-upload controls:

- Speaking Lab accepts WebM, Ogg, M4A/MP4 audio, and WAV up to 15 MiB and
  five minutes. The server verifies the container signature, fully parses the
  audio, rejects video, and derives duration, sample rate, and channel count
  itself before storage or transcription. Browser MIME and timer values are
  never treated as authoritative.
- Speaking object names are generated by the server inside the learner's
  private `speaking/{userId}/` namespace. The authenticated audio route reads
  through the configured storage provider and verifies ownership against the
  database before serving any bytes.
- Handwritten Writing accepts one to three JPG, PNG, or WebP photos, at most
  2 MiB each and 5 MiB combined. Every image is fully decoded with pixel and
  dimension limits, rejected if animated or malformed, auto-oriented, and
  re-encoded without EXIF/XMP/IPTC metadata before the transient AI request.
  The re-encode does not resize the handwriting.
- Broader future upload formats (documents, archives, video, community files)
  require a malware-scanning/quarantine pipeline before they are enabled.

---

# Backup Strategy

Storage backups should include:

- User-generated content.
- Educational resources.
- Audio assets.
- AI-generated resources.

Backups should be automated and periodically verified.

---

# Data Retention

Storage policies should define:

- Retention period.
- Deletion rules.
- Recovery period.
- Archive strategy.

Deleted user content should follow applicable privacy regulations.

Current implemented behavior:

- `null`: retain Speaking Lab audio indefinitely.
- `0`: do not retain audio after processing; existing recordings are queued
  immediately when the learner selects this option.
- `7`, `30`, `90`, or `365`: delete audio after that many days.
- Audio deletion does not delete the learner's transcript or feedback.
- Deleting an account cascades database-owned messages, usage logs, learner
  facts, progress and related metadata, while private audio deletion survives
  in a retryable outbox until the storage provider confirms success.
- Completed deletion audit rows contain identifiers and status only, never
  audio or transcript content, and are purged after 30 days.
- Backup retention and erasure timelines depend on the production storage and
  backup providers and must be stated in the public Privacy Policy before beta.

---

# Future Expansion

Future storage may include:

- Video lessons.
- Live class recordings.
- Community uploads.
- Teacher resources.
- Downloadable courses.
- Certificates.

The storage architecture should support these additions without redesign.

---

# Success Definition

The Storage Architecture succeeds when HanGo can efficiently manage all educational and user-generated assets while remaining secure, scalable, cost-efficient, and independent from application business logic.

---

End of document.
