import type { Item } from "@sourdex/core";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ItemCard, type ItemActions } from "./ItemCard";

/** Virtualized item list for long libraries (PRD §18.3). Dynamic row heights. */
export function VirtualItemList({ items, ...actions }: { items: Item[] } & ItemActions) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 6,
    gap: 12,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-230px)] overflow-y-auto pr-1">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index];
          if (!item) return null;
          return (
            <div
              key={item.id}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <ItemCard item={item} {...actions} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
