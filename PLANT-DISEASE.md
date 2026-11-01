# Plant Disease Detection

This feature extends the existing HTML/CSS/JavaScript website, Node page router, Express API, MongoDB database, and bearer sessions. It does not replace the website or create another production database. The dashboard links to `/plant-disease.html`.

The default `npm start` workflow runs the trained local rice classifier, speech, frontend and backend together. Choosing an image, taking a camera photo, or dropping an image starts analysis immediately; no crop questions or submit button are required. The prediction appears first, with disease candidates in red and healthy results in green. Gemini then fills in **Medicines and how to apply**, **What causes this condition?**, and **What happens if left untreated?**. Care guidance uses the saved prediction, not the uploaded image, in local-rice mode. A Gemini failure leaves the prediction visible with an independent guidance retry.

## Configuration and startup

From `C:\Users\anuja\OneDrive\AgriSolution`:

```powershell
npm.cmd install
```

Add these settings to the existing **server-only** `backend/.env`. Preserve its existing database and other provider settings. Do not commit this file or put these variables in the Expo app.

```dotenv
PLANT_DISEASE_AI_PROVIDER=gemini
PLANT_DISEASE_AI_API_KEY=
PLANT_DISEASE_AI_MODEL=gemini-3.8-flash
PLANT_CARE_AI_MODEL=gemini-flash-lite-latest
PLANT_DISEASE_MAX_FILE_SIZE_MB=10
PLANT_DISEASE_REQUEST_TIMEOUT_MS=60000
```

An empty dedicated key uses the existing `GEMINI_API_KEY` when available. For separate keys, set `PLANT_DISEASE_AI_API_KEY` to the disease/treatment key and keep `GEMINI_API_KEY` as the chatbot key in `backend/.env`. Restart the server after changing keys or the model, then use **Retry care guidance** on the report. Use a model available to the disease key's Google project in `PLANT_DISEASE_AI_MODEL`. Never put keys in browser JavaScript or commit them.

The chatbot discovers compatible Gemini text models using its own key and caches the list for five minutes. It tries up to four models within the existing 30-second request deadline, with a 15-second maximum per attempt. Unavailable models, transient errors and model quota failures can trigger fallback. Credential and safety rejections stop immediately. Model discovery and fallback cannot guarantee availability during project-wide quota limits or outages. Treatment guidance uses the separate disease key after classification to populate **Treatment Required**, **How to apply**, causes, and untreated progression; it generates guidance from the saved assessment and does not perform live web search.

`npm start` selects `local_rice` for classification and uses these Gemini credentials/model for care guidance. To use Gemini image analysis instead, set the provider above and run `node scripts/start.js`. The page describes which data is sent to Google: the saved condition for local-rice care guidance, or the photo for Gemini image analysis. The key remains server-side.

```powershell
npm.cmd start
```

Open `http://127.0.0.1:3000/login.html`, log in, then select **Plant Disease Detection** in the dashboard. Choose or capture a JPEG, PNG, or WebP photo; detection starts automatically. Reports, including generated care guidance, can be reopened and deleted from the history on the same page.

If no usable key/provider configuration exists, the feature displays a setup message while the other portal services remain available. Restart the Node server after changing environment settings.

## Data and API behavior

New Gemini care reports use short, everyday Hindi or English, with one action per sentence and practical steps first. Medicine cards include a generic name, active ingredients with strength and formulation (the packet composition, not a molecular formula or spray dose), and a sentence to show a licensed local dealer. The prompt prefers established affordable Indian options suitable for Chhattisgarh, without claiming live local stock or current approval. It asks farmers to confirm the exact crop/disease label and have application amounts and waiting times read aloud. Uncertain formulations are omitted rather than guessed. Previously saved guidance remains readable; generate a new assessment to receive the updated format.

Reference checks for this guidance design: [IGKV regional advisory](https://igkv.ac.in/%28X%281%29S%28ehln3tzwhiqzbiaqofb4aqyy%29%29/_Attachment/web/news_notificaiton/2021/0/7/AGROMET%20ADVISORY_-_1608_20211020113656_6_2ae562b0.pdf) and [PPQS product label example](https://ppqs.gov.in/sites/default/files/tricyclazole_20.4_azoxystrobin_6.8_sc93fdow_agrosciences_india_p_ltd_1.pdf). These illustrate regional active-ingredient advice and product-specific formulations; they do not verify current shop inventory. No universal spray dose or brand catalogue is hard-coded.

All endpoints below require the existing `Authorization: Bearer …` session:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/plant-disease/config` | Safe availability, upload limit, and timeout settings |
| POST | `/api/plant-disease/analyze` | Multipart `image`, optional `crop`, `symptoms`, and `language` (`en` or `hi`) |
| GET | `/api/plant-disease/history` | Current user's saved reports |
| GET | `/api/plant-disease/history/:id` | Reopen an owned report |
| POST | `/api/plant-disease/history/:id/guidance` | Generate care guidance for an owned report, or return its saved guidance |
| DELETE | `/api/plant-disease/history/:id` | Delete an owned report |

Images are held in bounded memory, checked by signature and decoder, and re-encoded without metadata before the provider request. No upload directory or persistent image storage is used. MongoDB stores the owner ID, selected crop, timestamp, and normalized report. It does not store the photograph or provider key. The external provider's retention/data-use rules remain applicable.

Model output is validated on the server and rendered as text in the browser. Observations are separated from possible diagnoses. Healthy-looking, possible disease, deficiency, pest damage, stress, inconclusive, and unsupported-image outcomes are supported. Gemini does not provide a calibrated disease probability, so numerical confidence is omitted. A photograph cannot confirm disease; uncertain results recommend an agricultural expert. Pesticide doses and definitive prescriptions are excluded from the analysis instructions.

Local-rice confidence is validation-calibrated and kept separate from Gemini's care text. Care guidance is schema-validated, sanitized and stored inside the owned report. The prompt requests relevant active ingredients/control options, application methods and precautions, without inventing label doses or guaranteed cures. Healthy and low-confidence results have no medicine cards. Untreated progression uses conditional ranges when supportable and explicitly acknowledges when days cannot be estimated. An image cannot establish the infection date, local product approval or future yield loss. Diagnosis and guidance have separate rate/concurrency limits; cached guidance does not call Gemini again.

Bearer credentials are supplied explicitly in request headers; the API does not authenticate using ambient cookies. History queries include the authenticated owner. Rate and concurrency limits bound uploads/provider requests within one server process; deployment across several instances requires shared limits at a gateway or data store.

## Provider integration

The adapter uses Google's documented HTTPS `generateContent` endpoint with inline image input and a JSON response schema. The model is configurable; changing provider requires an adapter returning the same normalized schema. An unsupported provider fails clearly rather than using mock output.

Primary references: [image inputs](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding), [structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [model catalog](https://ai.google.dev/gemini-api/docs/models), [Multer upload middleware](https://expressjs.com/en/resources/middleware/multer/), and [Sharp decoder limits](https://sharp.pixelplumbing.com/api-constructor/).

## Troubleshooting

- **Automatic care-model fallback:** treatment guidance discovers compatible text models using the disease key and tries up to four, with 15 seconds per generation attempt. Slow/unreachable models, model errors, quota responses, and invalid structured guidance trigger another attempt. Credential or safety rejections stop immediately. Each selected model receives its appropriate generation settings, and only validated guidance is saved. Model visibility does not guarantee free-tier quota; project-wide quota exhaustion still requires waiting or checking the Google project.
- **Slow treatment guidance:** `PLANT_CARE_AI_MODEL` selects the text-guidance model independently of image analysis. It defaults to `gemini-flash-lite-latest`; a live validated rice-blast request took about 3.8 seconds during testing, but latency varies. The page displays all care sections after the complete JSON response is validated. Restart the server after changing the model.
- **Request limits:** local rice detection allows 30 uploads per user per minute (120 per IP). Gemini analysis and care guidance each allow 10 requests per user per five minutes (40 per IP). Server/provider failures do not consume the allowance. Concurrent duplicate requests remain blocked, and the page shows the server's specific limit or concurrency message. Restarting the server clears these in-memory counters.
- **Authentication:** log in again if the portal session expired. A provider key rejection requires checking the server key/project restrictions, not changing the farmer's password.
- **Quota/billing:** check the provider project's quota and billing. Repeatedly retrying cannot resolve missing quota.
- **Model error:** verify `PLANT_DISEASE_AI_MODEL` is available to the configured key and supports images and structured responses.
- **Timeout/network:** treatment guidance has a two-minute server deadline, with five extra seconds for the browser response. Guidance failures display the server's sanitized reason and a retry button. Check outbound HTTPS to `generativelanguage.googleapis.com`; retry after connectivity recovers. Never disable TLS verification.
- **Upload:** use a clear, still JPEG/PNG/WebP image within the configured size and pixel limits. Renaming another file to `.jpg` does not make it valid.
- **History unavailable:** check the existing MongoDB connection. No destructive migration is required.

## Verification

Implementation and test results are recorded here when the checks finish. Test fixtures are confined to `scripts/fixtures` and injected test providers; production has no mock fallback.
