import { QueryClient } from '@tanstack/react-query';

/** Singleton dùng chung (prefetch sau đăng nhập, App, tests). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
});
