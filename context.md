Here’s the cleaned-up brief with the noise removed and the flow made clear:

## Goal

Build a **demo-only POC** called **BritGPT** for Britannia. This is **not a production UI** and not meant for actual usage. The goal is to **look impressive in a demo**.

**Priority order:**

1. Look / presentation / storytelling
2. Guided flow + animations
3. Dummy functionality
4. Actual intelligence (minimal)

The backend can be mostly mocked.

---

## Data Context

We already have:

* Existing data universe
* Quick search data
* Flavour insights across states
* Reports / PDFs
* Existing Q&A capability over captured data

POC only needs to work on **limited predefined questions**.

---

## Required User Flow

### 1. User enters query

Example:

> “Top flavour trends by state”
> “Sentiment towards biscuits and sweets”
> “Extension opportunities”

---

### 2. Simulated research run experience

Instead of instant answer:

Show engine workflow.

Example sequence:

```text
Running consumer research...
✓ Consumer discovery started

Gathering market signals...
✓ Sources identified

Generating follow-up questions...
```

---

### 3. Follow-up panel appears

User fills metadata:

* Region
* Timeframe
* Business objective
* Additional filters

(Use existing Akash flow as inspiration)

Example:

```text
Region: South India
Timeframe: Last 12 months
Objective: Product extension
```

Show:

* Estimated credits
* ETA
* Research scope

Then:

**Run Research**

---

### 4. Research execution screen

Need a cinematic run screen.

Sections:

```text
Discovery
███████

Consumer Signals
██████

Market Analysis
█████

Source Aggregation
██████

Report Generation
██████
```

Optional:

* Timeline animation
* Sources count
* Progress logs
* Event stream style UI

Everything can be dummy.

---

### 5. Results screen

Important:

Do NOT dump final report immediately.

Flow:

**Major insight first**

Example:

> Biscuit + sweet flavour combinations show strongest affinity in region X

Then:

Inline visual cards:

* Confidence score
* Trend indicator
* Opportunity score
* Charts
* Regional breakdown
* Decision cards

---

### 6. Decision layer

Need executive output:

```text
Recommended action:

Launch extension in region X

Confidence: 84%

Reason:
Consumer affinity + flavour overlap + sentiment trend
```

---

### 7. Report layer

Button:

**View Full Report**

Click → opens report viewer / PDF.

Reports should exist as viewer only.

---

## Tech Notes

* First query = deterministic flow
* No GPT needed initially
* Hardcoded path acceptable
* Subsequent Q&A can use existing GPT + data universe

---

## UI / Visual Requirements

Branding:

* Britannia theme
* Primarily RED
* Optional purple accents

Style:

* Premium research platform
* Enterprise AI
* Heavy motion
* Timeline based
* “Consumer research engine” feeling

Need to feel like:

```text
Query
→ Research orchestration
→ Discovery
→ Analysis
→ Executive insight
→ Report
```

NOT:

```text
Prompt → Chat answer
```

---

## Deliverable Today

Timebox: **Half day**

Need:

* Single happy path
* One scripted demo flow
* Hardcoded acceptable
* Beautiful UI > functionality
* Use one report / PDF as source
* Build story later after UI is ready

---

## Immediate build list

### Screens

1. Query input
2. Metadata panel
3. Research execution timeline
4. Insight output
5. Charts / cards
6. Executive recommendation
7. Report viewer modal

### Components

* Progress timeline
* Research logs
* Confidence cards
* Source cards
* Region selector
* ETA / credits card
* Report button
* Inline charts
* Executive summary card

This is basically a **research copilot theatre demo**, not a GPT product demo. The story is the orchestration + visuals.
