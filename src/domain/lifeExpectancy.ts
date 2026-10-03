import { lifestyleAdjustments, type Lifestyle, type LifestyleAdjustment } from "./lifestyle";

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

export const LIFE_EXPECTANCY_RANGE = { min: 1, max: 150 };

export interface LifeExpectancyEstimate {
    years: number;
    country: CountryLifeExpectancy | null;
    baseline: number;
    adjustments: LifestyleAdjustment[];
}

export interface ResolvedLifeExpectancy {
    years: number;
    estimate: LifeExpectancyEstimate;
    overridden: boolean;
}

export interface EstimateInput extends Lifestyle {
    country: string | null;
    sex: Sex;
}

export interface LifeExpectancyInput extends EstimateInput {
    lifeExpectancyOverride: number | null;
}

export function estimateLifeExpectancy(data: LifeExpectancyData, input: EstimateInput): LifeExpectancyEstimate {
    const country = data.countries.find((c) => c.iso3 === input.country) ?? null;
    const record = country ?? data.world;
    const baseline = input.sex === "unspecified" ? record.both : record[input.sex];
    const adjustments = lifestyleAdjustments(input);
    const adjusted = adjustments.reduce((total, adjustment) => total + adjustment.years, baseline);
    return { years: Math.max(LIFE_EXPECTANCY_RANGE.min, adjusted), country, baseline, adjustments };
}

export function resolveLifeExpectancy(data: LifeExpectancyData, input: LifeExpectancyInput): ResolvedLifeExpectancy {
    const estimate = estimateLifeExpectancy(data, input);
    const override = input.lifeExpectancyOverride;
    return { years: override ?? estimate.years, estimate, overridden: override !== null };
}
