import type { CountryLifeExpectancy } from "./domain/lifeExpectancy";
import type { Language } from "./i18n";

export function countryNamer(language: Language): (country: CountryLifeExpectancy) => string {
    const names = new Intl.DisplayNames(language, { type: "region", fallback: "none" });
    return (country) => (country.iso2 === null ? undefined : names.of(country.iso2)) ?? country.name;
}
