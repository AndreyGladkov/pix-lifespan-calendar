import { format, parseISO } from "date-fns";
import { PluginSettingTab, Setting, type App, type Plugin, type TextComponent } from "obsidian";
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

export class LifeCalendarSettingTab extends PluginSettingTab {
    private lifeExpectancyText: TextComponent | null = null;
    private lifestyleIgnoredEl: HTMLElement | null = null;
    private unsubscribe: (() => void) | null = null;
    private readonly nameOfCountry: ReturnType<typeof countryNamer>;

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

    display(): void {
        this.containerEl.empty();
        this.addBirthDate();
        this.addCountry();
        this.addChoice("sex", "sexName", "sexDesc", SEX_OPTIONS);
        this.addLifestyle();
        this.addLifeExpectancy();
        this.addChoice("unit", "unitName", "unitDesc", UNIT_OPTIONS);
        this.refreshLifeExpectancyHints();
        this.unsubscribe?.();
        this.unsubscribe = this.store.subscribe(() => this.refreshLifeExpectancyHints());
    }

    override hide(): void {
        this.unsubscribe?.();
        this.unsubscribe = null;
        super.hide();
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
        const countries = this.data.countries
            .map((country) => ({ iso3: country.iso3, name: this.nameOfCountry(country) }))
            .sort((a, b) => a.name.localeCompare(b.name, language));
        new Setting(this.containerEl)
            .setName(t("countryName"))
            .setDesc(t("countryDesc"))
            .addDropdown((dropdown) => {
                dropdown.addOption("", t("countryWorld"));
                for (const country of countries) dropdown.addOption(country.iso3, country.name);
                dropdown.setValue(this.store.get().country ?? "");
                dropdown.onChange((value) => void this.store.update({ country: value === "" ? null : value }));
            });
    }

    private addLifestyle(): void {
        const { t } = this.translator;
        const heading = new Setting(this.containerEl)
            .setName(t("lifestyleHeading"))
            .setDesc(t("lifestyleDesc"))
            .setHeading();
        this.lifestyleIgnoredEl = heading.descEl.createDiv({
            cls: "lifespan-calendar-warning",
            text: t("lifestyleIgnored"),
        });

        this.addChoice("smoking", "smokingName", "smokingDesc", SMOKING_OPTIONS, (smoking) =>
            quitAge.settingEl.toggle(smoking === "former"),
        );
        const quitAge = this.addQuitAge();
        quitAge.settingEl.toggle(this.store.get().smoking === "former");
        this.addChoice("alcohol", "alcoholName", "alcoholDesc", ALCOHOL_OPTIONS);
        this.addChoice("activity", "activityName", "activityDesc", ACTIVITY_OPTIONS);
    }

    private addQuitAge(): Setting {
        const { t } = this.translator;
        const setting = new Setting(this.containerEl).setName(t("quitAgeName")).setDesc(t("quitAgeDesc"));
        const showError = errorMessage(setting, t("quitAgeError"));
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
        return setting;
    }

    private addLifeExpectancy(): void {
        const { t } = this.translator;
        const setting = new Setting(this.containerEl).setName(t("lifeExpectancyName")).setDesc(t("lifeExpectancyDesc"));
        const showError = errorMessage(setting, t("lifeExpectancyError"));
        setting.addText((text) => {
            this.lifeExpectancyText = text;
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
                .setTooltip(t("lifeExpectancyReset"))
                .onClick(() => {
                    this.lifeExpectancyText?.setValue("");
                    showError(false);
                    void this.store.update({ lifeExpectancyOverride: null });
                }),
        );
    }

    private addChoice<K extends ChoiceKey>(
        key: K,
        name: MessageKey,
        description: MessageKey,
        options: ChoiceOptions<K>,
        onChange?: (value: LifeCalendarSettings[K]) => void,
    ): void {
        const { t } = this.translator;
        new Setting(this.containerEl)
            .setName(t(name))
            .setDesc(t(description))
            .addDropdown((dropdown) => {
                for (const [option, label] of Object.entries<MessageKey>(options)) dropdown.addOption(option, t(label));
                dropdown.setValue(this.store.get()[key]);
                dropdown.onChange((selected) => {
                    const value = selected as LifeCalendarSettings[K];
                    onChange?.(value);
                    void this.store.update({ [key]: value });
                });
            });
    }

    private currentAge(): number | null {
        const { birthDate } = this.store.get();
        return birthDate === null ? null : ageAt(new Date(), parseISO(birthDate));
    }

    private refreshLifeExpectancyHints(): void {
        const settings = this.store.get();
        const estimate = estimateLifeExpectancy(this.data, settings);
        const place = estimate.country
            ? this.nameOfCountry(estimate.country)
            : this.translator.t("lifeExpectancyWorld");
        this.lifeExpectancyText?.setPlaceholder(estimatePlaceholder(this.translator, estimate, place));
        this.lifestyleIgnoredEl?.toggle(settings.lifeExpectancyOverride !== null);
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
