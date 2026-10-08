# GemAI desktop app

## Run it on your computer (needs Node.js 20+)
    npm install
    npm start

## Build installers for Windows, macOS and Linux
Installers for each system must be built on that system, so use GitHub Actions:
1. Create a GitHub repo and upload everything in this folder.
2. Go to the repo's Actions tab, pick "Build installers", click Run workflow.
3. When it finishes, download the .exe, .dmg, .AppImage and .deb files from the run's Artifacts.
4. For public downloads: push a tag like v0.1.0 and the files appear under Releases.
   Put those Release links into the DOWNLOADS lines on your website.

## Connect it to your website (config.json)
- SITE_URL: your Base44 site address. "Sign in with Google" opens SITE_URL/app-login.
  After sign-in that page must redirect to gemai://auth?token=<session token>.
- API_BASE: base address of your backend. The app sends POST requests to:
  /me      -> { email, plan }              (plan: free | beginner | pro)
  /redeem  -> { ok, plan } or { error }    (body: { key })
  /chat    -> { reply }                    (body: { messages, mode })
  All requests carry "Authorization: Bearer <token>". Keep the AI provider key on the
  server only, never in this app.

## Notes
- Installers are unsigned. Windows shows a SmartScreen warning and macOS asks users to
  right-click > Open. Removing that needs a code-signing certificate / Apple Developer account.
- Edit author email and homepage in package.json before releasing (needed for the .deb).
