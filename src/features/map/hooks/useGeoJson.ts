import { useQuery } from "@tanstack/react-query";

export function useGeoJson<T>(url: string) {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["geojson", url],
		queryFn: async ({ signal }) => {
			const response = await fetch(url, { signal });
			if (!response.ok) {
				throw new Error(`Request failed (${response.status})`);
			}
			return response.json() as Promise<T>;
		},
		staleTime: Infinity
	});

	return {
		data: data ?? null,
		isLoading,
		error: isError,
		retry: refetch
	};
}
