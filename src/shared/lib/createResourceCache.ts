type Listener = () => void;

export interface ResourceCache<T> {
	get(key: string): T | undefined;
	set(key: string, value: T): void;
	delete(key: string): void;
	has(key: string): boolean;
	clear(): void;
	subscribe(key: string, listener: Listener): () => void;
}

export function createResourceCache<T>(): ResourceCache<T> {
	const store = new Map<string, T>();
	const listeners = new Map<string, Set<Listener>>();

	function notify(key: string) {
		listeners.get(key)?.forEach((fn) => fn());
	}

	return {
		get(key) {
			return store.get(key);
		},
		set(key, value) {
			store.set(key, value);
			notify(key);
		},
		delete(key) {
			if (!store.has(key)) return;
			store.delete(key);
			notify(key);
		},
		has(key) {
			return store.has(key);
		},
		clear() {
			store.clear();
		},
		subscribe(key, listener) {
			if (!listeners.has(key)) listeners.set(key, new Set());
			const set = listeners.get(key)!;
			set.add(listener);
			return () => {
				set.delete(listener);
				if (set.size === 0) listeners.delete(key);
			};
		}
	};
}
