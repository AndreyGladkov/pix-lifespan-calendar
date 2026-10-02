import type { LifeCalendarSettings } from "./settings";

type Listener = () => void;

export class SettingsStore {
	private readonly listeners = new Set<Listener>();

	constructor(
		private current: LifeCalendarSettings,
		private readonly persist: (settings: LifeCalendarSettings) => Promise<void>,
	) {}

	get = (): LifeCalendarSettings => this.current;

	subscribe = (listener: Listener): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	async update(patch: Partial<LifeCalendarSettings>): Promise<void> {
		this.current = { ...this.current, ...patch };
		this.listeners.forEach((listener) => listener());
		await this.persist(this.current);
	}
}
