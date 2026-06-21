import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { InboxPage } from "@/pages/inbox/InboxPage";
import { LibraryPage } from "@/pages/library/LibraryPage";
import { ReaderPage } from "@/pages/reader/ReaderPage";
import { SearchPage } from "@/pages/search/SearchPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<InboxPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="reader/:id" element={<ReaderPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
