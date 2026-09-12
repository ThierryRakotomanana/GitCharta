import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api/fetchUserProfile";

export function useUserProfile(login: string) {
	const { data } = useQuery({
		queryKey: ["user-profile", login],
		queryFn: ({ signal }) => fetchUserProfile(login, signal),
		enabled: !!login,
		staleTime: Infinity
	});

	return login ? (data ?? null) : null;
}
