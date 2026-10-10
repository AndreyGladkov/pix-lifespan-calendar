import { Keymap, Menu } from "obsidian";
import type { CalendarNote } from "../domain/notes";
import type { Translator } from "../i18n";
import type { NoteActions } from "../noteActions";

interface CellMenuOptions {
    title: string;
    date: Date;
    notes: readonly CalendarNote[];
    actions: NoteActions;
    translator: Translator;
}

export const showCellMenu = (event: MouseEvent, { title, date, notes, actions, translator }: CellMenuOptions): void => {
    const menu = new Menu();
    menu.addItem((item) => item.setTitle(title).setIsLabel(true));
    for (const note of notes) {
        menu.addItem((item) =>
            item
                .setTitle(note.title)
                .setIcon("file-text")
                .onClick((click) => void actions.open(note.path, Keymap.isModEvent(click))),
        );
    }
    menu.addSeparator();
    menu.addItem((item) =>
        item
            .setTitle(translator.t("newNote"))
            .setIcon("file-plus")
            .onClick((click) => void actions.create(date, Keymap.isModEvent(click))),
    );
    menu.showAtMouseEvent(event);
};
