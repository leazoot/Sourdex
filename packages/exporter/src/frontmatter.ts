import type { Item, Tag } from "@sourdex/core";

/** Quote and escape a value as a YAML double-quoted scalar (safe for any title/url/tag). */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Build YAML frontmatter for an exported note (PRD §5.1.7): title/url/domain/saved_at/type/
 * (author)/tags. All scalars are double-quoted and escaped so Chinese titles and special
 * characters never break the document or Obsidian parsing.
 */
export function buildFrontmatter(item: Item, tags: Tag[]): string {
  const lines = [`title: ${yamlString(item.title)}`];
  if (item.url) lines.push(`url: ${yamlString(item.url)}`);
  if (item.domain) lines.push(`domain: ${yamlString(item.domain)}`);
  lines.push(`saved_at: ${yamlString(item.savedAt)}`);
  lines.push(`type: ${yamlString(item.type)}`);
  if (item.author) lines.push(`author: ${yamlString(item.author)}`);
  lines.push(`tags: [${tags.map((tag) => yamlString(tag.name)).join(", ")}]`);
  return `---\n${lines.join("\n")}\n---`;
}
