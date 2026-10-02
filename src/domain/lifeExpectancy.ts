export type Sex = "male" | "female" | "unspecified";

export interface LifeExpectancyRecord {
    year: number;
    both: number;
    male: number;
    female: number;
}

export interface CountryLifeExpectancy extends LifeExpectancyRecord {
    iso3: string;
    iso2: string | null;
    name: string;
}

export interface LifeExpectancyData {
    world: LifeExpectancyRecord;
    countries: CountryLifeExpectancy[];
}

export type LifeExpectancySource = { kind: "override" } | { kind: "who"; country: CountryLifeExpectancy | null };

export interface ResolvedLifeExpectancy {
    years: number;
    source: LifeExpectancySource;
}

export interface LifeExpectancyInput {
    country: string | null;
    sex: Sex;
    lifeExpectancyOverride: number | null;
}

export function whoLifeExpectancy(
    data: LifeExpectancyData,
    countryIso3: string | null,
    sex: Sex,
): { years: number; country: CountryLifeExpectancy | null } {
    const country = data.countries.find((c) => c.iso3 === countryIso3) ?? null;
    const record = country ?? data.world;
    return { years: sex === "unspecified" ? record.both : record[sex], country };
}

export function resolveLifeExpectancy(data: LifeExpectancyData, input: LifeExpectancyInput): ResolvedLifeExpectancy {
    if (input.lifeExpectancyOverride !== null) {
        return { years: input.lifeExpectancyOverride, source: { kind: "override" } };
    }
    const { years, country } = whoLifeExpectancy(data, input.country, input.sex);
    return { years, source: { kind: "who", country } };
}
