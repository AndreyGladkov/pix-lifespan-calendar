import { ItemView, type WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { LifeExpectancyData } from "../domain/lifeExpectancy";
import type { Translator } from "../i18n";
import type { SettingsStore } from "../settingsStore";
import { LifeCalendar } from "./LifeCalendar";

export const VIEW_TYPE_LIFE_CALENDAR = "lifespan-calendar";
export const LIFE_CALENDAR_ICON = "calendar-days";

export interface LifeCalendarViewDeps {
    store: SettingsStore;
    translator: Translator;
    data: LifeExpectancyData;
    openSettings: () => void;
}

export class LifeCalendarView extends ItemView {
    private root: Root | null = null;

    constructor(
        leaf: WorkspaceLeaf,
        private readonly deps: LifeCalendarViewDeps,
    ) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_LIFE_CALENDAR;
    }

    getDisplayText(): string {
        return this.deps.translator.t("viewTitle");
    }

    override getIcon(): string {
        return LIFE_CALENDAR_ICON;
    }

    override async onOpen(): Promise<void> {
        this.root = createRoot(this.contentEl);
        this.root.render(
            <StrictMode>
                <LifeCalendar {...this.deps} />
            </StrictMode>,
        );
    }

    override async onClose(): Promise<void> {
        this.root?.unmount();
        this.root = null;
    }
}
