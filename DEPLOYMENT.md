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

BUSINESS_ADDRESS=your_real_address
GOOGLE_MAPS_LINK=your_google_maps_link
CONTACT_NUMBER=your_contact_number
LANDMARK_INSTRUCTIONS=your_landmark_directions

INQUIRIES_FILE=./data/inquiries.json
JSON_BODY_LIMIT=256kb
GENERAL_RATE_LIMIT_WINDOW_MS=900000
GENERAL_RATE_LIMIT_MAX=600
WEBHOOK_RATE_LIMIT_WINDOW_MS=60000
WEBHOOK_RATE_LIMIT_MAX=300
```

For durable inquiry storage, use Railway Postgres or mount a volume and set `INQUIRIES_FILE=/data/inquiries.json`.

## 4. Configure Meta Webhook

In Meta for Developers, set the callback URL to:

```text
https://your-railway-domain.up.railway.app/webhook
```

Use the same value as `VERIFY_TOKEN` for webhook verification.

Subscribe the connected page to:

- `messages`
- `messaging_postbacks`

## 5. Smoke Test

After deploy:

1. Open `https://your-railway-domain.up.railway.app/health`.
2. Confirm it returns `{"ok":true,"service":"st-jude-messenger-bot"}`.
3. Send `Hello` to the Facebook Page in Messenger.
4. Send `make a python app` and confirm the bot refuses as out-of-scope.
5. Send an actual facility inquiry and confirm the AI stays scoped to St Jude's.
