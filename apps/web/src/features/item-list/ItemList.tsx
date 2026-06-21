import type { Item } from "@sourdex/core";
import { ItemCard, type ItemActions } from "./ItemCard";

/** Vertical list of item cards. Loading/empty/error states are composed by the page. */
export function ItemList({ items, ...actions }: { items: Item[] } & ItemActions) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} {...actions} />
      ))}
    </div>
  );
}
