import { describe, expect, it } from "vitest";
import { parseBirthDate, parseLifeExpectancy, parseQuitAge } from "../src/settings";

const today = new Date("2026-10-02T12:00:00");

describe("parseBirthDate", () => {
    it("accepts past and current ISO dates", () => {
        expect(parseBirthDate("1990-03-15", today)).toEqual({ ok: true, value: "1990-03-15" });
        expect(parseBirthDate("2026-10-02", today)).toEqual({ ok: true, value: "2026-10-02" });
    });

    it("treats empty input as cleared", () => {
        expect(parseBirthDate(" ", today)).toEqual({ ok: true, value: null });
    });

    it("rejects future, malformed and impossible dates", () => {
        expect(parseBirthDate("2026-10-03", today)).toEqual({ ok: false });
        expect(parseBirthDate("15.03.1990", today)).toEqual({ ok: false });
        expect(parseBirthDate("1990-02-30", today)).toEqual({ ok: false });
    });
});

describe("parseLifeExpectancy", () => {
    it("accepts numbers with one decimal and either separator", () => {
        expect(parseLifeExpectancy("85")).toEqual({ ok: true, value: 85 });
        expect(parseLifeExpectancy("73,2")).toEqual({ ok: true, value: 73.2 });
        expect(parseLifeExpectancy("73.2")).toEqual({ ok: true, value: 73.2 });
    });

    it("treats empty input as no override", () => {
        expect(parseLifeExpectancy("")).toEqual({ ok: true, value: null });
    });

    it("rejects values outside 1–150 or with more precision", () => {
        expect(parseLifeExpectancy("0.5")).toEqual({ ok: false });
        expect(parseLifeExpectancy("151")).toEqual({ ok: false });
        expect(parseLifeExpectancy("73.25")).toEqual({ ok: false });
        expect(parseLifeExpectancy("abc")).toEqual({ ok: false });
    });
});

describe("parseQuitAge", () => {
    it("accepts whole ages from 10 up to the current age", () => {
        expect(parseQuitAge("10", 38)).toEqual({ ok: true, value: 10 });
        expect(parseQuitAge("38", 38)).toEqual({ ok: true, value: 38 });
        expect(parseQuitAge("90", null)).toEqual({ ok: true, value: 90 });
    });

    it("treats empty input as unknown", () => {
        expect(parseQuitAge("", 38)).toEqual({ ok: true, value: null });
    });

    it("rejects ages below 10, above the current age or fractional", () => {
        expect(parseQuitAge("9", 38)).toEqual({ ok: false });
        expect(parseQuitAge("39", 38)).toEqual({ ok: false });
        expect(parseQuitAge("30.5", 38)).toEqual({ ok: false });
    });
});
