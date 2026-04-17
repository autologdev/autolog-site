# AutoLog Web App — Analytics & Storage Audit

<!--
| File | Type | Key / Event Name | Classification | Action Required |
|------|------|-----------------|----------------|-----------------|
| app/app-common.js | localStorage.getItem/setItem | al_vid | ESSENTIAL | None — strictly necessary for vehicle selection UX |
| app/dashboard.html | localStorage.setItem | al_first_action_prompted_{userId} | FUNCTIONAL-BORDERLINE | Gate behind consent (conservative path taken) |
| app/dashboard.html | localStorage.setItem | al_history_prompt_{userId} (inline dismiss) | FUNCTIONAL-BORDERLINE | Gate behind consent (conservative path taken) |
| app/dashboard.html | analytics_events insert | vehicle_added | ANALYTICS-NEEDS-CONSENT | Gated via consent check |
| app/settings.html | analytics_events insert | paywall_viewed | ANALYTICS-NEEDS-CONSENT | Gated via consent check |
| app/fuel.html | analytics_events insert | first_action_taken (fuel) | ANALYTICS-NEEDS-CONSENT | Gated via consent check |
| app/service.html | analytics_events insert | first_action_taken (service) | ANALYTICS-NEEDS-CONSENT | Gated via consent check |
| app/documents.html | analytics_events insert (inline logEvent) | first_action_taken (document), document_uploaded, paywall_viewed | ANALYTICS-NEEDS-CONSENT | Gated via consent check |
| app/app-common.js | function logEvent() | analytics_events | ANALYTICS-NEEDS-CONSENT | Gate — modified to check AutoLogConsent |
| All /app/*.html | Supabase CDN script | sb-{ref}-auth-token in localStorage (automatic) | ESSENTIAL | None — session persistence, strictly necessary |
| All /app/*.html | No document.cookie usage found | — | — | None |
| index.html | No analytics/logEvent calls | — | — | None on marketing pages |
| index.js | No analytics/logEvent calls | — | — | None on marketing pages |
| app/documents.html | fetch() to mechanic.autologapp.co.uk | ai-classify / ai-classify-enhanced | ESSENTIAL | Functional feature, not analytics |
| app/dashboard.html | fetch() to mechanic.autologapp.co.uk | dvla-lookup | ESSENTIAL | Functional feature, not analytics |
-->

## Summary

- All analytics (analytics_events inserts) are first-party Supabase inserts — no third-party SDK
- No cookies set manually anywhere
- No GA, Mixpanel, Hotjar, Meta Pixel or any external tracking scripts
- Two localStorage keys are functional-borderline (banner dismissal flags) — treated conservatively and gated behind consent
- al_vid and Supabase auth tokens are ESSENTIAL and must never be gated or cleared by consent logic
