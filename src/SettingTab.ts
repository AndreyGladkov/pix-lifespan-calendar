import { format } from "date-fns";
import { PluginSettingTab, Setting, type App, type Plugin, type TextComponent } from "obsidian";
import { countryNamer } from "./countryNames";
import { whoLifeExpectancy, type LifeExpectancyData, type Sex } from "./domain/lifeExpectancy";
import type { GridUnit } from "./domain/grid";
import type { Translator } from "./i18n";
import { parseBirthDate, parseLifeExpectancy, type ParseResult } from "./settings";
import type { SettingsStore } from "./settingsStore";

const SEX_OPTIONS = { unspecified: "sexUnspecified", male: "sexMale", female: "sexFemale" } as const;
const UNIT_OPTIONS = { day: "unitDay", week: "unitWeek", month: "unitMonth" } as const;

export class LifeCalendarSettingTab extends PluginSettingTab {
    private lifeExpectancyText: TextComponent | null = null;

    constructor(
        app: App,
        plugin: Plugin,
        private readonly store: SettingsStore,
        private readonly translator: Translator,
        private readonly data: LifeExpectancyData,
    ) {
        super(app, plugin);
    }

    display(): void {
        this.containerEl.empty();
        this.addBirthDate();
        this.addCountry();
        this.addSex();
        this.addLifeExpectancy();
        this.addUnit();
    }

    private addBirthDate(): void {
        const { t } = this.translator;
        const setting = new Setting(this.containerEl).setName(t("birthDateName")).setDesc(t("birthDateDesc"));
        const showError = errorMessage(setting, t("birthDateError"));
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
    }

    private addCountry(): void {
        const { t, language } = this.translator;
        const nameOf = countryNamer(language);
        const countries = this.data.countries
            .map((country) => ({ iso3: country.iso3, name: nameOf(country) }))
            .sort((a, b) => a.name.localeCompare(b.name, language));
        new Setting(this.containerEl)
            .setName(t("countryName"))
            .setDesc(t("countryDesc"))
            .addDropdown((dropdown) => {
                dropdown.addOption("", t("countryWorld"));
                for (const country of countries) dropdown.addOption(country.iso3, country.name);
                dropdown.setValue(this.store.get().country ?? "");
                dropdown.onChange(
                    (value) =>
                        void this.store
                            .update({ country: value === "" ? null : value })
                            .then(() => this.refreshLifeExpectancyPlaceholder()),
                );
            });
    }

    private addSex(): void {
        const { t } = this.translator;
        new Setting(this.containerEl)
            .setName(t("sexName"))
            .setDesc(t("sexDesc"))
            .addDropdown((dropdown) => {
                for (const [value, label] of Object.entries(SEX_OPTIONS)) dropdown.addOption(value, t(label));
                dropdown.setValue(this.store.get().sex);
                dropdown.onChange(
                    (value) =>
                        void this.store
                            .update({ sex: value as Sex })
                            .then(() => this.refreshLifeExpectancyPlaceholder()),
                );
            });
    }

    private addLifeExpectancy(): void {
        const { t } = this.translator;
        const setting = new Setting(this.containerEl).setName(t("lifeExpectancyName")).setDesc(t("lifeExpectancyDesc"));
        const showError = errorMessage(setting, t("lifeExpectancyError"));
        setting.addText((text) => {
            this.lifeExpectancyText = text;
            text.inputEl.inputMode = "decimal";
            text.setValue(this.formatOverride());
            text.onChange((value) =>
                saveValidated(parseLifeExpectancy(value), showError, (lifeExpectancyOverride) =>
                    this.store.update({ lifeExpectancyOverride }),
                ),
            );
        });
        setting.addExtraButton((button) =>
            button
                .setIcon("rotate-ccw")
                .setTooltip(t("lifeExpectancyReset"))
                .onClick(() => {
                    this.lifeExpectancyText?.setValue("");
                    showError(false);
                    void this.store.update({ lifeExpectancyOverride: null });
                }),
        );
        this.refreshLifeExpectancyPlaceholder();
    }

    private addUnit(): void {
        const { t } = this.translator;
        new Setting(this.containerEl)
            .setName(t("unitName"))
            .setDesc(t("unitDesc"))
            .addDropdown((dropdown) => {
                for (const [value, label] of Object.entries(UNIT_OPTIONS)) dropdown.addOption(value, t(label));
                dropdown.setValue(this.store.get().unit);
                dropdown.onChange((value) => void this.store.update({ unit: value as GridUnit }));
            });
    }

    private formatOverride(): string {
        const override = this.store.get().lifeExpectancyOverride;
        return override === null ? "" : this.translator.formatNumber(override, { maximumFractionDigits: 1 });
    }

    private refreshLifeExpectancyPlaceholder(): void {
        const { t, formatNumber, language } = this.translator;
        const { country, sex } = this.store.get();
        const who = whoLifeExpectancy(this.data, country, sex);
        const place = who.country ? countryNamer(language)(who.country) : t("lifeExpectancyWorld");
        this.lifeExpectancyText?.setPlaceholder(
            t("lifeExpectancyPlaceholder", { years: formatNumber(who.years, { maximumFractionDigits: 1 }), place }),
        );
    }
}

function errorMessage(setting: Setting, message: string): (visible: boolean) => void {
    const errorEl = setting.descEl.createDiv({ cls: "lifespan-calendar-error", text: message });
    errorEl.hide();
    return (visible) => {
        errorEl.toggle(visible);
        setting.controlEl.toggleClass("lifespan-calendar-invalid", visible);
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
