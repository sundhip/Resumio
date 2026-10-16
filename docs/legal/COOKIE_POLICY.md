# Resumio Cookie & Local Storage Policy (Template)

> [!WARNING]
> **LEGAL PLACEHOLDER & TEMPLATE ONLY**
> This document is an engineering template and architectural baseline provided for software demonstration purposes. It does **not** constitute formal legal advice. A qualified attorney licensed in your relevant jurisdiction must review, customize, and ratify this policy prior to commercial deployment.

**Effective Date:** October 16, 2026  
**Last Updated:** October 16, 2026  
**Version:** 1.0.0-TEMPLATE  

---

## 1. What Are Cookies and Local Storage?
Cookies and browser storage mechanisms (e.g., `localStorage`) are small data files placed on your device when you interact with Resumio. They allow the platform to maintain secure user sessions, remember UI theme preferences, and protect against security vulnerabilities.

## 2. Categories of Storage We Use

### A. Strictly Necessary (Essential) Cookies
These cookies are required for the platform to function securely. They cannot be deactivated without rendering the application inoperable.
| Identifier | Type | Expiry | Purpose |
| :--- | :--- | :--- | :--- |
| `resumio_access_token` | httpOnly Cookie | 15 Minutes | Stateless JWT carrying cryptographic signature and role permissions |
| `resumio_refresh_token` | httpOnly Cookie | 7 Days | Rotating refresh token with SHA-256 server-side session index |
| `resumio_csrf_token` | Secure Cookie | Session | Double-submit anti-CSRF token validated against custom request headers |

### B. Functional & Preference Storage
These keys persist your personalized platform settings across sessions.
| Identifier | Storage Type | Expiry | Purpose |
| :--- | :--- | :--- | :--- |
| `resumio_theme` | `localStorage` | Persistent | UI color theme preference (`light`, `dark`, or `system`) |
| `resumio_onboarding_dismissed` | `localStorage` | Persistent | Tracks dismissal state of role onboarding guided tour |
| `resumio_column_config` | `localStorage` | Persistent | Persists recruiter table column visibility and custom ordering |

### C. Analytics and Marketing Cookies
- **Zero Third-Party Advertising Trackers:** Resumio does **not** use third-party advertising cookies, behavioral re-targeting scripts, or cross-site tracking pixels (e.g., Facebook Pixel, Google Ads).
- **First-Party Telemetry:** OpenTelemetry tracing and Prometheus metrics are aggregated server-side without planting persistent device tracking identifiers.

## 3. Cookie Management and Opt-Out
Users can control and configure cookie preferences directly in their web browser settings. Disabling essential cookies (`resumio_access_token`) will prevent secure login and active platform usage.
