import { format, parseISO } from "date-fns";
import {
    PluginSettingTab,
    Setting,
    type App,
    type Plugin,
    type SettingDefinition,
    type SettingDefinitionItem,
    type TextComponent,
} from "obsidian";
import { countryNamer } from "./countryNames";
import { ageAt } from "./domain/grid";
import { estimateLifeExpectancy, type LifeExpectancyData } from "./domain/lifeExpectancy";
import type { MessageKey, Translator } from "./i18n";
import { estimatePlaceholder, formatYears } from "./lifeExpectancyText";
import {
    parseBirthDate,
    parseLifeExpectancy,
    parseQuitAge,
    type LifeCalendarSettings,
    type ParseResult,
} from "./settings";
import type { SettingsStore } from "./settingsStore";

type ChoiceKey = "sex" | "unit" | "smoking" | "alcohol" | "activity";
type ChoiceOptions<K extends ChoiceKey> = Record<LifeCalendarSettings[K], MessageKey>;

const SEX_OPTIONS: ChoiceOptions<"sex"> = { unspecified: "sexUnspecified", male: "sexMale", female: "sexFemale" };
const UNIT_OPTIONS: ChoiceOptions<"unit"> = { day: "unitDay", week: "unitWeek", month: "unitMonth" };
const SMOKING_OPTIONS: ChoiceOptions<"smoking"> = {
    unspecified: "notSpecified",
    never: "smokingNever",
    current: "smokingCurrent",
    former: "smokingFormer",
};
const ALCOHOL_OPTIONS: ChoiceOptions<"alcohol"> = {
    unspecified: "notSpecified",
    under10: "alcoholUnder10",
    "10to20": "alcohol10to20",
    "20to35": "alcohol20to35",
    over35: "alcoholOver35",
};
const ACTIVITY_OPTIONS: ChoiceOptions<"activity"> = {
    unspecified: "notSpecified",
    none: "activityNone",
    upTo75: "activityUpTo75",
    "75to149": "activity75to149",
    "150to299": "activity150to299",
    "300to449": "activity300to449",
    "450plus": "activity450plus",
};

interface Row {
    name?: MessageKey;
    desc?: MessageKey;
    render: (setting: Setting) => void | (() => void);
}

interface Section {
    heading: MessageKey;
    rows: Row[];
}

export class LifeCalendarSettingTab extends PluginSettingTab {
    private readonly nameOfCountry: ReturnType<typeof countryNamer>;
    private cleanups: (() => void)[] = [];

    constructor(
        app: App,
        plugin: Plugin,
        private readonly store: SettingsStore,
        private readonly translator: Translator,
        private readonly data: LifeExpectancyData,
    ) {
        super(app, plugin);
        this.nameOfCountry = countryNamer(translator.language);
    }

    override getSettingDefinitions(): SettingDefinitionItem[] {
        const { t } = this.translator;
        const definition = (row: Row): SettingDefinition => ({
            name: row.name ? t(row.name) : "",
            desc: row.desc ? t(row.desc) : undefined,
            searchable: row.name !== undefined,
            render: (setting) => row.render(setting),
        });
        return this.layout().map((entry) =>
            "heading" in entry
                ? { type: "group", heading: t(entry.heading), items: entry.rows.map(definition) }
                : definition(entry),
        );
    }

    // Obsidian before 1.13 ignores getSettingDefinitions() and renders the tab through display().
    override display(): void {
        const { t } = this.translator;
        this.runCleanups();
        this.containerEl.empty();
        const render = (row: Row): void => {
            const setting = new Setting(this.containerEl);
            if (row.name) setting.setName(t(row.name));
            if (row.desc) setting.setDesc(t(row.desc));
            const cleanup = row.render(setting);
            if (cleanup) this.cleanups.push(cleanup);
        };
        for (const entry of this.layout()) {
            if (!("heading" in entry)) {
                render(entry);
                continue;
            }
            new Setting(this.containerEl).setName(t(entry.heading)).setHeading();
            entry.rows.forEach(render);
        }
    }

    override hide(): void {
        this.runCleanups();
        super.hide();
    }

    private runCleanups(): void {
        this.cleanups.forEach((cleanup) => cleanup());
        this.cleanups = [];
    }

    private layout(): (Row | Section)[] {
        return [
            this.birthDateRow(),
            this.countryRow(),
            this.choiceRow("sex", "sexName", "sexDesc", SEX_OPTIONS),
            {
                heading: "lifestyleHeading",
                rows: [
                    this.lifestyleNoteRow(),
                    this.choiceRow("smoking", "smokingName", "smokingDesc", SMOKING_OPTIONS),
                    this.quitAgeRow(),
                    this.choiceRow("alcohol", "alcoholName", "alcoholDesc", ALCOHOL_OPTIONS),
                    this.choiceRow("activity", "activityName", "activityDesc", ACTIVITY_OPTIONS),
                ],
            },
            this.lifeExpectancyRow(),
            this.choiceRow("unit", "unitName", "unitDesc", UNIT_OPTIONS),
            this.notesFolderRow(),
        ];
    }

    private birthDateRow(): Row {
        return {
            name: "birthDateName",
            desc: "birthDateDesc",
            render: (setting) => {
                const showError = errorMessage(setting, this.translator.t("birthDateError"));
                setting.addText((text) => {
                    text.inputEl.type = "date";
                    text.inputEl.max = format(new Date(), "yyyy-MM-dd");
                    text.setValue(this.store.get().birthDate ?? "");
                    text.onChange((value) =>
                        saveValidated(parseBirthDate(value, new Date()), showError, (birthDate) =>
                            this.store.update({ birthDate }),
                        ),
                    );
                });
            },
        };
    }

    private countryRow(): Row {
        return {
            name: "countryName",
            desc: "countryDesc",
            render: (setting) => {
                const { t, language } = this.translator;
                const countries = this.data.countries
                    .map((country) => ({ iso3: country.iso3, name: this.nameOfCountry(country) }))
                    .sort((a, b) => a.name.localeCompare(b.name, language));
                setting.addDropdown((dropdown) => {
                    dropdown.addOption("", t("countryWorld"));
                    for (const country of countries) dropdown.addOption(country.iso3, country.name);
                    dropdown.setValue(this.store.get().country ?? "");
                    dropdown.onChange((value) => void this.store.update({ country: value === "" ? null : value }));
                });
            },
        };
    }

    private lifestyleNoteRow(): Row {
        return {
            desc: "lifestyleDesc",
            render: (setting) => {
                const ignoredEl = setting.descEl.createDiv({
                    cls: "pix-lifespan-calendar-warning",
                    text: this.translator.t("lifestyleIgnored"),
                });
                return this.watch(() => ignoredEl.toggle(this.store.get().lifeExpectancyOverride !== null));
            },
        };
    }

    private quitAgeRow(): Row {
        return {
            name: "quitAgeName",
            desc: "quitAgeDesc",
            render: (setting) => {
                const showError = errorMessage(setting, this.translator.t("quitAgeError"));
                setting.addText((text) => {
                    text.inputEl.type = "number";
                    text.inputEl.inputMode = "numeric";
                    text.setValue(this.store.get().smokingQuitAge?.toString() ?? "");
                    text.onChange((value) =>
                        saveValidated(parseQuitAge(value, this.currentAge()), showError, (smokingQuitAge) =>
                            this.store.update({ smokingQuitAge }),
                        ),
                    );
                });
                return this.watch(() => setting.settingEl.toggle(this.store.get().smoking === "former"));
            },
        };
    }

    private lifeExpectancyRow(): Row {
        return {
            name: "lifeExpectancyName",
            desc: "lifeExpectancyDesc",
            render: (setting) => {
                const showError = errorMessage(setting, this.translator.t("lifeExpectancyError"));
                let input: TextComponent | null = null;
                setting.addText((text) => {
                    input = text;
                    text.inputEl.inputMode = "decimal";
                    const override = this.store.get().lifeExpectancyOverride;
                    text.setValue(override === null ? "" : formatYears(this.translator, override));
                    text.onChange((value) =>
                        saveValidated(parseLifeExpectancy(value), showError, (lifeExpectancyOverride) =>
                            this.store.update({ lifeExpectancyOverride }),
                        ),
                    );
                });
                setting.addExtraButton((button) =>
                    button
                        .setIcon("rotate-ccw")
                        .setTooltip(this.translator.t("lifeExpectancyReset"))
                        .onClick(() => {
                            input?.setValue("");
                            showError(false);
                            void this.store.update({ lifeExpectancyOverride: null });
                        }),
                );
                return this.watch(() => {
                    input?.setPlaceholder(this.estimatePlaceholder());
                });
            },
        };
    }

    private notesFolderRow(): Row {
        return {
            name: "notesFolderName",
            desc: "notesFolderDesc",
            render: (setting) => {
                setting.addText((text) => {
                    text.setPlaceholder("/");
                    text.setValue(this.store.get().notesFolder);
                    text.onChange((notesFolder) => void this.store.update({ notesFolder: notesFolder.trim() }));
                });
            },
        };
    }

    private choiceRow<K extends ChoiceKey>(key: K, name: MessageKey, desc: MessageKey, options: ChoiceOptions<K>): Row {
        return {
            name,
            desc,
            render: (setting) => {
                const { t } = this.translator;
                setting.addDropdown((dropdown) => {
                    for (const [option, label] of Object.entries<MessageKey>(options)) {
                        dropdown.addOption(option, t(label));
                    }
                    dropdown.setValue(this.store.get()[key]);
                    dropdown.onChange(
                        (selected) => void this.store.update({ [key]: selected as LifeCalendarSettings[K] }),
                    );
                });
            },
        };
    }

    private watch(apply: () => void): () => void {
        apply();
        return this.store.subscribe(apply);
    }

    private currentAge(): number | null {
        const { birthDate } = this.store.get();
        return birthDate === null ? null : ageAt(new Date(), parseISO(birthDate));
    }

    private estimatePlaceholder(): string {
        const estimate = estimateLifeExpectancy(this.data, this.store.get());
        const place = estimate.country
            ? this.nameOfCountry(estimate.country)
            : this.translator.t("lifeExpectancyWorld");
        return estimatePlaceholder(this.translator, estimate, place);
    }
}

function errorMessage(setting: Setting, message: string): (visible: boolean) => void {
    const errorEl = setting.descEl.createDiv({ cls: "pix-lifespan-calendar-error", text: message });
    errorEl.hide();
    return (visible) => {
        errorEl.toggle(visible);
        setting.controlEl.toggleClass("pix-lifespan-calendar-invalid", visible);
    };
}

async function saveValidated<T>(
    result: ParseResult<T>,
    showError: (visible: boolean) => void,
    save: (value: T) => Promise<void>,
): Promise<void> {
    showError(!result.ok);
    if (result.ok) await save(result.value);
}
