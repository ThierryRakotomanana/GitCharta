import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false
		}
	}
});

export function QueryProvider({ children }: { children: ReactNode }) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
