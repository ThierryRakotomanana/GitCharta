export interface ProfileNode {
	login: string;
	id: string;
	name: string | null;
	avatarUrl: string;
	url: string;
	company: string | null;
	location: string | null;
	twitterUsername: string | null;
	isSiteAdmin: boolean;
}

export type LocalizedProfile = ProfileNode & { country: string };
export type Credentials = { user: string };

export interface ApiErrorBody {
	error: string;
	resetAt?: string;
}
