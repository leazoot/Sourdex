# Changelog

All notable changes to Sourdex are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-06-21

The optional-AI release. Everything from v0.1 still works fully offline; AI is opt-in and
disabled until you configure a provider. Adds an AI value layer plus capture hardening,
highlights & notes, and full Tags / Export pages.

### Added

- **Capture hardening:** auto-scroll to load lazy/dynamic content before clipping; a Discourse
  adapter that extracts loaded posts cleanly; pre-clean of placeholder/skeleton/boilerplate
  nodes before extraction.
- **AI infrastructure (opt-in, off by default):** OpenAI-compatible and Ollama provider
  adapters; API keys stored in an encrypted local file (AES-256-GCM, `node:crypto` only);
  provider settings UI with an explicit data-egress notice.
- **AI summaries:** background, structured JSON summaries written to `ai_outputs` and folded
  into search; failures never affect saving/search/export.
- **AI auto-tags:** 3–7 normalized tags reusing existing tags, produced from the same model
  call as the summary; manual tags always take priority.
- **Semantic search:** chunked embeddings (brute-force cosine) with source-traceable snippets;
  embedding runs in the background and degrades gracefully when no provider is set.
- **Hybrid ranking:** keyword + semantic + tag + recency + user-signal scoring with graceful
  keyword-only fallback.
- **Ask page (RAG):** answers cite only your saved sources, with an explicit
  "insufficient evidence" path when citations can't be grounded.
- **Highlights & notes:** select-to-highlight with colors and notes, stored separately so the
  original is never modified; notes are searchable and included in Markdown export.
- **Tags page:** weighted tag cloud + management — rename, merge, delete (FTS rebuilt on
  change).
- **Export page:** Markdown / Obsidian / JSON / CSV, scoped to the whole library, a status, or
  a tag.

### Privacy

- Still local-first: nothing is sent anywhere until you configure and enable an AI provider,
  and the egress is shown before it happens.

## [0.1.0] — 2026-06-21

First MVP release. Closes the local-first capture-to-export loop:
**save → extract → index → search → read → export**.

### Added

- **Browser extension (MV3, WXT):** one-click save of the current webpage and selected text
  to the local service; loopback pairing flow (single-use code → Bearer token).
- **Local service (Fastify + SQLite/FTS5):** binds to `127.0.0.1` only; save-first capture
  (`POST /api/captures/webpage`) that persists before extraction so saving is never blocked
  by extraction or AI; background worker for content extraction.
- **Content extraction & Markdown:** readable-content extraction with per-content-type
  strategy and graceful fallback; HTML → Markdown conversion.
- **Full-text search:** SQLite FTS5 with unicode61 + per-character CJK segmentation,
  bm25 ranking, snippet + highlight; keyword search over title/body/summary/tags.
- **Web UI (React + Vite + Tailwind):** Inbox, Library, Reader, Search, Settings — light and
  dark themes, i18n (EN / 简中), built strictly to the `design/` source of truth.
- **Export:** single-item `.md` and batch export (Obsidian layout, grouped by domain) as an
  in-memory zip, with YAML frontmatter and safe filenames.
- **Quality:** unit + integration tests (Vitest) and an end-to-end critical-path test
  (Playwright: save → inbox → search → reader → export); CI on every PR.

### Privacy

- Data is stored locally by default; no content is uploaded anywhere. AI features are v0.2,
  opt-in, and disabled by default.

[0.2.0]: https://github.com/leazoot/Sourdex/releases/tag/v0.2.0
[0.1.0]: https://github.com/leazoot/Sourdex/releases/tag/v0.1.0
