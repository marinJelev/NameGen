# NameGen

**PostHog Event Name Generator — Jira Story Panel**

NameGen is a Jira-native panel tool that helps Product Managers define PostHog custom events directly from a Jira Story ticket. It automatically detects all trackable user actions in a ticket, generates 5 `category:object_action` PostHog-compliant event name candidates per action, validates them for format and uniqueness in real time, and writes confirmed names back as Jira comments.

---

## Features (v1.0)

- **Auto action detection** — scans every Jira Story on open, no PM trigger required
- **5 candidates per action** — AI-generated in `category:object_action` format (PostHog best practice)
- **Category autocomplete** — guides consistent category naming from a canonical vocabulary
- **Real-time validation** — format + uniqueness checked as you type (debounced 400ms)
- **Adaptive fuzzy matching** — length-aware Levenshtein distance prevents false positives
- **Manual edit** — inline editing of any AI-generated candidate with live validation
- **Custom event creation** — add events from scratch per action group or at panel level
- **Skip flow** — mark a Story as not applicable; logged for pipeline analysis
- **Confirmed events summary** — persistent in-panel list of all confirmed events on the Story
- **Jira write-back** — one comment per confirmed event with origin (AI-generated/Edited/Custom)
- **Instrumentation logging** — confirm, skip, and regeneration events logged to Forge Storage

---

## Stack

| Layer | Technology |
|---|---|
| Frontend panel | Atlassian Forge UI Kit 2 (React) |
| Backend resolver | Forge Functions (Node.js 18 / TypeScript) |
| AI pipeline | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Duplicate detection | PostHog REST API + session cache + Levenshtein |
| Secret storage | Atlassian Forge Storage API |
| Jira write-back | Jira REST API v3 |

---

## Project Structure

```
namegen/
├── manifest.yml                  # Forge app config, permissions, issue type filter
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── config/
│   └── categories.json           # Canonical PostHog category vocabulary
├── src/
│   ├── types/index.ts            # Shared TypeScript interfaces
│   └── backend/
│       ├── index.ts              # Forge resolver entry point
│       ├── pipeline.ts           # Two-step Anthropic call (detect + generate)
│       ├── validator.ts          # category:object_action format validation
│       ├── duplicateChecker.ts   # PostHog API + adaptive fuzzy match + cache
│       ├── autocomplete.ts       # Category suggestions from canonical list
│       ├── summaryHydrator.ts    # Reads existing NameGen Jira comments
│       ├── instrumentationLogger.ts
│       └── jiraWriter.ts
├── prototype/
│   ├── index.html                # Fully interactive standalone prototype
│   └── server.js                 # Local dev server — run: node server.js
└── test/
    ├── validator.test.ts
    ├── duplicateChecker.test.ts
    ├── autocomplete.test.ts
    └── summaryHydrator.test.ts
```

---

## Prerequisites

- [Atlassian Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/)
- Jira Cloud instance
- [Anthropic API key](https://console.anthropic.com)
- PostHog project API key (read-only)
- Node.js 18+

---

## Setup

```bash
npm install

forge variables set ANTHROPIC_API_KEY    sk-ant-xxxxx
forge variables set POSTHOG_API_KEY      phx_xxxxx
forge variables set POSTHOG_PROJECT_ID   12345
forge variables set POSTHOG_HOST         https://app.posthog.com

npm run build
forge deploy
forge install --site your-site.atlassian.net
```

---

## Development

```bash
forge tunnel        # Hot-reload local dev
npm test            # Run tests
npm run typecheck   # Type check
```

---

## Prototype

```bash
cd prototype
node server.js
# Open http://localhost:3000
```

---

## Naming Convention

NameGen enforces the official PostHog `category:object_action` convention.

| Component | Description | Example |
|---|---|---|
| `category` | Product area or flow | `checkout`, `signup_flow` |
| `object` | UI element or entity | `order_summary`, `password_field` |
| `action` | Past-tense verb | `completed`, `clicked`, `viewed` |

Full example: `checkout:order_summary_completed`

---

## Roadmap

| Version | Timeline | Scope |
|---|---|---|
| v1.0 | Q2 2026 | Jira Story panel, full v1 feature set |
| v1.1 | Q3 2026 | Bulk confirmation, Epic panel |
| v2.0 | Q3 2026 | Confluence event registry |
| v3.0 | Q1 2027 | PostHog auto-registration |
