import { TFile, type App, type Plugin, type TAbstractFile } from "obsidian";
import { calendarNote, DATE_PROPERTY, sameNote, type CalendarNote } from "./domain/notes";
import { ExternalStore } from "./externalStore";

export class NotesIndex extends ExternalStore<CalendarNote[]> {
    private readonly notes = new Map<string, CalendarNote>();

    constructor(private readonly app: App) {
        super([]);
    }

    track(plugin: Plugin): void {
        const { vault, metadataCache, workspace } = this.app;
        workspace.onLayoutReady(() => {
            this.notes.clear();
            for (const file of vault.getMarkdownFiles()) this.index(file);
            this.publish();
            plugin.registerEvent(metadataCache.on("changed", (file) => this.update(file)));
            plugin.registerEvent(vault.on("rename", (file, oldPath) => this.rename(file, oldPath)));
            plugin.registerEvent(vault.on("delete", (file) => this.remove(file)));
        });
    }

    private index(file: TFile): CalendarNote | null {
        if (file.extension !== "md") return null;
        const dateProperty: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter?.[DATE_PROPERTY];
        const note = calendarNote(file.path, file.basename, dateProperty);
        if (note) this.notes.set(file.path, note);
        else this.notes.delete(file.path);
        return note;
    }

    private update(file: TFile): void {
        const previous = this.notes.get(file.path);
        if (!sameNote(previous, this.index(file))) this.publish();
    }

    private rename(file: TAbstractFile, oldPath: string): void {
        const removed = this.notes.delete(oldPath);
        const added = file instanceof TFile && this.index(file) !== null;
        if (removed || added) this.publish();
    }

    private remove(file: TAbstractFile): void {
        if (this.notes.delete(file.path)) this.publish();
    }

    private publish(): void {
        this.set([...this.notes.values()]);
    }
}
