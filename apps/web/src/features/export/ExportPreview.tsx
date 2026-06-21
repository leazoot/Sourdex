import type { ExportFormat } from "@sourdex/core";

/** Static format preview (design export 07) — illustrates the shape of each export format. */
const PREVIEWS: Record<ExportFormat, string> = {
  markdown: `---
title: Local-First Software
url: inkandswitch.com
saved: 2025-06-18
tags: [local-first, crdt]
---

# Local-First Software

In the cloud, the data you create…`,
  obsidian: `Sourdex/
├── Local-First Software.md
├── SQLite everywhere.md
└── _index.md

# Local-First Software

See also [[CRDT minimal impl]]…`,
  json: `{
  "count": 128,
  "items": [
    {
      "id": "item_…",
      "title": "Local-First…",
      "url": "inkandswitch.com",
      "tags": ["local-first"]
    }
  ]
}`,
  csv: `title,url,domain,type,saved_at,tags
"Local-First…",inkand…,inkandswitch.com,webpage,2025-06-18,local-first
"SQLite…",antonz.org,antonz.org,webpage,2025-06-15,sqlite`,
};

export function ExportPreview({ format }: { format: ExportFormat }) {
  return (
    <pre className="h-[206px] overflow-auto whitespace-pre-wrap rounded-[12px] border border-border bg-surface3 p-4 font-mono text-[11.5px] leading-[1.7] text-text2">
      {PREVIEWS[format]}
    </pre>
  );
}
