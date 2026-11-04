# Agri-Solution

Agri-Solution is a student project providing agriculture information and farmer-focused tools through a static HTML, CSS, and JavaScript website with a Node.js API.

## Features

- Homepage voice search with self-hosted Whisper Turbo, automatic GPU acceleration when available, and transcription after a pause. See [speech setup](speech/README.md).

- Crop guidance, schemes, soil and weather information, and district maps.
- Farmer registration and login backed by MongoDB.
- A farmer dashboard and browser-stored Vikray token queue.
- English and Hindi interface text, with a language choice prompt once per browser session.
- Focus-triggered voice input that translates short spoken phrases into the selected interface language.
- A floating home-page farming assistant powered by Gemini.
- Local rice disease classification with the trained EfficientNet-B2 model, confidence warnings, and authenticated prediction history.

## Requirements

- Node.js 18 or later and npm.
- MongoDB running locally or a MongoDB connection URI.
- Python speech/rice dependencies and the evaluated rice model bundle; see [rice model setup](rice_model/README.md). The current workspace already has these installed.

## Setup

From the repository root:

```powershell
npm install
npm run setup:speech
Copy-Item backend\.env.example backend\.env
```

Set `MONGO_URI` and `MONGO_DB` in `backend/.env` if the defaults do not match your MongoDB setup. Start MongoDB, then run:

```powershell
npm start
```

Set `GEMINI_API_KEY` in `backend/.env` to enable the home-page assistant and speech translation. The key is only used by the server and must not be added to browser code or committed. `GEMINI_MODEL` defaults to `gemini-flash-latest`; if that model is unavailable, the server discovers models enabled for the key and tries up to four compatible alternatives for the assistant.

Open `http://127.0.0.1:3000`. `npm start` launches the frontend, Node.js backend, speech worker, and trained rice disease detector together. It loads the rice model on CPU in a private FastAPI service at loopback port 8766, checks its health, then starts the website/API and speech worker. Speech communicates through internal pipes; wait for `Speech model ready` before using voice search. Ctrl+C stops the services launched by this command. The root server serves the pages and proxies `/api` requests to the Express application in the same process. Set `HOST` or `PORT` in the process environment to change the combined server address. `npm run start:rice` remains an alias for this same startup workflow. In PowerShell, use `npm.cmd start` if script execution policy blocks `npm`.

To run the API server by itself, use `node backend/server.js`. Its default port is `5000`; the backend `.env` file may set `PORT` for this standalone mode. The site pages are not served by the standalone API process.

## Project layout

```text
.
├── backend/
│   ├── server.js                 # Express app and standalone API entry point
│   ├── db.js                     # Compatibility export for the user repository
│   └── src/
│       ├── config/               # Environment loading and defaults
│       ├── controllers/          # HTTP request/response handlers
│       ├── errors/               # Application error types
│       ├── infrastructure/       # MongoDB persistence
│       ├── middleware/           # Async wrapping and API error responses
│       ├── routes/               # Versioned API route definitions
│       └── services/             # Authentication and business rules
├── controllers/                  # Static-site page request handling
├── models/                       # Page and crop data
├── routes/                       # Static-site routing
├── views/                        # File and EJS rendering
├── js/                           # Browser behavior and shared state
│   ├── state/
│   └── services/                 # Shared browser API client
├── style/                        # Stylesheets
├── images/                       # Website images
├── audios/                       # Audio assets and legacy page copies
└── *.html                        # Public pages; URLs remain at the site root
```

Canonical page URLs remain at the site root. Archived copies under `audios/` are retained for reference; generated desktop/Pako snapshots and unlinked placeholder backend files have been removed. Keep browser-only UI behavior in `js/`; API business rules belong in `backend/src/services/`, request handling in `controllers/`, and persistence in `infrastructure/`. Add new endpoints under `backend/src/routes/` and mount new API versions in `backend/server.js`.

## API

Versioned endpoints:

- `POST /api/v1/auth/register` — JSON body: `mobile`, `name`, `password`, and optional `district`.
- `POST /api/v1/auth/login` — JSON body: `mobile` and `password`.
- `POST /api/v1/chatbot/message` — JSON body: `language` (`en` or `hi`) and up to 12 recent `messages`, each with `role` (`user` or `model`) and `text`. Requires `GEMINI_API_KEY`; requests are rate-limited.
- `POST /api/v1/speech/transcribe` — 16 kHz mono PCM audio with a `language` query (`hi` or `en`; legacy `hi_in` and `en_us` also accepted). Uses the local speech model for all microphone inputs; requests are rate-limited.
- `POST /api/v1/speech/translate` — JSON body: `text` (up to 2000 characters) and output `language` (`en` or `hi`). Requires `GEMINI_API_KEY`; requests are rate-limited.

The original `/api/register` and `/api/login` endpoints remain available for existing pages. Both route sets use the same validation and service logic. Errors are returned as JSON with an `error` message; malformed JSON, oversized bodies, missing endpoints, duplicate accounts, and database outages have explicit responses.

The current browser session is held in `sessionStorage`, the selected language is remembered in `localStorage`, and the language prompt is shown once per browser session. Vikray token records are held in `localStorage`; these are browser-side application state, not server-side authorization or a production authentication token.

## Configuration

Backend settings are read in `backend/src/config/environment.js`. Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://127.0.0.1:27017` | MongoDB connection |
| `MONGO_DB` | `AgriSolution` | Database name |
| `JSON_BODY_LIMIT` | `16kb` | Maximum JSON request body |
| `PORT` | `5000` | Standalone API port |
| `GEMINI_API_KEY` | — | Server-side Gemini API key for the home-page assistant and speech translation |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model used by the assistant |

For the combined site and API server, `HOST` and `PORT` are read from the process environment; the site defaults to `127.0.0.1:3000`.
The browser API client defaults to `/api`; deployments on another API origin can set `window.AGRI_API_BASE_URL` before loading `js/services/api-client.js`.

## Validation

Hindi copy is maintained in `js/hindi-translations.js` and loaded before `js/auth-nav.js` on every page. The language layer preserves original text for switching back to English, translates dynamic content and accessible labels, and keeps form values and user names unchanged. Add new visible copy to the translation catalog when introducing content.

The browser regression check covers Hindi pages, language switching, weather, filters, form validation, dealer selections, district information, tokens, and Hindi notice downloads. With the site running, install the optional browser testing dependency and run:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
$env:AGRI_TEST_URL = 'http://127.0.0.1:3000'
node scripts/test-hindi.cjs
```

Check changed JavaScript syntax with:

```powershell
node --check backend/server.js
node --check backend/src/services/auth-service.js
node --check js/state/session-store.js
```

All voice recognition uses the local worker. Start with `npm start`; see [speech setup and custom model configuration](speech/README.md).
