// @vitest-environment jsdom
import type { Item } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { ItemCard } from "./ItemCard";

afterEach(cleanup);

const item: Item = {
  id: "item_1",
  type: "webpage",
  status: "inbox",
  title: "Local-First Software",
  url: "https://inkandswitch.com",
  canonicalUrl: null,
  domain: "inkandswitch.com",
  author: null,
  publishedAt: null,
  savedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  summary: "Seven ideals for software.",
  oneSentence: null,
  thumbnailPath: null,
  sourceHash: null,
  wordCount: 6210,
  readingTime: 24,
  aiStatus: "none",
};

describe("ItemCard", () => {
  it("renders title, domain and summary", () => {
    render(<ItemCard item={item} onOpen={() => {}} />);
    expect(screen.getByText("Local-First Software")).toBeTruthy();
    expect(screen.getByText("inkandswitch.com")).toBeTruthy();
    expect(screen.getByText("Seven ideals for software.")).toBeTruthy();
  });

  it("calls onOpen with the item id when clicked", () => {
    const onOpen = vi.fn();
    render(<ItemCard item={item} onOpen={onOpen} />);
    fireEvent.click(screen.getByText("Local-First Software"));
    expect(onOpen).toHaveBeenCalledWith("item_1");
  });

  it("fires archive/delete actions without bubbling to open", () => {
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    render(<ItemCard item={item} onOpen={onOpen} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle("Delete"));
    expect(onDelete).toHaveBeenCalledWith(item);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
