# Microsoft Learning Hub — Demo

A responsive React prototype for course discovery, self-paced learning, assignment submission, assessments, certification tracking, account preferences, and instructor/administrator previews. This is a demo experience, not an official Microsoft product.

## Run locally

```powershell
npm install
npm run dev
```

By default, sign in with any email address and password. Demo authentication is simulated locally; credentials are not sent to a service. Course enrollment and progress, assignment metadata, assessment drafts/results, notification state, profile details, and preferences are stored in browser storage. Uploaded file contents are not persisted.

## Optional Microsoft Entra sign-in

The app uses MSAL Browser when `VITE_ENTRA_CLIENT_ID` is set. Register a single-page application in Microsoft Entra ID and configure the redirect URI for the local or deployed origin. Set the client ID and, if required, tenant authority in a local `.env` file:

```env
VITE_ENTRA_CLIENT_ID=
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/organizations
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_API_BASE_URL=
VITE_ENTRA_API_SCOPE=
```

`VITE_ENTRA_API_SCOPE` is an exposed API scope for the Learning Hub API, not a client secret. Do not put secrets in Vite environment variables. Entra authentication only becomes active when configured with a valid app registration and redirect URI.

## Demo workflows

- Browse and filter the course catalog, open a course, enroll, and complete lessons.
- Upload a PDF, DOCX, PPTX, or ZIP assignment (up to 25 MB) to simulate submission.
- Complete the Azure Fundamentals knowledge check and see evaluated results.
- Preview sample certifications and download a generated sample certificate PDF.
- Open the profile menu to edit demo profile details, update notification preferences, change the demo role, and sign out.
- Preview Instructor and Administrator pages from **Demo role preview**. This only changes frontend navigation and is not authorization.
- Run sample grading, certificate, reminder, and reporting jobs from the Admin dashboard.

## Integration boundary

Mock content is isolated in `src/data.js`. `src/services/learningApi.js` provides an API request boundary configured with `VITE_API_BASE_URL`; when Entra is enabled, API calls include an access token for the configured scope. Connect that endpoint to Azure Functions and back it with Azure SQL, Blob Storage, Storage Queue, and Application Insights as required. This repository does not include Azure infrastructure or backend authorization. Protect every API and storage operation server-side; frontend role checks are UX only. Without valid Entra app registration and Azure service configuration, those integrations are not active.
