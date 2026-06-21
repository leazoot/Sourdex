# Changelog

All notable changes to Sourdex are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

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

[0.1.0]: https://github.com/USER/Sourdex/releases/tag/v0.1.0
