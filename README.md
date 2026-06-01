# Brit GPT

Demo POC for Britannia — guided consumer research on **Flavor Insights India** (1.53L conversations).

Built with **Next.js 15** and **Amazon Bedrock only** (no Google/Gemini).

## Run locally

```bash
npm install
cp .env.example .env.local
# BEDROCK_API_KEY=ABSK…
# Optional for hero film: BEDROCK_S3_OUTPUT_URI=s3://your-bucket/brit-videos/
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Bedrock models

| Capability | Model |
|------------|--------|
| Text (actions, Q&A enrich) | **Nova Lite** / Nova Micro |
| Concept packshots | **Nova Canvas** (fallback: Titan Image) |
| Hero film | **Nova Reel** → saves to **S3** (async, ~90s) |

## API

- `/api/bedrock/*` — proxies Bedrock Runtime (Converse, InvokeModel, AsyncInvoke)

Paste your Bedrock key in **◇ API key** (stored in `localStorage`) or set `BEDROCK_API_KEY` in `.env.local`.

## Create flow

1. Finish a research run → **Suggested next steps** → **Create**
2. Images via Nova Canvas on Bedrock
3. Film via Nova Reel only if `BEDROCK_S3_OUTPUT_URI` is set; output is an S3 link on the hero card

## Project structure

```
app/                  # Next.js App Router + API proxies
components/brit/      # UI + flow
lib/                  # data, qa, bedrock, llm, create, actions
css/styles.css        # design system
legacy/               # old static HTML app
```
# btitgpt
