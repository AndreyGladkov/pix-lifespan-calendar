import { getLanguage, Plugin } from "obsidian";
import { lifeExpectancyData } from "./data";
import { createTranslator, supportedLanguage, type Translator } from "./i18n";
import { NoteActions } from "./noteActions";
import { NotesIndex } from "./notesIndex";
import { DEFAULT_SETTINGS, type LifeCalendarSettings } from "./settings";
import { SettingsStore } from "./settingsStore";
import { LifeCalendarSettingTab } from "./SettingTab";
import { LIFE_CALENDAR_ICON, LifeCalendarView, VIEW_TYPE_LIFE_CALENDAR } from "./view/LifeCalendarView";

interface SettingsManager {
    open(): void;
    openTabById(id: string): void;
}

export default class LifeCalendarPlugin extends Plugin {
    override async onload(): Promise<void> {
        const saved = (await this.loadData()) as Partial<LifeCalendarSettings> | null;
        const store = new SettingsStore({ ...DEFAULT_SETTINGS, ...saved }, (settings) => this.saveData(settings));
        const translator: Translator = createTranslator(supportedLanguage(getLanguage()));
        const data = lifeExpectancyData;
        const notes = new NotesIndex(this.app);
        notes.track(this);
        const noteActions = new NoteActions(this.app, store, translator);

        this.registerView(
            VIEW_TYPE_LIFE_CALENDAR,
            (leaf) =>
                new LifeCalendarView(leaf, {
                    store,
                    translator,
                    data,
                    notes,
                    noteActions,
                    openSettings: () => this.openSettings(),
                }),
        );
        this.addRibbonIcon(LIFE_CALENDAR_ICON, translator.t("openCalendar"), () => void this.activateView());
        this.addCommand({ id: "open", name: translator.t("openCalendar"), callback: () => void this.activateView() });
        this.addSettingTab(new LifeCalendarSettingTab(this.app, this, store, translator, data));
    }

    private async activateView(): Promise<void> {
        const { workspace } = this.app;
        const existing = workspace.getLeavesOfType(VIEW_TYPE_LIFE_CALENDAR)[0];
        const leaf = existing ?? workspace.getLeaf("tab");
        if (!existing) await leaf.setViewState({ type: VIEW_TYPE_LIFE_CALENDAR, active: true });
        await workspace.revealLeaf(leaf);
    }

    private openSettings(): void {
        // `app.setting` is not part of the public Obsidian API, but it is the only way
        // to open a specific plugin's settings tab programmatically.
        const setting = (this.app as unknown as { setting: SettingsManager }).setting;
        setting.open();
        setting.openTabById(this.manifest.id);
    }
}
