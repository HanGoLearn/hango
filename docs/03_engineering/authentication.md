# HanGo Authentication System

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the authentication and authorization architecture of HanGo.

The Authentication System is responsible for securely identifying users, protecting personal information, managing sessions, and controlling access to platform resources.

Authentication should remain invisible to learners while maintaining enterprise-level security.

---

# Authentication Philosophy

Authentication should be:

- Secure.
- Simple.
- Fast.
- Reliable.
- Cross-platform.

Learners should spend their time learning Chinese rather than managing accounts.

---

# Authentication Objectives

The Authentication System should:

- Identify users securely.
- Protect personal information.
- Maintain active sessions.
- Support multiple login providers.
- Synchronize progress across devices.
- Protect premium content.

---

# Authentication Flow

```
User

↓

Login Screen

↓

Authentication Service

↓

Identity Verification

↓

Session Creation

↓

Access Token

↓

Platform Access
```

---

# Supported Authentication Methods

HanGo supports multiple authentication providers.

---

## Email and Password

Traditional authentication.

Requirements:

- Email verification.
- Secure password storage.
- Password recovery.

---

## Google Sign-In

One-click authentication using Google OAuth.

Benefits:

- Faster registration.
- Better user experience.
- Trusted authentication.

---

## Apple Sign-In

Supported on Apple devices.

---

## Microsoft Account

Supported for enterprise and education users.

---

# Registration Flow

```
Create Account

↓

Verify Email

↓

Create Profile

↓

Select Native Language

↓

Select Chinese Level

↓

Learning Goals

↓

Dashboard
```

New learners should complete onboarding immediately after registration.

---

# Login Flow

```
Login

↓

Credentials Validation

↓

Session Creation

↓

Load User Profile

↓

Load Learning Progress

↓

Dashboard
```

Returning users should continue exactly where they left off.

---

# Session Management

Each session contains:

- User ID.
- Authentication Token.
- Refresh Token.
- Device Information.
- Session Timestamp.

Sessions should automatically expire after prolonged inactivity.

---

# Token Strategy

Authentication uses:

## Access Token

Short lifetime.

Used for API requests.

---

## Refresh Token

Long lifetime.

Used to generate new access tokens.

Refresh tokens should remain securely stored.

---

# Authorization

Authentication identifies the learner.

Authorization determines what they may access.

Possible permissions include:

- Free lessons.
- Premium lessons.
- AI Teacher.
- Speaking Lab.
- Writing Lab.
- Simulations.
- Administration.

Authorization should always be verified on the backend.

---

# User Roles

Current roles:

## Guest

Limited access.

No progress synchronization.

---

## Learner

Standard HanGo user.

---

## Premium Learner

Access to premium features.

---

## Administrator

Platform management.

---

Future roles:

- Teacher.
- Content Creator.
- Moderator.
- Enterprise Manager.

---

# Password Policy

Passwords should:

- Meet minimum security requirements.
- Never be stored in plain text.
- Always be hashed using modern algorithms.

Password recovery should never reveal existing passwords.

---

# Email Verification

Every email account should be verified before full activation.

Verification helps:

- Prevent fake accounts.
- Improve account recovery.
- Protect learner progress.

---

# Account Recovery

Recovery methods include:

- Email verification.
- Password reset.
- Identity confirmation.

Recovery should prioritize security over convenience.

---

# Device Management

Learners may access HanGo from multiple devices.

Supported devices:

- Desktop.
- Laptop.
- Tablet.
- Mobile.

Learning progress should synchronize automatically.

---

# Security Features

Authentication should support:

- HTTPS.
- Secure Cookies.
- CSRF Protection.
- Rate Limiting.
- Session Expiration.
- Device Verification.

Future features:

- Multi-Factor Authentication (MFA).
- Login Notifications.
- Suspicious Activity Detection.

---

# Privacy

Authentication data should remain separate from educational data.

Personally identifiable information should only be accessible to authorized services.

---

# Error Handling

Authentication errors should be:

- Clear.
- Helpful.
- Secure.

The system should never reveal whether an email exists during login or password recovery.

---

# Future Expansion

Future authentication capabilities may include:

- Passkeys.
- Biometric Login.
- Enterprise SSO.
- Classroom Invitations.
- Organization Accounts.

---

# Success Definition

The Authentication System succeeds when learners experience secure, seamless access to HanGo while their identities, learning progress, and personal information remain fully protected.

---

End of document.