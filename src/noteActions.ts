import { normalizePath, type App, type PaneType } from "obsidian";
import { freeNotePath, newNoteContent } from "./domain/notes";
import type { Translator } from "./i18n";
import type { SettingsStore } from "./settingsStore";

export class NoteActions {
    constructor(
        private readonly app: App,
        private readonly store: SettingsStore,
        private readonly translator: Translator,
    ) {}

    async open(path: string, newLeaf: PaneType | boolean): Promise<void> {
        const file = this.app.vault.getFileByPath(path);
        if (file) await this.app.workspace.getLeaf(newLeaf).openFile(file);
    }

    async create(date: Date, newLeaf: PaneType | boolean): Promise<void> {
        const { vault, workspace } = this.app;
        const folder = normalizePath(this.store.get().notesFolder);
        if (folder !== "/" && !vault.getFolderByPath(folder)) await vault.createFolder(folder);
        const path = freeNotePath(folder, this.translator.t("untitledNote"), (candidate) =>
            Boolean(vault.getAbstractFileByPath(candidate)),
        );
        const file = await vault.create(path, newNoteContent(date));
        // `rename: "all"` is what Obsidian's own "New note" command passes to focus and select
        // the inline title; it is not documented in the public API.
        await workspace.getLeaf(newLeaf).openFile(file, { state: { mode: "source" }, eState: { rename: "all" } });
    }
}
