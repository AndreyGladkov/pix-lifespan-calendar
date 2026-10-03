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

export interface YearRange {
    from: number;
    to: number;
}

export interface LifestyleSpans {
    gained: YearRange | null;
    lost: YearRange | null;
}

export const NO_LIFESTYLE_SPANS: LifestyleSpans = { gained: null, lost: null };

export interface ResolvedLifeExpectancy {
    years: number;
    estimate: LifeExpectancyEstimate;
    overridden: boolean;
    spans: LifestyleSpans;
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

export function lifestyleSpans({ baseline, adjustments, years }: LifeExpectancyEstimate): LifestyleSpans {
    const total = (sign: 1 | -1): number =>
        adjustments.filter((a) => Math.sign(a.years) === sign).reduce((sum, a) => sum + a.years, 0);
    const gains = total(1);
    const afterLosses = Math.max(LIFE_EXPECTANCY_RANGE.min, baseline + total(-1));
    return {
        gained: gains > 0 ? { from: afterLosses, to: years } : null,
        lost: years < baseline ? { from: years, to: baseline } : null,
    };
}

export function resolveLifeExpectancy(data: LifeExpectancyData, input: LifeExpectancyInput): ResolvedLifeExpectancy {
    const estimate = estimateLifeExpectancy(data, input);
    const override = input.lifeExpectancyOverride;
    return {
        years: override ?? estimate.years,
        estimate,
        overridden: override !== null,
        spans: override === null ? lifestyleSpans(estimate) : NO_LIFESTYLE_SPANS,
    };
}
