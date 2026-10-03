export type Smoking = "unspecified" | "never" | "current" | "former";
export type Alcohol = "unspecified" | "under10" | "10to20" | "20to35" | "over35";
export type Activity = "unspecified" | "none" | "upTo75" | "75to149" | "150to299" | "300to449" | "450plus";

export interface Lifestyle {
    smoking: Smoking;
    smokingQuitAge: number | null;
    alcohol: Alcohol;
    activity: Activity;
}

export type LifestyleFactor = "smoking" | "alcohol" | "activity";

export interface LifestyleAdjustment {
    factor: LifestyleFactor;
    years: number;
}

// Doll et al., BMJ 2004;328:1519: continuing smokers die about 10 years earlier than
// lifelong non-smokers; stopping at 30, 40, 50 or 60 regains about 10, 9, 6 or 3 years.
const CURRENT_SMOKER_YEARS = -10;
const FORMER_SMOKER_YEARS_BY_QUIT_AGE: { belowAge: number; years: number }[] = [
    { belowAge: 35, years: 0 },
    { belowAge: 45, years: -1 },
    { belowAge: 55, years: -4 },
];
const LATE_QUITTER_YEARS = -7;

// Wood et al., Lancet 2018;391:1513: life expectancy at 40 versus under 100 g of alcohol
// a week (≈6 months, 1–2 and 4–5 years lower). One portion is 10 g of pure alcohol.
const ALCOHOL_YEARS: Record<Alcohol, number> = {
    unspecified: 0,
    under10: 0,
    "10to20": -0.5,
    "20to35": -1.5,
    over35: -4.5,
};

// Moore et al., PLoS Med 2012;9:e1001335: years gained after 40 versus no leisure-time
// activity, by minutes of brisk walking a week (0.1–3.74 … 22.5+ MET-h/wk).
const ACTIVITY_YEARS: Record<Activity, number> = {
    unspecified: 0,
    none: 0,
    upTo75: 1.8,
    "75to149": 2.5,
    "150to299": 3.4,
    "300to449": 4.2,
    "450plus": 4.5,
};

export const NO_LIFESTYLE: Lifestyle = {
    smoking: "unspecified",
    smokingQuitAge: null,
    alcohol: "unspecified",
    activity: "unspecified",
};

function smokingYears({ smoking, smokingQuitAge }: Lifestyle): number {
    if (smoking === "current") return CURRENT_SMOKER_YEARS;
    if (smoking !== "former" || smokingQuitAge === null) return 0;
    return FORMER_SMOKER_YEARS_BY_QUIT_AGE.find((band) => smokingQuitAge < band.belowAge)?.years ?? LATE_QUITTER_YEARS;
}

export function lifestyleAdjustments(lifestyle: Lifestyle): LifestyleAdjustment[] {
    const adjustments: LifestyleAdjustment[] = [
        { factor: "smoking", years: smokingYears(lifestyle) },
        { factor: "alcohol", years: ALCOHOL_YEARS[lifestyle.alcohol] },
        { factor: "activity", years: ACTIVITY_YEARS[lifestyle.activity] },
    ];
    return adjustments.filter((adjustment) => adjustment.years !== 0);
}
