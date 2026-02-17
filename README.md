# BNWV Boekjes & Babbels Enquête

A mobile-first survey application for Boekjes & Babbels, built with Vite + Tailwind CSS, hosted on GitHub Pages, and backed by Cloudflare Workers and Microsoft Lists.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd benbenquete_app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development (Mock Mode)
Mock mode allows you to test the full survey flow without connecting to the Cloudflare Worker or Power Automate. Submissions are saved to `localStorage`.

1. Check `.env`:
   ```env
   VITE_MOCK_MODE=true
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:5173/?t=beb-global-2026

### Check Submissions (Mock Mode)
Open browser DevTools -> Console to see the submitted payload.
Submissions are also stored in `localStorage` under key `beb_submissions`.

---

## 🛠 Deployment to Production

### 1. Front-end (GitHub Pages)
The front-end is deployed via GitHub Actions or manually.

**Manual Build & Deploy:**
```bash
npm run build
# The dist/ folder is now ready to be served.
# If using gh-pages branch:
npx gh-pages -d dist
```

**GitHub Actions (Recommended):**
See `.github/workflows/deploy.yml` (if created) or enable Pages in GitHub Settings -> Pages -> Source: GitHub Actions.

### 2. Back-end (Cloudflare Worker)
The Worker handles validation, security, and forwarding to Power Automate.

**Prerequisites:**
- Cloudflare Account
- `wrangler` CLI installed (`npm install -g wrangler`)
- Login: `wrangler login`

**Deploy:**
```bash
# In project root
npx wrangler deploy
```

**Secrets Configuration (Critical):**
You must set these secrets in Cloudflare for the Worker to function:
```bash
npx wrangler secret put CLIENT_SECRET
# Enter: <your-generated-secret-key>

npx wrangler secret put PA_WEBHOOK_URL
# Enter: <your-power-automate-http-url>

npx wrangler secret put TOKEN_ALLOWLIST
# Enter: beb-global-2026
```

**Environment Variables:**
In `wrangler.toml`, ensure `TOKEN_ALLOWLIST` matches your desired tokens.

### 3. Power Automate (Microsoft Lists)
1. **Create a Request in Power Automate:**
   - Trigger: "When a HTTP request is received"
   - Method: POST
   - JSON Schema: (Copy from below)
   
2. **Create a List in Microsoft Lists** with these columns:
   | Column Name | Type | Description |
   |---|---|---|
   | Title | String | (Default) Map to `surveyId` or `sessionId` |
   | surveyId | Single line of text | |
   | version | Number | |
   | submittedAt | Date/Time | ISO String |
   | qrToken | Single line of text | |
   | q_vestiging | Multiple lines of text | Semicolon separated |
   | q_reden | Multiple lines of text | |
   | q_reden_anders | Single line of text | |
   | q_voorleesfrequentie | Single line of text | |
   | q_leukst | Multiple lines of text | |
   | q_leukst_anders | Single line of text | |
   | q_mist | Multiple lines of text | |
   | q_andere_activiteiten | Multiple lines of text | |
   | q_andere_activiteiten_anders | Single line of text | |
   | answersJson | Multiple lines of text | JSON String |

3. **Map Data:**
   - Use "Parse JSON" action after trigger.
   - Use "Create Item" action to map JSON fields to List columns.

**JSON Schema:**
```json
{
    "type": "object",
    "properties": {
        "surveyId": { "type": "string" },
        "version": { "type": "integer" },
        "submittedAt": { "type": "string" },
        "sessionId": { "type": "string" },
        "qrToken": { "type": "string" },
        "q_vestiging": { "type": "string" },
        "q_reden": { "type": "string" },
        "q_reden_anders": { "type": "string" },
        "q_voorleesfrequentie": { "type": "string" },
        "q_leukst": { "type": "string" },
        "q_leukst_anders": { "type": "string" },
        "q_mist": { "type": "string" },
        "q_andere_activiteiten": { "type": "string" },
        "q_andere_activiteiten_anders": { "type": "string" },
        "answersJson": { "type": "string" },
        "meta": {
            "type": "object",
            "properties": {
                "userAgent": { "type": "string" },
                "lang": { "type": "string" }
            }
        },
        "bot_check": { "type": "string" }
    }
}
```

## 🔒 Security & Secrets
- **QR Token**: Use `?t=beb-global-2026` in the QR code URL.
- **Client Secret**: VITE_CLIENT_SECRET in `.env` (build time) must match `CLIENT_SECRET` in Worker.
- **Bot Check**: Hidden honeypot field + simple allowlist.

## 📂 Project Structure
- `/src`: Frontend code (Vite + Vanilla JS + Tailwind)
- `/worker`: Cloudflare Worker code
- `/public`: Static assets
- `/config`: Survey configuration (JSON)

## 🎨 Design System
- Colors: Brand Blue (`#00B4D8`), Deep Blue (`#03045E`), Accent Pink (`#FF006E`)
- Typography: Inter / Outfit
- Framework: Tailwind CSS

## 📜 License
Internal use BNWV.
