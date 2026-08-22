# HanGo Deployment Strategy

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines how HanGo moves from local development to testing, beta, and production.

Its purpose is to ensure that deployments are controlled, repeatable, secure, observable, and reversible.

Deployment should never depend on undocumented manual steps.

---

# Deployment Philosophy

HanGo should be deployed gradually.

Every environment must have a clear purpose.

Every release must be:

- Tested.
- Traceable.
- Reproducible.
- Monitored.
- Reversible.

Production should never be used as a testing environment.

---

# Deployment Environments

HanGo uses four environments:

```text
Local

↓

Testing

↓

Staging / Closed Beta

↓

Production
```

Each environment must remain isolated.

---

# 1. Local Environment

## Purpose

Used for daily development.

## Characteristics

- Runs on the developer's machine.
- Uses local or development-only services.
- Uses development credentials.
- May use mocked external providers.
- Contains reproducible seed data.
- Must not contain real production data.

## Required Services

Depending on the approved architecture:

- Web application.
- Relational database.
- Local or development storage.
- Mock email service.
- Mock AI provider.
- Mock TTS provider.
- Mock STT provider.

Live external providers may be used only when specifically required.

---

# 2. Testing Environment

## Purpose

Used by automated tests and controlled integration tests.

## Characteristics

- Isolated test database.
- Temporary test data.
- Mocked external providers by default.
- Automated cleanup.
- No production credentials.
- No real learner information.

The testing environment should be disposable.

---

# 3. Staging / Closed Beta Environment

## Purpose

Used to validate production-like behavior before public release.

It may also serve as the closed beta environment.

## Characteristics

- Production-like infrastructure.
- Separate database.
- Separate storage.
- Separate credentials.
- Restricted access.
- Real monitoring.
- Real provider integrations when required.
- Controlled learner access.

Staging should resemble production closely enough to detect deployment and integration problems.

---

# 4. Production Environment

## Purpose

Used by public HanGo learners.

## Characteristics

- Strongest security controls.
- Production database.
- Production storage.
- Production provider credentials.
- Monitoring and alerting.
- Automated backups.
- Recovery procedures.
- Controlled deployment permissions.
- Formal release process.

Production changes must follow the release procedure defined in this document.

---

# Environment Isolation

Each environment must use separate:

- Database.
- Storage.
- Authentication configuration.
- OAuth credentials.
- AI credentials.
- TTS credentials.
- STT credentials.
- Email credentials.
- Analytics configuration.
- Monitoring configuration.
- Domain or subdomain where appropriate.

Data must not flow automatically between environments.

---

# Environment Variables

Configuration should be provided through environment variables or a secure secrets manager.

Examples of configuration categories:

- Application URL.
- Database connection.
- Authentication secret.
- OAuth credentials.
- Email provider credentials.
- AI provider credentials.
- TTS provider credentials.
- STT provider credentials.
- Storage credentials.
- Analytics identifiers.
- Monitoring identifiers.

---

# Environment Variable Rules

- Never commit secrets to version control.
- Never expose server-only secrets to the browser.
- Validate required variables at application startup.
- Use different credentials per environment.
- Rotate compromised credentials immediately.
- Document all required variables in a safe template.
- Avoid storing secrets in screenshots, logs, or documentation.

---

# Public and Private Variables

## Public Variables

May be exposed to the client only when intentionally designed for public use.

Examples:

- Public application URL.
- Public analytics identifier.
- Public OAuth client identifier when required.

## Private Variables

Must remain server-side.

Examples:

- Database credentials.
- Authentication secrets.
- OAuth client secrets.
- AI provider keys.
- TTS provider keys.
- STT provider keys.
- Storage secrets.
- Email provider secrets.

A variable should be treated as private unless explicitly confirmed otherwise.

---

# Deployment Pipeline

The deployment pipeline should follow this sequence:

```text
Code Change

↓

Pull Request

↓

Automated Checks

↓

Code Review

↓

Merge

↓

Build

↓

Deploy to Staging

↓

Smoke Test

↓

Approval

↓

Deploy to Production

↓

Production Verification

↓

Monitoring
```

No step should be skipped for significant releases.

---

# Continuous Integration Checks

Before deployment, the pipeline should run:

1. Dependency installation.

2. Formatting check.

3. Linting.

4. Type checking.

5. Unit tests.

6. Component tests.

7. Integration tests.

8. Build verification.

9. Selected end-to-end tests.

10. Security checks where configured.

A deployment must stop when a critical check fails.

---

# Build Requirements

A successful build must confirm:

- Application compiles.
- Required environment variables are available.
- Database client generation succeeds when applicable.
- Static assets are produced correctly.
- Server routes are valid.
- No forbidden secrets are bundled into client code.
- Type checking passes.
- Required tests pass.

---

# Branch Strategy

Recommended branch model:

```text
main

develop or staging branch when required

feature branches

fix branches
```

## Main Branch

Represents production-ready code.

Direct unreviewed changes should be avoided.

## Feature Branches

Used for individual features or tasks.

## Fix Branches

Used for controlled bug fixes.

The exact branch model may be simplified for a small team, but production history must remain clear.

---

# Pull Request Requirements

Every significant pull request should include:

- Purpose.
- Related task.
- Files changed.
- Database impact.
- Environment-variable impact.
- Security impact.
- Tests executed.
- Screenshots for visual changes.
- Mobile evidence when relevant.
- Known limitations.
- Rollback considerations.

---

# Database Migrations

Database migrations require special control.

---

## Migration Rules

- Every schema change must use a migration.
- Migrations must be committed.
- Migrations must be reviewed.
- Migrations must be tested against non-production data.
- Destructive migrations require explicit approval.
- Production migrations must be backed up or recoverable.
- Application compatibility must be considered during rollout.

---

## Safe Migration Sequence

Recommended sequence:

```text
Create Backward-Compatible Schema

↓

Deploy Migration

↓

Deploy Compatible Application Code

↓

Verify

↓

Remove Deprecated Fields Later
```

Avoid combining destructive schema changes with unverified application changes.

---

# Seed Data

Seed data is intended for:

- Local development.
- Automated tests.
- Initial approved educational content.
- Controlled staging setup.

Production seeding must be explicit and idempotent.

Seed scripts should not overwrite learner data.

---

# Educational Content Deployment

Educational content should be deployed separately from interface code when possible.

Content releases may include:

- New scenarios.
- New lessons.
- Dialogue corrections.
- Vocabulary corrections.
- Grammar corrections.
- Exercise corrections.
- Quiz corrections.
- Mission updates.
- Audio updates.

---

# Content Release Rules

- Validate content before publication.
- Preserve version history.
- Do not replace completed-lesson references unexpectedly.
- Test answer keys.
- Review Chinese accuracy.
- Review Pinyin.
- Review translations.
- Confirm audio associations.
- Record important corrections in `changelog.md`.

---

# File and Audio Deployment

Stored assets may include:

- Dialogue audio.
- Vocabulary audio.
- Lesson illustrations.
- Learner recordings.
- AI-generated resources.

Deployment must preserve the distinction between:

- Public assets.
- Private learner assets.
- Generated reusable assets.
- Temporary processing files.

Private learner assets must never become publicly accessible during deployment.

---

# External Service Configuration

HanGo may depend on:

- Authentication providers.
- Email provider.
- AI provider.
- Text-to-Speech provider.
- Speech-to-Text provider.
- Storage provider.
- Analytics service.
- Monitoring service.
- Payment provider in future versions.

Each integration must be configured separately by environment.

---

# External Service Validation

Before production release, verify:

- Credentials.
- Callback URLs.
- Allowed origins.
- Rate limits.
- Usage limits.
- Billing controls.
- Failure behavior.
- Monitoring.
- Data processing implications.
- Fallback behavior.

---

# Authentication Deployment Requirements

Before release, verify:

- Production application URL.
- OAuth redirect URLs.
- Secure cookies.
- Session expiration.
- Email verification links.
- Password reset links.
- Allowed domains.
- HTTPS.
- Authentication secrets.
- Protected routes.

Authentication links must never point to local or staging URLs in production.

---

# AI Deployment Requirements

Before enabling AI features in production, verify:

- Provider credentials.
- Server-side invocation.
- Rate limiting.
- Usage logging.
- Cost tracking.
- Input limits.
- Output limits.
- Timeout behavior.
- Retry behavior.
- Fallback response.
- Context privacy.
- Prompt version.

Prompt changes should be treated as release changes because they can alter product behavior.

---

# Audio Deployment Requirements

Before enabling audio features, verify:

- TTS credentials.
- STT credentials.
- Supported audio formats.
- Upload limits.
- Private storage.
- Signed access.
- Retention rules.
- Provider failure handling.
- Mobile browser behavior.
- Audio cost tracking.

---

# Feature Flags

Feature flags may be used to release unstable or costly features safely.

Possible flagged features:

- AI Teacher.
- Speaking Lab.
- Writing Lab.
- Voice missions.
- New scenarios.
- Premium functionality.
- New AI provider.
- New progress algorithm.

Feature flags should have:

- Clear owner.
- Default state.
- Environment behavior.
- Removal plan.

Flags should not accumulate indefinitely.

---

# Closed Beta Deployment

The closed beta should use controlled access.

Possible access methods:

- Invite-only registration.
- Approved email list.
- Beta access code.
- Manually assigned beta role.

---

# Closed Beta Requirements

Before beta deployment:

- Core learning loop passes.
- Monitoring is active.
- Error reporting works.
- Costs are measurable.
- Support channel exists.
- Data backups are active.
- Privacy information is available.
- Critical defects are resolved.
- Beta limitations are documented.

---

# Production Release Types

## Standard Release

Used for normal planned updates.

Includes:

- Full automated checks.
- Staging deployment.
- Manual verification.
- Production deployment.
- Post-release monitoring.

## Hotfix

Used for urgent production defects.

Includes:

- Smallest safe change.
- Focused tests.
- Explicit approval.
- Immediate production verification.
- Follow-up regression testing.

## Content-Only Release

Used for approved content corrections or additions.

Includes:

- Content validation.
- Linguistic review.
- Reference verification.
- Publication.
- Content smoke test.

---

# Release Versioning

HanGo should use clear release versions.

Recommended format:

```text
Major.Minor.Patch
```

Example:

```text
1.0.0
```

## Major

Large incompatible product or architecture change.

## Minor

New backward-compatible functionality.

## Patch

Bug fix, content correction, or minor improvement.

Early development may use:

```text
0.x.x
```

until the first stable public release.

---

# Release Checklist

Before production deployment, verify:

## Code

- [ ] Approved code merged.
- [ ] Build passes.
- [ ] Type checking passes.
- [ ] Linting passes.
- [ ] Required tests pass.
- [ ] No unresolved critical defect exists.

## Database

- [ ] Migration reviewed.
- [ ] Backup confirmed.
- [ ] Migration tested.
- [ ] Rollback or recovery plan exists.

## Configuration

- [ ] Environment variables verified.
- [ ] Provider credentials verified.
- [ ] Domains verified.
- [ ] OAuth callbacks verified.
- [ ] Feature flags verified.

## Product

- [ ] Core learning loop tested.
- [ ] Desktop tested.
- [ ] Mobile tested.
- [ ] AI Teacher tested.
- [ ] Audio tested.
- [ ] Speaking tested when included.
- [ ] Writing tested when included.
- [ ] Progress tested.

## Operations

- [ ] Monitoring active.
- [ ] Alerts active.
- [ ] Error tracking active.
- [ ] Backup active.
- [ ] Support contact available.
- [ ] Rollback procedure confirmed.

---

# Deployment Procedure

Recommended production procedure:

1. Confirm release candidate.

2. Freeze unrelated changes.

3. Run full required checks.

4. Confirm database backup.

5. Deploy compatible database migrations.

6. Deploy application.

7. Verify application startup.

8. Run production smoke tests.

9. Confirm monitoring.

10. Observe errors and performance.

11. Approve release or initiate rollback.

---

# Production Smoke Tests

Immediately after deployment, verify:

- Landing page loads.
- Registration loads.
- Login works.
- Protected routes work.
- Dashboard loads.
- Learning Journey loads.
- Scenario opens.
- Lesson opens.
- Progress can be saved.
- AI Teacher responds.
- Dialogue audio plays.
- Speaking recording works when enabled.
- Writing submission works when enabled.
- Monitoring receives events.

Smoke tests should use dedicated test accounts.

---

# Monitoring

Production monitoring should cover:

- Application availability.
- Server errors.
- Client errors.
- Database health.
- Authentication failures.
- AI failures.
- TTS failures.
- STT failures.
- Storage failures.
- Upload failures.
- Response latency.
- Provider usage.
- Provider cost.
- Background-job failures when applicable.

---

# Alerts

Alerts should exist for:

- Application unavailable.
- Large increase in server errors.
- Database unavailable.
- Authentication failure spike.
- AI failure spike.
- Audio failure spike.
- Storage access failure.
- Unusual cost increase.
- Backup failure.
- Security event.

Alerts should be actionable and routed to a responsible person.

---

# Logging

Logs should support diagnosis without exposing sensitive data.

Logs may include:

- Request identifier.
- Timestamp.
- Environment.
- Service.
- Error category.
- Non-sensitive user reference.
- Provider status.
- Duration.
- Retry result.

Logs should not include:

- Passwords.
- Tokens.
- Provider keys.
- Complete private prompts.
- Voice recordings.
- Full private writing submissions.
- Sensitive personal information.

---

# Analytics Deployment

Analytics should be enabled only after verifying:

- Event names.
- Environment separation.
- Privacy requirements.
- Data minimization.
- Test-event exclusion.
- User-consent requirements where applicable.

Production analytics should not be contaminated by local or staging events.

---

# Backup Strategy

Production backups should cover:

- Relational database.
- Educational content.
- Critical configuration.
- Private storage where required.
- User-generated content according to retention policy.

---

# Backup Requirements

- Automated schedule.
- Retention policy.
- Encryption.
- Access restriction.
- Backup-failure alert.
- Periodic restoration testing.
- Documentation.

A backup is not trusted until restoration has been tested.

---

# Recovery Objectives

The project should define:

## Recovery Point Objective

Maximum acceptable data loss period.

## Recovery Time Objective

Maximum acceptable time to restore service.

Exact values should be established before public production release based on infrastructure and business requirements.

---

# Rollback Strategy

Every production release should have a rollback plan.

Possible rollback actions:

- Revert application version.
- Disable feature flag.
- Restore previous configuration.
- Roll back compatible migration when safe.
- Deploy corrective migration.
- Disable unstable provider integration.
- Temporarily disable a failing module.

Database rollback requires special caution because destructive reversal may cause data loss.

---

# Rollback Conditions

Rollback should be considered when:

- Core application is unavailable.
- Authentication fails broadly.
- Learner data is at risk.
- Progress cannot be saved.
- Security vulnerability is introduced.
- Database corruption occurs.
- AI or audio costs increase uncontrollably.
- A release causes severe performance degradation.

---

# Incident Response

A production incident should follow this sequence:

```text
Detect

↓

Assess Severity

↓

Contain

↓

Communicate

↓

Recover

↓

Verify

↓

Document

↓

Prevent Recurrence
```

---

# Incident Record

Each significant incident should document:

- Date and time.
- Environment.
- Impact.
- Affected functionality.
- Root cause.
- Immediate response.
- Recovery action.
- Data impact.
- Preventive tasks.
- Responsible owner.

---

# Security During Deployment

Deployment access should follow least privilege.

Requirements:

- Restricted production access.
- Protected deployment credentials.
- Multi-factor authentication where supported.
- Audit trail.
- No shared personal credentials.
- Immediate removal of obsolete access.
- Secret rotation when needed.

---

# Dependency Management

Dependencies should be updated carefully.

Before a major dependency update:

- Review release notes.
- Review breaking changes.
- Review security impact.
- Test locally.
- Test in staging.
- Run regression tests.
- Confirm rollback path.

Automatic dependency updates should not deploy directly to production without review.

---

# Cost Control

HanGo depends on potentially variable-cost services.

Monitor:

- AI tokens.
- TTS generation.
- STT transcription.
- Storage usage.
- Data transfer.
- Database usage.
- Email volume.
- Monitoring volume.

---

# Cost Protection

Use:

- Rate limits.
- Usage quotas.
- Audio caching.
- Duplicate-generation prevention.
- Input limits.
- Output limits.
- Budget alerts.
- Feature flags.
- Provider fallbacks where appropriate.

Unexpected cost increases should trigger investigation.

---

# Deployment Documentation

The project should maintain:

- Environment setup instructions.
- Environment variable template.
- Deployment commands.
- Migration commands.
- Rollback procedure.
- Backup procedure.
- Restoration procedure.
- Smoke-test checklist.
- Incident procedure.
- Provider configuration notes.

Deployment knowledge must not exist only in one person's memory.

---

# Initial MVP Deployment Scope

For the initial internal MVP, deployment must support:

- One web application.
- One relational database.
- Object storage when audio or recordings are enabled.
- Authentication.
- AI Teacher provider.
- Basic monitoring.
- Error tracking.
- Controlled environment variables.

Complex distributed infrastructure is not required.

---

# Deferred Deployment Complexity

The MVP does not require:

- Multi-region deployment.
- Kubernetes.
- Microservice orchestration.
- Active-active databases.
- Advanced edge architecture.
- Multiple production regions.
- Automated global failover.
- Complex service mesh.
- Independent deployment pipelines for every module.

These should be introduced only when real scale justifies them.

---

# Deployment Acceptance Criteria

The deployment system is acceptable when:

- Local setup is reproducible.
- Testing is isolated.
- Staging resembles production.
- Production secrets remain protected.
- Required checks run before release.
- Database migrations are controlled.
- Production smoke tests exist.
- Monitoring and alerts are active.
- Backups are active.
- Restoration has been tested.
- Rollback is documented.
- Provider costs are observable.
- A release can be traced to its code and version.

---

# Success Definition

The HanGo deployment strategy succeeds when the application can move safely from development to production through repeatable, monitored, and reversible releases without exposing secrets, losing learner data, or disrupting the core learning experience.

---

End of document.