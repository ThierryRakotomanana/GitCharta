import { useEffect, useState } from "react";
import { createResourceCache } from "@/shared/lib/createResourceCache";
import { fetchUserProfile } from "@/features/user-profile/api/fetchUserProfile";
import type { UserProfileResponse } from "@/features/user-profile/model/type";

export const profileCache = createResourceCache<UserProfileResponse>();

export function useUserProfile(login: string) {
	const [state, setState] = useState<{
		login: string;
		user: UserProfileResponse | null;
	}>(() => ({
		login,
		user: login ? (profileCache.get(login) ?? null) : null
	}));

	if (state.login !== login) {
		setState({
			login,
			user: login ? (profileCache.get(login) ?? null) : null
		});
	}

	useEffect(() => {
		if (!login) return;

		if (profileCache.get(login)) return;

		const controller = new AbortController();

		fetchUserProfile(login, controller.signal)
			.then((data) => {
				if (controller.signal.aborted) return;
				profileCache.set(login, data);
				setState({ login, user: data });
			})
			.catch((err) => {
				if (controller.signal.aborted) return;
				if (err?.message === "Request aborted" || err?.name === "AbortError") {
					return;
				}
				setState({ login, user: null });
			});

		return () => controller.abort();
	}, [login]);

	return login ? state.user : null;
}
