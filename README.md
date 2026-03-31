# NameGen Prototype — Local Setup

## Requirements
Node.js (any version — no dependencies needed)

## Run in one command

```bash
node server.js
```

Then open: **http://localhost:3000**

## What you can do in the prototype

| Feature | How to try it |
|---|---|
| Auto-scan | Watch the panel scan the Story on load (1.6s) |
| Select a candidate | Click any event name → blue Confirm button appears |
| Edit a name | Click ✎ on any candidate → inline editor with live validation |
| Category autocomplete | In any input, type `exp`, `auth`, `rep` etc. |
| Unrecognised category | Type `paymnt:order_done` → amber warning appears |
| Duplicate badge | `export:download_initiated` is pre-flagged SIMILAR |
| Confirm an event | Select a UNIQUE name → Confirm → watch Jira comment appear |
| Confirm a duplicate | Select a DUPLICATE name → override modal with checkbox |
| Add custom event | Use the "Add custom event" input in any action group |
| Regenerate | Click ↺ to get 5 fresh candidates for an action group |
| Skip ticket | Click "Not applicable" → confirmation → panel collapses |
| Confirmed summary | Bottom panel updates in real time as you confirm events |
| Jira write-back | Confirmed events appear as comments in the left panel |

## Stopping the server
Press `Ctrl+C` in the terminal.
