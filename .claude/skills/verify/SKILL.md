---
name: verify
description: Verify changes to this static terminal-themed site by driving it in headless Chromium.
---

# Verifying mikebirdtech.github.io

Static site — no build step. Surface is the browser.

## Serve

```bash
python3 -m http.server 8737   # from repo root, run in background
```

## Drive

Playwright (install into the session scratchpad, not the repo: `npm init -y && npm install playwright && npx playwright install chromium`).

Key things to know when driving:

- The boot animation takes ~3s; wait for `#final-prompt` to have `style.visibility === 'visible'` before interacting. With `page.emulateMedia({ reducedMotion: 'reduce' })` everything renders instantly.
- The interactive shell is driven by a hidden input (`#shell-input`); just `page.keyboard.type(...)` + Enter — any printable keypress focuses it. Typed text mirrors into `#typed`.
- `open <link>` calls `window.open` — assert via `browser.contexts()[0].pages()`.
- Read the full terminal transcript with `document.querySelector('.terminal-content').innerText`.

## Flows worth driving

- Boot animation completes, links render, hint line appears.
- Shell: `help`, `ls links/`, `cat info.txt`, `neofetch`, `clear`, tab completion, ArrowUp history.
- Probes: `echo <img src=x onerror=alert(1)>` must render as literal text (all output goes through `textContent`); unknown command; `cat ../../etc/passwd`.
- Check `pageerror`/console errors — should be none.
