import { describe, expect, it } from "vitest";
import data from "../src/data/life-expectancy.json";
import {
    lifestyleSpans,
    resolveLifeExpectancy,
    type LifeExpectancyData,
    type LifeExpectancyEstimate,
    type LifeExpectancyInput,
} from "../src/domain/lifeExpectancy";
import { NO_LIFESTYLE } from "../src/domain/lifestyle";

const fixture: LifeExpectancyData = {
    world: { year: 2023, both: 73.3, male: 70.6, female: 76.1 },
    countries: [{ iso3: "KAZ", iso2: "KZ", name: "Kazakhstan", year: 2023, both: 74.8, male: 70.4, female: 78.8 }],
};
const kazakhstan = fixture.countries[0];

const input = (overrides: Partial<LifeExpectancyInput>): LifeExpectancyInput => ({
    country: "KAZ",
    sex: "unspecified",
    lifeExpectancyOverride: null,
    ...NO_LIFESTYLE,
    ...overrides,
});

describe("resolveLifeExpectancy", () => {
    it("prefers the manual override but still reports the WHO estimate", () => {
        const resolved = resolveLifeExpectancy(fixture, input({ lifeExpectancyOverride: 85, smoking: "current" }));
        expect(resolved.years).toBe(85);
        expect(resolved.overridden).toBe(true);
        expect(resolved.estimate.years).toBeCloseTo(64.8, 5);
    });

    it("uses the country value for the selected sex", () => {
        const resolved = resolveLifeExpectancy(fixture, input({ sex: "female" }));
        expect(resolved).toEqual({
            years: 78.8,
            estimate: { years: 78.8, country: kazakhstan, baseline: 78.8, adjustments: [] },
            overridden: false,
            spans: { gained: null, lost: null },
        });
    });

    it("uses both sexes when sex is unspecified", () => {
        expect(resolveLifeExpectancy(fixture, input({})).years).toBe(74.8);
    });

    it("falls back to the world value without a known country", () => {
        expect(resolveLifeExpectancy(fixture, input({ country: null, sex: "male" })).years).toBe(70.6);
        expect(resolveLifeExpectancy(fixture, input({ country: "XXX" })).years).toBe(73.3);
    });

    it("adds lifestyle adjustments to the WHO baseline", () => {
        const resolved = resolveLifeExpectancy(fixture, input({ smoking: "current", activity: "150to299" }));
        expect(resolved.years).toBeCloseTo(68.2, 5);
        expect(resolved.estimate).toMatchObject({
            country: kazakhstan,
            baseline: 74.8,
            adjustments: [
                { factor: "smoking", years: -10 },
                { factor: "activity", years: 3.4 },
            ],
        });
    });

    it("never goes below one year", () => {
        const tiny: LifeExpectancyData = { ...fixture, world: { year: 2023, both: 5, male: 5, female: 5 } };
        expect(resolveLifeExpectancy(tiny, input({ country: null, smoking: "current" })).years).toBe(1);
    });
});

describe("lifestyleSpans", () => {
    const estimate = (baseline: number, adjustments: number[]): LifeExpectancyEstimate => ({
        years: adjustments.reduce((sum, years) => sum + years, baseline),
        country: null,
        baseline,
        adjustments: adjustments.map((years) => ({ factor: years < 0 ? "smoking" : "activity", years })),
    });

    it("shows what gains add after losses and what the net loss takes away", () => {
        const spans = lifestyleSpans(estimate(74.8, [-10, 3.4]));
        expect(spans.gained?.from).toBeCloseTo(64.8, 5);
        expect(spans.gained?.to).toBeCloseTo(68.2, 5);
        expect(spans.lost?.from).toBeCloseTo(68.2, 5);
        expect(spans.lost?.to).toBe(74.8);
    });

    it("extends past the WHO value when gains outweigh losses", () => {
        const spans = lifestyleSpans(estimate(74.8, [-0.5, 4.5]));
        expect(spans.gained?.from).toBeCloseTo(74.3, 5);
        expect(spans.gained?.to).toBeCloseTo(78.8, 5);
        expect(spans.lost).toBeNull();
    });

    it("marks nothing without adjustments", () => {
        expect(lifestyleSpans(estimate(74.8, []))).toEqual({ gained: null, lost: null });
    });

    it("is not applied with a manual override", () => {
        const resolved = resolveLifeExpectancy(fixture, input({ lifeExpectancyOverride: 85, smoking: "current" }));
        expect(resolved.spans).toEqual({ gained: null, lost: null });
    });
});

describe("bundled WHO snapshot", () => {
    it("has a world record and countries with all sex values", () => {
        const snapshot = data as LifeExpectancyData;
        expect(snapshot.world.both).toBeGreaterThan(50);
        expect(snapshot.countries.length).toBeGreaterThan(150);
        for (const country of snapshot.countries) {
            expect(country.iso3).toMatch(/^[A-Z]{3}$/);
            expect([country.both, country.male, country.female].every((v) => v > 20 && v < 100)).toBe(true);
        }
    });
});
