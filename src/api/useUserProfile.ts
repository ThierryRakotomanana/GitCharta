import { useState, useEffect } from "react";
import { fetchUserProfile } from "./fetchUserProfile";
import type { UserProfileResponse } from "./api.type";

export function useUserProfile(login: string) {
	const [prevLogin, setPrevLogin] = useState(login);
	const [user, setUser] = useState<UserProfileResponse | null>(null);

	if (prevLogin !== login) {
		setPrevLogin(login);
		setUser(null);
	}

	useEffect(() => {
		if (!login) return;

		const controller = new AbortController();

		fetchUserProfile(login, controller.signal)
			.then((data) => {
				if (controller.signal.aborted) return;
				setUser(data);
			})
			.catch((err) => {
				if (controller.signal.aborted) return;
				if (err?.message === "Request aborted" || err?.name === "AbortError") {
					return;
				}
				setUser(null);
			});

		return () => controller.abort();
	}, [login]);

	return login ? user : null;
}
