# Security Notes

This bot handles mental-health-related inquiries, so keep the production surface narrow and avoid storing sensitive clinical details unless staff have approved the workflow.

## Required Production Controls

- Store secrets only in Railway variables, never in Git.
- Set `NODE_ENV=production`.
- Set `REQUIRE_META_SIGNATURE=true`.
- Set `META_APP_SECRET` from the Meta app dashboard.
- Set `PAGE_ID` to the connected Facebook Page ID when available.
- Keep `OPENAI_MAX_OUTPUT_TOKENS` low to reduce cost and rambling.
- Do not put patient records, diagnoses, or private medical files into AI prompts or knowledge files.
- Keep `knowledge/st-judes-reference.md` limited to public, staff-approved facility information.

## Webhook Security

The app verifies Meta webhook POST signatures with `x-hub-signature-256` when `REQUIRE_META_SIGNATURE=true`. Meta webhook GET verification is still allowed without a signature because that is how webhook setup validation works.

## AI Safety

The app applies hard-coded checks before OpenAI:

- Crisis and emergency language receives emergency guidance.
- Prompt-injection attempts are blocked.
- Clearly unrelated requests, such as coding or schoolwork, are blocked.

The AI prompt also reinforces scope, but code-level checks should be treated as the primary boundary.

## Data Storage

Local JSON inquiry storage is simple, but production hosts may use ephemeral filesystems. For durable production storage on Railway, use one of these:

- Railway Postgres
- A Railway volume mounted to the app
- Another managed database approved by staff

When `DATABASE_URL` is set, the app stores inquiries in Postgres and automatically creates the `inquiries` table. In production, `DATABASE_URL` is required by config validation.

If using a volume, set `INQUIRIES_FILE` to a mounted path such as `/data/inquiries.json`.
