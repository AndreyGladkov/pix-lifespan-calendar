# Pix Lifespan Calendar

[Русская версия](README.ru.md)

A plugin for [Obsidian](https://obsidian.md) that draws your life as a grid: one cell is one day, week or month. Lived time is filled in, the current cell is highlighted, and the rest is what remains until your expected lifespan.

By default, life expectancy comes from World Health Organization (WHO) data for the selected country and sex. You can also set it manually.

## Features

- Three grid units: **days**, **weeks**, **months**. Switch between them right in the view.
- The grid follows calendar years: one row (or one block in day mode) is one year.
- Weeks follow ISO 8601 and start on Monday.
- Life expectancy from WHO data for 185 countries by sex, or your own value.
- Lifestyle adjustments: smoking, alcohol and physical activity.
- Tooltip on hover: the period and your age at that time.
- Notes on dates: click a cell to see the notes linked to it, open them or create a new one.
- Stats: percentage of life lived and how many cells are ahead, plus a "Details" panel with the life expectancy breakdown and a color legend.
- Interface in English, Russian, German and French, following Obsidian's language setting.
- Works on desktop and mobile, with no horizontal scrolling.
- No network access: WHO data is bundled with the plugin.

## Usage

1. Open the calendar with the calendar icon in the ribbon or the **"Open lifespan calendar"** command.
2. On first launch, click **"Open settings"** and enter your birth date.
3. Optionally choose your country and sex and describe your habits: they affect life expectancy.

### Settings

| Setting                                         | What it does                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Birth date**                                  | Required. The calendar is not drawn without it. Cannot be in the future.                                                                                           |
| **Country**                                     | Country used for the WHO value. If none is selected, the world average is used.                                                                                    |
| **Sex**                                         | "Male", "Female" or "Not specified". "Not specified" uses the value for both sexes.                                                                                |
| **Smoking**, **Alcohol**, **Physical activity** | Adjustments to the WHO value, see "Lifestyle adjustments". Default is "Not specified", meaning no adjustment.                                                      |
| **Life expectancy**                             | Your own value in years, from 1 to 150, with one decimal place. If empty, the WHO value is used and shown as a placeholder. The button on the right resets to WHO. |
| **Grid unit**                                   | Days, weeks or months. The same as the buttons in the view.                                                                                                        |
| **Folder for new notes**                        | Where notes created from the calendar go. Empty means the vault root.                                                                                              |

### Reading the grid

| Color              | Meaning                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| Theme accent color | Lived                                                                  |
| Orange             | Current day, week or month                                             |
| Gray               | Ahead                                                                  |
| Green              | Lived beyond expected lifespan                                         |
| Cyan               | Ahead, added by lifestyle (see "Lifestyle adjustments")                |
| Faded red          | Taken by lifestyle: years the WHO value gives but your habits don't    |
| Faded              | Outside life: before birth or after the expected date in the last year |
| Empty outline      | 53rd week in a year that doesn't have one (see below)                  |
| Dot                | The cell has notes (see "Notes on dates")                              |

The expected end date is the birth date plus life expectancy in years multiplied by 365.2425 days. If that date has passed, the grid extends to the current year, and the stats show how many years you have lived beyond expectancy.

### Why some years have 53 weeks

Weeks follow ISO 8601: a week belongs to the year that contains its Thursday. So most years have 52 weeks, and roughly every 5–6 years there are 53 (for example 2015, 2020, 2026, 2032). In 52-week years an empty outline is drawn in place of the 53rd week so the right edge stays even.

For the same reason, in day mode a few days at the start of January can land in the previous year's block, and a few at the end of December in the next year's: each day sits in the block of its ISO week's year.

ISO numbering was chosen because Obsidian's weekly notes use it (`2026-W40`), so weekly notes land in the right cell (see "Notes on dates").

## Notes on dates

Click a cell to open a menu with the period, your age, the notes linked to that cell and **"New note for this date"**. Clicking a note opens it; Ctrl/Cmd-click opens it in a new tab.

A note is linked to a date in one of two ways:

- The `lifespan-date` property, for example `lifespan-date: 2030-05-01`. It also accepts a week (`2030-W18`) or a month (`2030-05`).
- The note's name, if it is exactly a date, an ISO week or a month: `2026-10-10`, `2026-W40`, `2026-10`. This picks up daily, weekly and monthly notes. If both are present, the property wins.

The link lives in the note itself, so you can move or rename the note anywhere in the vault and it stays on its date. The "Folder for new notes" setting only decides where "New note for this date" creates it; such a note gets `lifespan-date` set to the first day of the cell.

A note shows up in grids whose unit is the same as or coarser than its own: a day note is visible in days, weeks and months, a week note in weeks and months (in the month of its Monday), a month note only in months.

## Lifestyle adjustments

Adjustments in years are added to the WHO value. A manual life expectancy ignores them: when one is set, the "Lifestyle" section is marked "Not applied". The result is never less than 1 year. The breakdown is shown in the "Life expectancy" placeholder, for example `65.2 (WHO, Russia: 66.3 − 4 smoking − 0.5 alcohol + 3.4 activity)`, and in the "Details" panel of the view, where each adjustment is also given in cells of the current grid unit (for example `≈ −522 weeks`).

On the grid, losses are applied first and gains after them. With WHO 74.8, smoking −10 and activity +3.4, cells from 64.8 to 68.2 years are marked as added by lifestyle and cells from 68.2 to 74.8 as taken by lifestyle. Lived cells are never recolored.

> This is a rough guide, not a medical forecast. The numbers are population averages from studies, mostly of people over 40 in high-income countries. The factors are related (smokers drink more and move less on average), so simply adding the adjustments is a simplification.

### Smoking

[Doll et al., BMJ 2004](https://www.bmj.com/content/328/7455/1519), 50 years of follow-up of British doctors: lifelong smokers die about 10 years earlier than non-smokers; quitting at 30, 40, 50 or 60 regains about 10, 9, 6 or 3 years. [Jha et al., NEJM 2013](https://www.nejm.org/doi/full/10.1056/NEJMsa1211128) found similar numbers for the US.

| Smoking             | Adjustment |
| ------------------- | ---------- |
| Never smoked        | 0          |
| Smoke               | −10        |
| Quit before 35      | 0          |
| Quit at 35–44       | −1         |
| Quit at 45–54       | −4         |
| Quit at 55 or later | −7         |

Until the quit age is entered, no adjustment is applied for "Quit".

### Alcohol

[Wood et al., Lancet 2018](<https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30134-X/fulltext>), 600,000 drinkers in 83 studies: life expectancy at age 40 compared with drinking less than 100 g of alcohol a week. One portion is 10 g of alcohol: 150 ml of wine, 330 ml of beer or 30 ml of spirits. The study included only current drinkers, so "Under 10" also covers non-drinkers.

| Portions a week | Grams of alcohol | Adjustment |
| --------------- | ---------------- | ---------- |
| Under 10        | up to 100        | 0          |
| 10–20           | 100–200          | −0.5       |
| 20–35           | 200–350          | −1.5       |
| Over 35         | over 350         | −4.5       |

### Physical activity

[Moore et al., PLoS Medicine 2012](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001335), 650,000 people: gain in life expectancy after 40 compared with no leisure-time activity. Minutes of brisk walking or comparable moderate activity.

| Minutes a week | Adjustment |
| -------------- | ---------- |
| Almost none    | 0          |
| Up to 75       | +1.8       |
| 75–149         | +2.5       |
| 150–299        | +3.4       |
| 300–449        | +4.2       |
| 450 or more    | +4.5       |

## WHO data

The source is the Global Health Observatory indicator [`WHOSIS_000001`](https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-%28years%29), "Life expectancy at birth". For each country the latest year with values for men, women and both sexes is used. The current snapshot is 2023 data.

The snapshot lives in `src/data/life-expectancy.json`. To refresh it:

```bash
yarn fetch-who
```
