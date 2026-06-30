# Railway Deployment

## 1. Prepare the Repository

Commit these files to the repository:

- `package.json`
- `package-lock.json`
- `railway.json`
- `src/`
- `.env.example`
- `README.md`
- `SECURITY.md`

Do not commit `.env`.

## 2. Create the Railway Service

1. Create a new Railway project.
2. Deploy from the GitHub repository.
3. Railway should detect the Node.js app.
4. The included `railway.json` sets:
   - Start command: `npm start`
   - Health check: `/health`
   - Restart policy: restart on failure

## 3. Set Railway Variables

Set these variables in Railway:

```env
NODE_ENV=production
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
VERIFY_TOKEN=your_custom_webhook_verify_token
META_APP_SECRET=your_meta_app_secret
REQUIRE_META_SIGNATURE=true
PAGE_ID=your_facebook_page_id

AI_ENABLED=true
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-nano
OPENAI_MAX_OUTPUT_TOKENS=160

BUSINESS_ADDRESS=Lot 2 & 3, Interior E. Rodriguez Avenue, Barangay San Isidro, Taytay, 1920 Rizal
GOOGLE_MAPS_LINK=https://maps.app.goo.gl/k9NgWQu7TdQXc9nV8
CONTACT_NUMBER=09992206813
LANDMARK_INSTRUCTIONS=Interior E. Rodriguez Avenue, Barangay San Isidro, Taytay, Rizal

INQUIRIES_FILE=./data/inquiries.json
KNOWLEDGE_BASE_FILE=./knowledge/st-judes-reference.md
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=false

NOTIFICATION_PROVIDER=none
NOTIFICATION_SLACK_WEBHOOK_URL=

STAFF_INBOX_ENABLED=false
STAFF_INBOX_USERNAME=
STAFF_INBOX_PASSWORD=
STAFF_INBOX_LOCAL_ONLY=true

JSON_BODY_LIMIT=256kb
GENERAL_RATE_LIMIT_WINDOW_MS=900000
GENERAL_RATE_LIMIT_MAX=600
WEBHOOK_RATE_LIMIT_WINDOW_MS=60000
WEBHOOK_RATE_LIMIT_MAX=300
```

Production startup validates the public business details before the app can pass Railway health checks. `BUSINESS_ADDRESS`, `GOOGLE_MAPS_LINK`, `CONTACT_NUMBER`, and `LANDMARK_INSTRUCTIONS` must be real, staff-approved St Jude information. Empty values and filler such as `[BUSINESS_ADDRESS]`, `replace_with...`, `your_...`, `TBD`, `example`, `placeholder`, generic `address here`, fake phone numbers, or non-Google Maps links are rejected.

For durable inquiry storage, add Railway Postgres and set `DATABASE_URL` from the Postgres service. The app automatically creates the `inquiries` table on startup. If using an external Postgres provider that requires SSL, set `DATABASE_SSL=true`.

## 4. Enable New Inquiry Notifications

The notification layer is provider-driven. Keep it disabled with:

```env
NOTIFICATION_PROVIDER=none
```

To alert staff immediately when a new inquiry is saved, create a Slack incoming webhook for the private staff channel that should receive alerts, then set:

```env
NOTIFICATION_PROVIDER=slack
NOTIFICATION_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

The bot sends a concise alert with the inquiry type, status, Messenger user ID, saved inquiry ID, timestamp, and captured answers. Inquiry storage happens first; if Slack is unavailable, the inquiry remains saved and the notification failure is logged for follow-up.

## 5. View Railway Inquiries Locally

For a local-only staff interface connected to Railway data:

1. Copy the Railway Postgres `DATABASE_URL` into your local `.env`.
2. Set `STAFF_INBOX_ENABLED=true`.
3. Set `STAFF_INBOX_USERNAME` and `STAFF_INBOX_PASSWORD`.
4. Keep `STAFF_INBOX_LOCAL_ONLY=true`.
5. Run `npm run dev`.
6. Open `http://localhost:3000/staff/inquiries`.

This keeps the staff inbox on your computer while reading the same inquiry database used by the Railway app. Do not enable `STAFF_INBOX_ENABLED=true` in Railway until you are ready to expose and secure it for production staff access.

## 6. Configure Meta Webhook

In Meta for Developers, set the callback URL to:

```text
https://your-railway-domain.up.railway.app/webhook
```

Use the same value as `VERIFY_TOKEN` for webhook verification.

Subscribe the connected page to:

- `messages`
- `messaging_postbacks`

## 7. Smoke Test

After deploy:

1. Open `https://your-railway-domain.up.railway.app/`.
2. Confirm it says the Messenger bot is running.
3. Open `https://your-railway-domain.up.railway.app/health`.
4. Confirm it returns `{"ok":true,"service":"st-jude-messenger-bot"}`.
5. Send `Hello` to the Facebook Page in Messenger.
6. Send `make a python app` and confirm the bot refuses as out-of-scope.
7. Send an actual facility inquiry and confirm the AI stays scoped to St Jude's.
8. Confirm the configured Slack channel receives a new inquiry alert after the inquiry is saved.

If Railway restarts or the health check never becomes healthy, inspect the deploy logs for `Invalid configuration`. A location-data error means one of the public business variables is empty or still contains filler and must be replaced before production can start.
