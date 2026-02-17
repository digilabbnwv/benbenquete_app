# 📚 Boekjes & Babbels Enquête

Een mobiel-vriendelijke enquête-app voor **Boekjes & Babbels** van Bibliotheek Noord-West Veluwe (BNWV). Gebouwd met Vite, Tailwind CSS v4 en Vanilla JavaScript.

---

## 🎯 Wat doet deze app?

Bezoekers van Boekjes & Babbels scannen een QR-code en vullen een korte enquête in (6 vragen). De antwoorden worden via een Cloudflare Worker doorgestuurd naar Power Automate, die ze opslaat in een Microsoft 365 List.

**Kenmerken:**
- 📱 Mobile-first design (geoptimaliseerd voor smartphone)
- 🎨 BNWV huisstijl: turquoise/cyaan achtergrond, witte kaarten, roze accenten
- 🔒 QR-token beveiliging + honeypot spam-detectie
- 🧪 **Mock modus** — volledig testbaar zonder externe services
- 📊 Antwoorden in Microsoft 365 Lists via Power Automate

---

## 🏗 Technische Stack

| Component | Technologie |
|---|---|
| Front-end | Vite + Vanilla JS + Tailwind CSS v4 |
| Hosting | GitHub Pages |
| API Proxy | Cloudflare Worker |
| Data opslag | Power Automate → Microsoft 365 Lists |

---

## 🚀 Lokaal Opstarten

### Vereisten
- De `node_bin/` map bevat een portable Node.js installatie

### Installeren
```powershell
# Vanuit de project root
$env:Path = "C:\dev\benbenquete_app\node_bin;" + $env:Path
.\node_bin\npm.cmd install
```

### Ontwikkelserver starten
```powershell
.\dev.cmd
```
Dit start de Vite dev server. Open:
```
http://localhost:5173/?t=beb-global-2026
```

### Andere commando's
| Commando | Omschrijving |
|---|---|
| `.\dev.cmd` | Start de ontwikkelserver |
| `.\dev.cmd build` | Bouw productie-versie in `dist/` |
| `.\dev.cmd preview` | Preview de productie-build |
| `.\dev.cmd lint` | Voer ESLint uit |
| `.\dev.cmd format` | Formatteer code met Prettier |

---

## 🧪 Mock Modus

Mock modus is standaard **aan** in lokale ontwikkeling. Hiermee kun je de volledige enquête doorlopen zonder dat er iets naar de server wordt gestuurd.

### Hoe werkt het?
- Inzendingen worden opgeslagen in de browser (`localStorage`)
- De bedanktpagina wordt normaal getoond
- Geen netwerk-verzoeken nodig

### Instelling
In het bestand `.env` (project root):
```env
VITE_MOCK_MODE=true
```

### Debug scherm
Bekijk opgeslagen inzendingen via:
```
http://localhost:5173/#debug
```
Hier kun je eerder ingevulde data bekijken en wissen. Dit scherm is **alleen beschikbaar in mock modus**.

---

## 📋 Enquête Vragen

De vragen worden dynamisch geladen uit `/config/boekjes-en-babbels.v1.json`. Je kunt vragen en opties aanpassen zonder de code te wijzigen.

| # | Vraag-ID | Type | Verplicht |
|---|---|---|---|
| 1 | `q_vestiging` | Multi-select | ✅ |
| 2 | `q_reden` | Multi-select | ✅ |
| 3 | `q_voorleesfrequentie` | Single-select | ✅ |
| 4 | `q_leukst` | Multi-select | ✅ |
| 5 | `q_mist` | Open tekst | ❌ |
| 6 | `q_andere_activiteiten` | Multi-select | ❌ |

**Let op:** Bij multi-select vragen worden de antwoorden opgeslagen als tekst gescheiden door puntkomma's (`;`), bijvoorbeeld: `"nunspeet;ermelo;putten"`.

---

## 📦 Data Model (Inzending)

Elke inzending bevat de volgende velden:

```json
{
  "surveyId": "boekjes-en-babbels",
  "version": 1,
  "submittedAt": "2026-02-17T14:30:00.000Z",
  "sessionId": "uuid",
  "qrToken": "beb-global-2026",
  "q_vestiging": "ermelo;putten",
  "q_reden": "inspiratie;ontmoeten",
  "q_reden_anders": "",
  "q_voorleesfrequentie": "dagelijks",
  "q_leukst": "voorlezen;muziek",
  "q_leukst_anders": "",
  "q_mist": "Meer liedjes!",
  "q_andere_activiteiten": "digilab;peuterbieb",
  "q_andere_activiteiten_anders": "",
  "answersJson": "{...}",
  "bot_check": "",
  "meta": {
    "userAgent": "...",
    "lang": "nl-NL"
  }
}
```

---

## 🌐 Deployment naar Productie

### 1. GitHub Pages (Front-end)

De front-end wordt automatisch gedeployed via GitHub Actions bij een push naar `main`.

**Handmatig bouwen:**
```powershell
.\dev.cmd build
# De dist/ map is klaar om te serveren
```

**GitHub instellingen:**
- Ga naar **Settings → Pages → Source** en kies **GitHub Actions**
- Stel de volgende **Repository Variables** in (Settings → Secrets and Variables → Actions):
  - `VITE_API_BASE_URL` — URL van je Cloudflare Worker (bijv. `https://bnwv-enquete-worker.jouw-account.workers.dev/api/submit`)
- Stel de volgende **Repository Secrets** in:
  - `CLIENT_SECRET` — Gedeelde sleutel (zelf genereren, bijv. via `openssl rand -hex 32`)

### 2. Cloudflare Worker (API Proxy)

De Worker valideert het QR-token, controleert het client secret, en stuurt de data door naar Power Automate. De Power Automate URL wordt **nooit** blootgesteld aan de browser.

**Deployen:**
```bash
npx wrangler login
npx wrangler deploy
```

**Secrets instellen (verplicht):**
```bash
# Gedeelde sleutel (moet matchen met CLIENT_SECRET in GitHub)
npx wrangler secret put CLIENT_SECRET

# Power Automate webhook URL
npx wrangler secret put PA_WEBHOOK_URL

# Toegestane QR-tokens (komma-gescheiden)
npx wrangler secret put TOKEN_ALLOWLIST
# Waarde: beb-global-2026
```

### 3. Power Automate (Microsoft Lists)

1. **Maak een Flow** met trigger "When a HTTP request is received"
2. **Gebruik dit JSON-schema** voor de trigger:

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
    "bot_check": { "type": "string" },
    "meta": {
      "type": "object",
      "properties": {
        "userAgent": { "type": "string" },
        "lang": { "type": "string" }
      }
    }
  }
}
```

3. **Maak een Microsoft List** aan met deze kolommen:

| Kolom | Type | Toelichting |
|---|---|---|
| Title | Tekst | Map naar `sessionId` |
| surveyId | Tekst | |
| version | Getal | |
| submittedAt | Datum/tijd | ISO-string |
| qrToken | Tekst | |
| q_vestiging | Meerdere regels | Puntkomma-gescheiden |
| q_reden | Meerdere regels | |
| q_reden_anders | Tekst | |
| q_voorleesfrequentie | Tekst | |
| q_leukst | Meerdere regels | |
| q_leukst_anders | Tekst | |
| q_mist | Meerdere regels | |
| q_andere_activiteiten | Meerdere regels | |
| q_andere_activiteiten_anders | Tekst | |
| answersJson | Meerdere regels | JSON-backup |

4. **Voeg een "Create Item" actie toe** en koppel elk veld uit de JSON aan de juiste kolom.

---

## 🔒 Beveiliging

| Maatregel | Beschrijving |
|---|---|
| **QR-token** | URL bevat `?t=beb-global-2026`. Worker controleert tegen allowlist. |
| **Client Secret** | Header `X-Client-Secret` moet matchen met Worker secret. |
| **Honeypot** | Onzichtbaar veld `bot_check`. Als gevuld → afgewezen. |
| **CORS** | Alleen GitHub Pages en localhost worden toegestaan. |

### Tokens/secrets roteren
1. Genereer een nieuw secret: `openssl rand -hex 32`
2. Update in Cloudflare: `npx wrangler secret put CLIENT_SECRET`
3. Update in GitHub: Settings → Secrets → `CLIENT_SECRET`
4. Push opnieuw (of trigger de GitHub Action handmatig)

### QR-token wijzigen
1. Update `TOKEN_ALLOWLIST` in de Worker: `npx wrangler secret put TOKEN_ALLOWLIST`
2. Genereer nieuwe QR-codes met de nieuwe token in de URL

---

## 📂 Projectstructuur

```
benbenquete_app/
├── config/
│   └── boekjes-en-babbels.v1.json  ← Enquête configuratie (bron)
├── public/
│   ├── config/
│   │   └── boekjes-en-babbels.v1.json  ← Kopie voor Vite serving
│   ├── bnwv_logo.png
│   └── 404.html
├── src/
│   ├── index.html                  ← HTML entry point
│   ├── main.js                     ← App logica (stepper, validatie, submit)
│   └── style.css                   ← Tailwind v4 + thema tokens
├── worker/
│   └── index.js                    ← Cloudflare Worker
├── .env                            ← Lokale dev omgevingsvariabelen
├── .github/workflows/deploy.yml    ← GitHub Pages deploy actie
├── dev.cmd                         ← Handige start-script
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── wrangler.toml                   ← Cloudflare Worker config
└── package.json
```

---

## ⚙️ Omgevingsvariabelen

### Lokaal (`.env`)
```env
VITE_MOCK_MODE=true
VITE_API_BASE_URL=http://localhost:8787/api/submit
VITE_CLIENT_SECRET=super_secret_client_key
```

### Productie (GitHub Actions Secrets)
| Variable | Waar | Waarde |
|---|---|---|
| `VITE_API_BASE_URL` | GitHub Vars | Worker URL |
| `CLIENT_SECRET` | GitHub Secrets | Gedeelde sleutel |
| `VITE_MOCK_MODE` | Niet instellen | (default: `false`) |

### Cloudflare Worker Secrets
| Secret | Omschrijving |
|---|---|
| `CLIENT_SECRET` | Moet matchen met front-end |
| `PA_WEBHOOK_URL` | Power Automate HTTP trigger URL |
| `TOKEN_ALLOWLIST` | Komma-gescheiden tokens (bijv. `beb-global-2026`) |

---

## 📜 Licentie

Intern gebruik Bibliotheek Noord-West Veluwe.
