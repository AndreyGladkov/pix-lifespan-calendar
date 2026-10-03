import { describe, expect, it } from "vitest";
import type { LifeExpectancyEstimate } from "../src/domain/lifeExpectancy";
import { createTranslator } from "../src/i18n";
import { estimateHint, estimatePlaceholder } from "../src/lifeExpectancyText";

const adjusted: LifeExpectancyEstimate = {
    years: 68.2,
    country: null,
    baseline: 74.8,
    adjustments: [
        { factor: "smoking", years: -10 },
        { factor: "activity", years: 3.4 },
    ],
};
const plain: LifeExpectancyEstimate = { years: 80.1, country: null, baseline: 80.1, adjustments: [] };

describe("estimatePlaceholder", () => {
    it("shows the WHO value and place without adjustments", () => {
        expect(estimatePlaceholder(createTranslator("de"), plain, "Welt")).toBe("80,1 (WHO, Welt)");
    });

    it("lists the baseline and signed adjustments in the user's language", () => {
        expect(estimatePlaceholder(createTranslator("ru"), adjusted, "мир")).toBe(
            "68,2 (ВОЗ, мир: 74,8 − 10 курение + 3,4 активность)",
        );
        expect(estimatePlaceholder(createTranslator("en"), adjusted, "world")).toBe(
            "68.2 (WHO, world: 74.8 − 10 smoking + 3.4 activity)",
        );
    });
});

describe("estimateHint", () => {
    const en = createTranslator("en");

    it("explains an adjusted estimate", () => {
        expect(estimateHint(en, { years: 68.2, estimate: adjusted, overridden: false })).toBe(
            "Expected: 68.2 = WHO 74.8 − 10 smoking + 3.4 activity",
        );
    });

    it("stays silent without adjustments or with a manual override", () => {
        expect(estimateHint(en, { years: 80.1, estimate: plain, overridden: false })).toBeUndefined();
        expect(estimateHint(en, { years: 85, estimate: adjusted, overridden: true })).toBeUndefined();
    });
});
