export interface UserProfileResponse {
	login: string;
	name: string | null;
	avatarUrl: string;
	url: string;
	followersCount: number;
	followingCount: number;
}
