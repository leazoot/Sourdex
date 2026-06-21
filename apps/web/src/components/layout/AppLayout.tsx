import { Outlet } from "react-router-dom";
import { Rail } from "./Rail";
import { TopBar } from "./TopBar";

/** App chrome: full-width top bar, then a 60px nav rail beside the scrollable content. */
export function AppLayout() {
  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Rail />
        <main className="flex-1 overflow-y-auto bg-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
