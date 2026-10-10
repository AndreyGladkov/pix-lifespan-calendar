import { ExternalStore } from "./externalStore";
import type { LifeCalendarSettings } from "./settings";

export class SettingsStore extends ExternalStore<LifeCalendarSettings> {
    constructor(
        current: LifeCalendarSettings,
        private readonly persist: (settings: LifeCalendarSettings) => Promise<void>,
    ) {
        super(current);
    }

    async update(patch: Partial<LifeCalendarSettings>): Promise<void> {
        this.set({ ...this.get(), ...patch });
        await this.persist(this.get());
    }
}
