import { describe, expect, it } from "vitest";
import data from "../src/data/life-expectancy.json";
import { resolveLifeExpectancy, type LifeExpectancyData } from "../src/domain/lifeExpectancy";

const fixture: LifeExpectancyData = {
	world: { year: 2023, both: 73.3, male: 70.6, female: 76.1 },
	countries: [{ iso3: "KAZ", iso2: "KZ", name: "Kazakhstan", year: 2023, both: 74.8, male: 70.4, female: 78.8 }],
};

describe("resolveLifeExpectancy", () => {
	it("prefers the manual override", () => {
		expect(resolveLifeExpectancy(fixture, { country: "KAZ", sex: "male", lifeExpectancyOverride: 85 })).toEqual({
			years: 85,
			source: { kind: "override" },
		});
	});

	it("uses the country value for the selected sex", () => {
		const resolved = resolveLifeExpectancy(fixture, { country: "KAZ", sex: "female", lifeExpectancyOverride: null });
		expect(resolved.years).toBe(78.8);
		expect(resolved.source).toEqual({ kind: "who", country: fixture.countries[0] });
	});

	it("uses both sexes when sex is unspecified", () => {
		expect(resolveLifeExpectancy(fixture, { country: "KAZ", sex: "unspecified", lifeExpectancyOverride: null }).years).toBe(74.8);
	});

	it("falls back to the global value without a known country", () => {
		expect(resolveLifeExpectancy(fixture, { country: null, sex: "male", lifeExpectancyOverride: null })).toEqual({
			years: 70.6,
			source: { kind: "who", country: null },
		});
		expect(resolveLifeExpectancy(fixture, { country: "XXX", sex: "unspecified", lifeExpectancyOverride: null }).years).toBe(73.3);
	});
});

describe("bundled WHO snapshot", () => {
	it("has a global record and countries with all sex values", () => {
		const snapshot = data as LifeExpectancyData;
		expect(snapshot.world.both).toBeGreaterThan(50);
		expect(snapshot.countries.length).toBeGreaterThan(150);
		for (const country of snapshot.countries) {
			expect(country.iso3).toMatch(/^[A-Z]{3}$/);
			expect([country.both, country.male, country.female].every((v) => v > 20 && v < 100)).toBe(true);
		}
	});
});
