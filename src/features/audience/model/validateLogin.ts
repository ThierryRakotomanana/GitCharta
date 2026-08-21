const LOGIN_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function isValidLogin(login: string): boolean {
	return LOGIN_PATTERN.test(login);
}
