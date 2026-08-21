import type { AudienceType } from "../model/types";

function storageKey(login: string, type: AudienceType): string {
	return `audience-job:${login}:${type}`;
}

export const jobStorage = {
	read(login: string, type: AudienceType): string | null {
		try {
			return localStorage.getItem(storageKey(login, type));
		} catch {
			return null;
		}
	},

	write(login: string, type: AudienceType, jobId: string): void {
		try {
			localStorage.setItem(storageKey(login, type), jobId);
		} catch {
			console.warn("Persistance failed");
		}
	},

	clear(login: string, type: AudienceType): void {
		try {
			localStorage.removeItem(storageKey(login, type));
		} catch {
			console.warn("Removing Persistance failed");
		}
	}
};
