# St Jude's Messenger Bot

Facebook Messenger chatbot for **St Jude's Psychiatric and Custodial Home**. It uses OpenAI to answer common inquiries and collect structured details for staff, while hard-coded safety checks escalate crisis language to emergency guidance.

## Features

- Warm greeting and quick replies for common topics.
- Messenger webhook verification.
- Text, postback, and quick-reply handling.
- AI-guided conversations for:
  - Psychiatric internship inquiries
  - Consultation schedule requests
  - Location requests
  - Patient accommodation inquiries
  - Staff handoff
- Safety guardrails:
  - No diagnosis
  - No medication recommendations
  - No admission or accommodation guarantees
  - Unrelated requests are blocked before OpenAI is called
  - Prompt-injection requests are blocked before OpenAI is called
  - Crisis and emergency messages receive immediate emergency guidance
  - Final assessment is clearly assigned to qualified staff
- Structured inquiry storage in Postgres when `DATABASE_URL` is set, with local JSON fallback in `data/inquiries.json`.
- Local approved knowledge base in `knowledge/st-judes-reference.md`.
- Environment-based configuration for credentials and business details.

## Project Structure

```text
.
|-- data/
|   `-- .gitkeep
|-- knowledge/
|   `-- st-judes-reference.md
|-- src/
|   |-- bot/
|   |   |-- intent.js
|   |   |-- messageHandler.js
|   |   |-- quickReplies.js
|   |   `-- safety.js
|   |-- routes/
|   |   `-- webhook.js
|   |-- services/
|   |   |-- aiService.js
|   |   |-- inquiryStore.js
|   |   |-- messengerClient.js
|   |   `-- sessionStore.js
|   |-- utils/
|   |   `-- logger.js
|   |-- config.js
|   `-- server.js
|-- .env.example
|-- .gitignore
|-- package.json
`-- README.md
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill in `.env`:

   ```env
   PORT=3000
   NODE_ENV=development

   PAGE_ACCESS_TOKEN=your_facebook_page_access_token
   VERIFY_TOKEN=your_custom_webhook_verify_token
   META_APP_SECRET=your_meta_app_secret
   REQUIRE_META_SIGNATURE=false
   PAGE_ID=

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
   DATABASE_URL=
   DATABASE_SSL=false
   ```

4. Start the bot locally:

   ```bash
   npm run dev
   ```

5. Expose your local server with a tunnel such as ngrok:

   ```bash
   ngrok http 3000
   ```

6. In the Facebook Developer dashboard, configure the Messenger webhook:

   - Callback URL: `https://your-public-url.example/webhook`
   - Verify token: same value as `VERIFY_TOKEN`
   - Subscribe to `messages` and `messaging_postbacks`.

## Production

Run with:

```bash
npm start
```

Use your host's secret manager or environment settings for `PAGE_ACCESS_TOKEN`, `VERIFY_TOKEN`, `META_APP_SECRET`, and `OPENAI_API_KEY`. Do not commit `.env`.

For Railway deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md). For production guardrails and secret handling, see [SECURITY.md](./SECURITY.md).

## Messenger Entry Points

The bot supports:

- Public status: `GET /`
- Webhook verification: `GET /webhook`
- Messenger events: `POST /webhook`
- Health check: `GET /health`

## Common Quick Replies

- Internship
- Consultation Schedule
- Location
- Patient Accommodation
- Contact Staff

## AI Conversation Manager

The bot uses OpenAI as the primary conversation manager after hard-coded emergency checks. Quick replies provide topic hints, then the AI asks the relevant follow-up questions, avoids asking for names, and returns structured inquiry data for storage.

AI is enabled when:

```env
AI_ENABLED=true
OPENAI_API_KEY=your_openai_api_key
```

To disable AI without removing the key:

```env
AI_ENABLED=false
```

The AI prompt is intentionally restricted. It may answer common facility questions, but it must not diagnose, recommend medication, guarantee accommodation, guarantee admission, or provide emergency medical advice. If OpenAI is unavailable or returns an error, the bot asks the user to choose a topic or leave their contact number and concern.

The bot does not ask for the user's name. Staff handoff collects only contact number and concern.

Code-level guardrails block clearly unrelated requests, such as coding, apps, schoolwork, recipes, creative writing, finance, legal advice, translation, jailbreaks, and prompt-injection attempts before they are sent to OpenAI.

## Knowledge Base

The AI references `knowledge/st-judes-reference.md` for approved public facility information such as location, contact number, office hours, consultation fee, monthly care rate, inclusions, exclusions, and admission disclaimers.

Keep this file limited to public, staff-approved information. Do not add patient records, private medical details, diagnoses, or sensitive clinical information.

The default model is set to the lowest-cost OpenAI text option currently selected for this project:

```env
OPENAI_MODEL=gpt-5.4-nano
OPENAI_MAX_OUTPUT_TOKENS=160
```

Keep `OPENAI_MAX_OUTPUT_TOKENS` low for cheaper Messenger replies. Increase it only if responses feel too short.

## Safety Notes

This chatbot is only for basic inquiry collection and routing. It does not diagnose, prescribe, recommend medication, provide emergency medical advice, or guarantee admission. Messages mentioning self-harm, suicide, violence, crisis, or emergency language are immediately routed to emergency guidance.

Final assessment, accommodation decisions, admissions, pricing, and schedule confirmation must be handled by qualified St Jude's staff.
