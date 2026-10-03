export type Plural = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

export const plural = (forms: Plural): Plural => forms;
