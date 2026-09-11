import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { isValidLogin } from "@/features/audience";

const LOGIN_PARAM = "login";

export function useSearchLogin() {
	const [searchParams, setSearchParams] = useSearchParams();
	const rawLogin = searchParams.get(LOGIN_PARAM) ?? "";
	const login = isValidLogin(rawLogin) ? rawLogin : "";

	const search = useCallback(
		(value: string) => {
			const trimmed = value.trim();
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					if (trimmed) next.set(LOGIN_PARAM, trimmed);
					else next.delete(LOGIN_PARAM);
					return next;
				},
				{ replace: false }
			);
		},
		[setSearchParams]
	);

	const clear = useCallback(() => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				next.delete(LOGIN_PARAM);
				return next;
			},
			{ replace: false }
		);
	}, [setSearchParams]);

	return {
		login,
		hasSearch: login.length > 0,
		search,
		clear
	};
}
