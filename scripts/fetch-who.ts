import { writeFile } from "node:fs/promises";
import countries from "i18n-iso-countries";
import type { LifeExpectancyData, LifeExpectancyRecord } from "../src/domain/lifeExpectancy";

const GHO_API = "https://ghoapi.azureedge.net/api";
const INDICATOR = "WHOSIS_000001";
const OUTPUT = new URL("../src/data/life-expectancy.json", import.meta.url);

interface Observation {
	SpatialDimType: string;
	SpatialDim: string;
	Dim1: string;
	TimeDim: number;
	NumericValue: number | null;
}

interface DimensionValue {
	Code: string;
	Title: string;
}

const SEX_FIELDS: Record<string, keyof Pick<LifeExpectancyRecord, "both" | "male" | "female">> = {
	SEX_BTSX: "both",
	SEX_MLE: "male",
	SEX_FMLE: "female",
};

async function fetchValues<T>(path: string): Promise<T[]> {
	const response = await fetch(`${GHO_API}/${path}`);
	if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
	const body = (await response.json()) as { value: T[] };
	return body.value;
}

function latestRecord(observations: Observation[]): LifeExpectancyRecord | null {
	const byYear = new Map<number, Partial<LifeExpectancyRecord>>();
	for (const observation of observations) {
		const field = SEX_FIELDS[observation.Dim1];
		if (!field || observation.NumericValue === null) continue;
		const record = byYear.get(observation.TimeDim) ?? {};
		record[field] = Math.round(observation.NumericValue * 10) / 10;
		byYear.set(observation.TimeDim, record);
	}
	const complete = [...byYear.entries()]
		.filter(([, r]) => r.both !== undefined && r.male !== undefined && r.female !== undefined)
		.sort(([a], [b]) => b - a);
	const latest = complete[0];
	if (!latest) return null;
	const [year, record] = latest;
	return { year, both: record.both!, male: record.male!, female: record.female! };
}

function groupBySpatialDim(observations: Observation[]): Map<string, Observation[]> {
	const groups = new Map<string, Observation[]>();
	for (const observation of observations) {
		const group = groups.get(observation.SpatialDim) ?? [];
		group.push(observation);
		groups.set(observation.SpatialDim, group);
	}
	return groups;
}

async function main(): Promise<void> {
	const [observations, countryDimension] = await Promise.all([
		fetchValues<Observation>(INDICATOR),
		fetchValues<DimensionValue>("DIMENSION/COUNTRY/DimensionValues"),
	]);
	const countryNames = new Map(countryDimension.map((c) => [c.Code, c.Title]));

	const world = latestRecord(observations.filter((o) => o.SpatialDimType === "GLOBAL"));
	if (!world) throw new Error("No global life expectancy in WHO response");

	const countryObservations = groupBySpatialDim(observations.filter((o) => o.SpatialDimType === "COUNTRY"));
	const data: LifeExpectancyData = {
		world,
		countries: [...countryObservations.entries()]
			.flatMap(([iso3, group]) => {
				const record = latestRecord(group);
				if (!record) return [];
				return [{
					iso3,
					iso2: countries.alpha3ToAlpha2(iso3) ?? null,
					name: countryNames.get(iso3) ?? iso3,
					...record,
				}];
			})
			.sort((a, b) => a.iso3.localeCompare(b.iso3)),
	};

	await writeFile(OUTPUT, `${JSON.stringify(data, null, "\t")}\n`);
	console.log(`Wrote ${data.countries.length} countries, world ${world.both} (${world.year})`);
}

await main();
