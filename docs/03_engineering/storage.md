# HanGo Storage Architecture

Version: 1.0

Status: Official

Last Updated: August 2026

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