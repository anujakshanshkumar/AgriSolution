# Mobile implementation checklist

## Findings
- Root HTTP server routes `/api` to Express and pages to the existing controller/model/file view. EJS renders crop lists/details; other pages are HTML/CSS/plain JavaScript.
- MongoDB `users` is the shared user store. Passwords use scrypt; legacy plaintext passwords upgrade on successful login. Existing login returned profile data with no authenticated server session.
- Website Vikray tokens were per-browser localStorage records. No production procurement, payment, market-price, password-recovery, profile-edit or upload service exists.
- Public content: 31 crops, 15 scheme cards with eligibility and links, 34 district entries, 5 soils, 6 weather locations, 3 notices, procurement selectors and about/team content. Some procurement areas are PHP/SQL placeholders and district images are missing.
- Website colors: #004d40, #183b2b, #f9f9f9; system typography; reused logo.jpg and hero artwork. Hindi dictionary reused for matching text. Open-Meteo weather; Gemini chat and local model speech are server integrations.
- Private configuration exists only in backend/.env. Values were not printed or copied. Static file serving needed an allowlist to protect backend and mobile source/config.
- Workspace already contained extensive staged and unstaged edits; those are preserved.

## Checklist
- [x] Inspect architecture, page flows, assets, API and build environment.
- [x] Add public content API using website source; preserve page routes.
- [x] Add hashed opaque sessions, profile fetch, logout, password change and authorized shared produce-token APIs in the same MongoDB.
- [x] Update website login response/session client and token UI to use shared data.
- [x] Build native Expo Router screens and centralized API/storage layer.
- [x] Run TypeScript, lint, tests, bundle checks and backend regression checks (see `mobile/VERIFICATION.md`; mobile tests now pass 9/9).
- [x] Fix stale session-expiry responses invalidating new logins and reservation responses updating screens after navigation/account changes.
- [x] Provision the local JDK/Android SDK and add `mobile/scripts/build-apk.ps1` for a standalone development-signed APK build.
- [ ] Complete the running native Android build and verify the actual APK file/signature before reporting its path.
- [ ] Run device acceptance tests and iOS build.
