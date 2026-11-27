# Microsoft Learning Hub — Demo

A responsive React prototype for course discovery, self-paced learning, assignment submission, assessments, certification tracking, and administrator/instructor previews. This is a demo experience, not an official Microsoft product.

## Run locally

```powershell
npm install
npm run dev
```

Use the prefilled demo account, or enter any email address and password. Organizational sign-in is simulated.

## Demo workflows

- Browse and filter the course catalog, open a course, enroll, and complete lessons.
- Upload a PDF, DOCX, PPTX, or ZIP assignment (up to 25 MB) to simulate submission.
- Complete the Azure Fundamentals knowledge check and see evaluated results.
- Preview sample certifications and download a generated sample certificate PDF.
- Preview Instructor and Administrator pages by selecting **Switch role preview** in the sidebar.
- Run sample grading, certificate, reminder, and reporting jobs from the Admin dashboard.

## Integration boundary

Mock content is isolated in `src/data.js`. `src/services/learningApi.js` provides an API request boundary configured with `VITE_API_BASE_URL`; connect that endpoint to Azure Functions and back it with Entra ID, Azure SQL, Blob Storage, Storage Queue, and Application Insights as required. No backend services or real identity flows are included in this prototype.
