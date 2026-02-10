import { useEffect } from 'react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router';
import { root } from './routes';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { OfflineBanner } from './components';
export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
      },
      mutations: {
        retry: 0,
      },
    },
  });
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker registered successfully"))
        .catch((err) => console.error("❌ Service Worker registration failed:", err));
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={createBrowserRouter(root)} />
      </QueryClientProvider>
      <OfflineBanner />
      <Toaster />
    </ThemeProvider>
  )
}
