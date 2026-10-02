import { describe, expect, it } from "vitest";
import { createTranslator, supportedLanguage } from "../src/i18n";

describe("supportedLanguage", () => {
	it("maps Obsidian language codes to supported languages", () => {
		expect(supportedLanguage("ru")).toBe("ru");
		expect(supportedLanguage("de")).toBe("de");
		expect(supportedLanguage("zh-TW")).toBe("en");
		expect(supportedLanguage("")).toBe("en");
	});
});

describe("translator", () => {
	it("interpolates parameters", () => {
		expect(createTranslator("en").t("age", { age: 34 })).toBe("Age 34");
	});

	it("selects Russian plural forms", () => {
		const { plural } = createTranslator("ru");
		expect(plural("remainingWeek", 1, { count: 1 })).toBe("Впереди ≈ 1 неделя");
		expect(plural("remainingWeek", 3, { count: 3 })).toBe("Впереди ≈ 3 недели");
		expect(plural("remainingWeek", 2480, { count: "2 480" })).toBe("Впереди ≈ 2 480 недель");
		expect(plural("surplus", 2.5, { years: "2,5" })).toBe("На 2,5 года больше ожидаемого");
	});

	it("selects English plural forms", () => {
		expect(createTranslator("en").plural("remainingDay", 1, { count: 1 })).toBe("≈ 1 day ahead");
	});
});
