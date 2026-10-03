import { describe, expect, it } from "vitest";
import { lifestyleAdjustments, NO_LIFESTYLE, type Lifestyle } from "../src/domain/lifestyle";

const lifestyle = (overrides: Partial<Lifestyle>): Lifestyle => ({ ...NO_LIFESTYLE, ...overrides });
const smokingYears = (quitAge: number): number =>
    lifestyleAdjustments(lifestyle({ smoking: "former", smokingQuitAge: quitAge })).find((a) => a.factor === "smoking")
        ?.years ?? 0;

describe("lifestyleAdjustments", () => {
    it("adjusts nothing when habits are unspecified or neutral", () => {
        expect(lifestyleAdjustments(NO_LIFESTYLE)).toEqual([]);
        expect(lifestyleAdjustments(lifestyle({ smoking: "never", alcohol: "under10", activity: "none" }))).toEqual([]);
    });

    it("takes ten years from current smokers", () => {
        expect(lifestyleAdjustments(lifestyle({ smoking: "current" }))).toEqual([{ factor: "smoking", years: -10 }]);
    });

    it("scales the former smoker penalty by quit age", () => {
        expect(smokingYears(29)).toBe(0);
        expect(smokingYears(35)).toBe(-1);
        expect(smokingYears(44)).toBe(-1);
        expect(smokingYears(45)).toBe(-4);
        expect(smokingYears(55)).toBe(-7);
        expect(smokingYears(70)).toBe(-7);
    });

    it("ignores former smoking until the quit age is known", () => {
        expect(lifestyleAdjustments(lifestyle({ smoking: "former", smokingQuitAge: null }))).toEqual([]);
    });

    it("applies alcohol and activity levels", () => {
        expect(lifestyleAdjustments(lifestyle({ alcohol: "over35", activity: "450plus" }))).toEqual([
            { factor: "alcohol", years: -4.5 },
            { factor: "activity", years: 4.5 },
        ]);
    });
});
