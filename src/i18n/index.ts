import { de } from "./de";
import { en } from "./en";
import { fr } from "./fr";
import type { Plural } from "./plural";
import { ru } from "./ru";

type Dictionary = typeof en;
type KeysOfType<T> = { [K in keyof Dictionary]: Dictionary[K] extends T ? K : never }[keyof Dictionary];
export type MessageKey = KeysOfType<string>;
export type PluralKey = KeysOfType<Plural>;
type Params = Record<string, string | number>;

const DICTIONARIES = { en, ru, de, fr } satisfies Record<string, Dictionary>;
export type Language = keyof typeof DICTIONARIES;

export function supportedLanguage(language: string): Language {
    const base = language.toLowerCase().split("-")[0] ?? "";
    return base in DICTIONARIES ? (base as Language) : "en";
}

export interface Translator {
    language: Language;
    t: (key: MessageKey, params?: Params) => string;
    plural: (key: PluralKey, count: number, params?: Params) => string;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

function interpolate(template: string, params: Params): string {
    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = params[name];
        return value === undefined ? match : String(value);
    });
}

export function createTranslator(language: Language): Translator {
    const dictionary: Dictionary = DICTIONARIES[language];
    const pluralRules = new Intl.PluralRules(language);
    return {
        language,
        t: (key, params = {}) => interpolate(dictionary[key], params),
        plural: (key, count, params = {}) => {
            const forms = dictionary[key];
            return interpolate(forms[pluralRules.select(count)] ?? forms.other, params);
        },
        formatNumber: (value, options) => new Intl.NumberFormat(language, options).format(value),
    };
}
