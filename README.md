# PACE IIT & Medical — AI Timetable Importer V4

## New combined-class behavior
If the same teacher appears for multiple batches at the **same date and time**, the Review screen now asks:

**“Is this a combined class?”**

- **Yes, combined class** → the overlap is accepted and the rows can be published together.
- **No, separate classes** → the overlap remains a **Conflict** and must be corrected.
- Missing date/batch/teacher/start/end → remains **Needs review**.

This is intentionally a review decision rather than automatically assuming that an overlap is an error.

## Run
Open `index.html` in a browser or deploy it to Vercel/another static host.

## AI connection
Set `SUPABASE_FUNCTION_URL` in browser local storage to your Supabase Edge Function URL. The included app expects the Edge Function to return `{ "rows": [...] }`.
