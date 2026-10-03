# Pix Lifespan Calendar

[English](#english) · [Русский](#русский)

## English

A plugin for [Obsidian](https://obsidian.md) that draws your life as a grid: one cell is one day, week or month. Lived time is filled in, the current cell is highlighted, and the rest is what remains until your expected lifespan.

By default, life expectancy comes from World Health Organization (WHO) data for the selected country and sex. You can also set it manually.

### Features

- Three grid units: **days**, **weeks**, **months**. Switch between them right in the view.
- The grid follows calendar years: one row (or one block in day mode) is one year.
- Weeks follow ISO 8601 and start on Monday.
- Life expectancy from WHO data for 185 countries by sex, or your own value.
- Lifestyle adjustments: smoking, alcohol and physical activity.
- Tooltip on hover: the period and your age at that time.
- Stats: percentage of life lived and how many cells are ahead.
- Interface in English, Russian, German and French, following Obsidian's language setting.
- Works on desktop and mobile, with no horizontal scrolling.
- No network access: WHO data is bundled with the plugin.

### Usage

1. Open the calendar with the calendar icon in the ribbon or the **"Open lifespan calendar"** command.
2. On first launch, click **"Open settings"** and enter your birth date.
3. Optionally choose your country and sex and describe your habits: they affect life expectancy.

#### Settings

| Setting                                         | What it does                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Birth date**                                  | Required. The calendar is not drawn without it. Cannot be in the future.                                                                                           |
| **Country**                                     | Country used for the WHO value. If none is selected, the world average is used.                                                                                    |
| **Sex**                                         | "Male", "Female" or "Not specified". "Not specified" uses the value for both sexes.                                                                                |
| **Smoking**, **Alcohol**, **Physical activity** | Adjustments to the WHO value, see "Lifestyle adjustments". Default is "Not specified", meaning no adjustment.                                                      |
| **Life expectancy**                             | Your own value in years, from 1 to 150, with one decimal place. If empty, the WHO value is used and shown as a placeholder. The button on the right resets to WHO. |
| **Grid unit**                                   | Days, weeks or months. The same as the buttons in the view.                                                                                                        |

#### Reading the grid

| Color              | Meaning                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| Theme accent color | Lived                                                                  |
| Orange             | Current day, week or month                                             |
| Gray               | Ahead                                                                  |
| Green              | Lived beyond expected lifespan                                         |
| Faded              | Outside life: before birth or after the expected date in the last year |
| Empty outline      | 53rd week in a year that doesn't have one (see below)                  |

The expected end date is the birth date plus life expectancy in years multiplied by 365.2425 days. If that date has passed, the grid extends to the current year, and the stats show how many years you have lived beyond expectancy.

#### Why some years have 53 weeks

Weeks follow ISO 8601: a week belongs to the year that contains its Thursday. So most years have 52 weeks, and roughly every 5–6 years there are 53 (for example 2015, 2020, 2026, 2032). In 52-week years an empty outline is drawn in place of the 53rd week so the right edge stays even.

For the same reason, in day mode a few days at the start of January can land in the previous year's block, and a few at the end of December in the next year's: each day sits in the block of its ISO week's year.

ISO numbering was chosen because Obsidian's weekly notes use it (`2026-W40`), which will help link cells to notes later.

### Lifestyle adjustments

Adjustments in years are added to the WHO value. A manual life expectancy ignores them: when one is set, the "Lifestyle" section is marked "Not applied". The result is never less than 1 year. The breakdown is shown in the "Life expectancy" placeholder and when hovering over the stats in the view, for example `65.2 = WHO 66.3 − 4 smoking − 0.5 alcohol + 3.4 activity`.

> This is a rough guide, not a medical forecast. The numbers are population averages from studies, mostly of people over 40 in high-income countries. The factors are related (smokers drink more and move less on average), so simply adding the adjustments is a simplification.

#### Smoking

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

#### Alcohol

[Wood et al., Lancet 2018](<https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30134-X/fulltext>), 600,000 drinkers in 83 studies: life expectancy at age 40 compared with drinking less than 100 g of alcohol a week. One portion is 10 g of alcohol: 150 ml of wine, 330 ml of beer or 30 ml of spirits. The study included only current drinkers, so "Under 10" also covers non-drinkers.

| Portions a week | Grams of alcohol | Adjustment |
| --------------- | ---------------- | ---------- |
| Under 10        | up to 100        | 0          |
| 10–20           | 100–200          | −0.5       |
| 20–35           | 200–350          | −1.5       |
| Over 35         | over 350         | −4.5       |

#### Physical activity

[Moore et al., PLoS Medicine 2012](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001335), 650,000 people: gain in life expectancy after 40 compared with no leisure-time activity. Minutes of brisk walking or comparable moderate activity.

| Minutes a week | Adjustment |
| -------------- | ---------- |
| Almost none    | 0          |
| Up to 75       | +1.8       |
| 75–149         | +2.5       |
| 150–299        | +3.4       |
| 300–449        | +4.2       |
| 450 or more    | +4.5       |

### WHO data

The source is the Global Health Observatory indicator [`WHOSIS_000001`](https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-%28years%29), "Life expectancy at birth". For each country the latest year with values for men, women and both sexes is used. The current snapshot is 2023 data.

The snapshot lives in `src/data/life-expectancy.json`. To refresh it:

```bash
yarn fetch-who
```

---

## Русский

Плагин для [Obsidian](https://obsidian.md), который рисует жизнь в виде сетки: одна ячейка — один день, неделя или месяц. Прожитое закрашено, текущая ячейка подсвечена, впереди — то, что осталось до ожидаемой продолжительности жизни.

Ожидаемая продолжительность жизни по умолчанию берётся из данных Всемирной организации здравоохранения (ВОЗ) для выбранной страны и пола. Её можно задать вручную.

### Возможности

- Три единицы сетки: **дни**, **недели**, **месяцы**. Переключаются прямо во вкладке.
- Сетка привязана к календарным годам: одна строка (или один блок в режиме «дни») — один год.
- Недели по ISO 8601, начинаются с понедельника.
- Продолжительность жизни по данным ВОЗ для 185 стран с учётом пола, либо своё значение.
- Поправки на образ жизни: курение, алкоголь и физическая активность.
- Подсказка при наведении: период и возраст в этот момент.
- Статистика: сколько прожито в процентах и сколько ячеек впереди.
- Интерфейс на русском, английском, немецком и французском — язык берётся из настроек Obsidian.
- Работает на компьютере и в мобильном приложении, без горизонтальной прокрутки.
- Не обращается к сети: данные ВОЗ встроены в плагин.

### Как пользоваться

1. Откройте календарь иконкой календаря на боковой панели или командой **«Открыть календарь жизни»**.
2. При первом запуске нажмите **«Открыть настройки»** и укажите дату рождения.
3. При желании выберите страну и пол и укажите привычки — от них зависит ожидаемая продолжительность жизни.

#### Настройки

| Настройка                                            | Что делает                                                                                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Дата рождения**                                    | Обязательна. Без неё календарь не строится. Дата не может быть в будущем.                                                                                                                |
| **Страна**                                           | Страна, по которой берётся значение ВОЗ. Если не выбрана — используется среднее по миру.                                                                                                 |
| **Пол**                                              | «Мужской», «Женский» или «Не указан». Для «Не указан» берётся значение для обоих полов.                                                                                                  |
| **Курение**, **Алкоголь**, **Физическая активность** | Поправки к значению ВОЗ, см. «Поправки на образ жизни». По умолчанию «Не указано» — поправки нет.                                                                                        |
| **Продолжительность жизни**                          | Своё значение в годах, от 1 до 150, с одним знаком после запятой. Если поле пустое, используется значение ВОЗ — оно показано подсказкой в поле. Кнопка справа сбрасывает к значению ВОЗ. |
| **Единица сетки**                                    | Дни, недели или месяцы. То же самое переключается кнопками во вкладке.                                                                                                                   |

#### Как читать сетку

| Цвет              | Значение                                                         |
| ----------------- | ---------------------------------------------------------------- |
| Цвет акцента темы | Прожито                                                          |
| Оранжевый         | Текущий день, неделя или месяц                                   |
| Серый             | Впереди                                                          |
| Зелёный           | Прожито сверх ожидаемой продолжительности жизни                  |
| Бледный           | Вне жизни: до рождения или после ожидаемой даты в последнем году |
| Пустой контур     | 53-я неделя в году, где её нет (см. ниже)                        |

Ожидаемая дата окончания считается как дата рождения плюс продолжительность жизни в годах, умноженная на 365,2425 дня. Если эта дата уже прошла, сетка продлевается до текущего года, а в статистике показывается, на сколько лет прожито больше ожидаемого.

#### Почему в некоторых годах 53 недели

Недели считаются по ISO 8601: неделя относится к тому году, на который приходится её четверг. Поэтому в большинстве лет 52 недели, а примерно раз в 5–6 лет — 53 (например, 2015, 2020, 2026, 2032). В годах с 52 неделями на месте 53-й рисуется пустой контур, чтобы правый край сетки был ровным.

По той же причине в режиме «дни» несколько дней в начале января могут оказаться в блоке предыдущего года, а в конце декабря — в блоке следующего: каждый день лежит в блоке года своей ISO-недели.

ISO-нумерация выбрана потому, что её используют еженедельные заметки Obsidian (`2026-W40`), — это пригодится для будущей связи ячеек с заметками.

### Поправки на образ жизни

Поправки в годах прибавляются к значению ВОЗ. Ручная продолжительность жизни их не учитывает: если она задана, раздел «Образ жизни» помечается «Не учитывается». Итог не может быть меньше 1 года. Из чего сложилось значение, видно в подсказке поля «Продолжительность жизни» и при наведении на статистику во вкладке, например `65,2 = ВОЗ 66,3 − 4 курение − 0,5 алкоголь + 3,4 активность`.

> Это ориентир, а не медицинский прогноз. Цифры — средние по популяции из исследований, в основном для людей старше 40 лет в странах с высоким доходом. Факторы связаны между собой (курящие чаще пьют и меньше двигаются), поэтому простое сложение поправок — упрощение.

#### Курение

[Doll et al., BMJ 2004](https://www.bmj.com/content/328/7455/1519) — 50 лет наблюдения за британскими врачами: курящие всю жизнь умирают примерно на 10 лет раньше некурящих; отказ в 30, 40, 50 и 60 лет возвращает около 10, 9, 6 и 3 лет. [Jha et al., NEJM 2013](https://www.nejm.org/doi/full/10.1056/NEJMsa1211128) получили близкие цифры для США.

| Курение                    | Поправка |
| -------------------------- | -------- |
| Никогда                    | 0        |
| Курю сейчас                | −10      |
| Бросил(а) до 35 лет        | 0        |
| Бросил(а) в 35–44 года     | −1       |
| Бросил(а) в 45–54 года     | −4       |
| Бросил(а) в 55 лет и позже | −7       |

Пока возраст отказа не указан, поправка для «Бросил(а)» не применяется.

#### Алкоголь

[Wood et al., Lancet 2018](<https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30134-X/fulltext>) — 600 тысяч пьющих в 83 исследованиях: ожидаемая продолжительность жизни в 40 лет по сравнению с теми, кто пьёт меньше 100 г спирта в неделю. Порция — 10 г спирта: 150 мл вина, 330 мл пива или 30 мл крепкого. В исследование входили только пьющие, поэтому «Меньше 10» включает и непьющих.

| Порций в неделю | Граммов спирта | Поправка |
| --------------- | -------------- | -------- |
| Меньше 10       | до 100         | 0        |
| 10–20           | 100–200        | −0,5     |
| 20–35           | 200–350        | −1,5     |
| Больше 35       | больше 350     | −4,5     |

#### Физическая активность

[Moore et al., PLoS Medicine 2012](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001335) — 650 тысяч человек: прибавка к ожидаемой продолжительности жизни после 40 лет по сравнению с отсутствием активности в свободное время. Минуты — быстрая ходьба или сопоставимая умеренная нагрузка.

| Минут в неделю | Поправка |
| -------------- | -------- |
| Почти нет      | 0        |
| До 75          | +1,8     |
| 75–149         | +2,5     |
| 150–299        | +3,4     |
| 300–449        | +4,2     |
| 450 и больше   | +4,5     |

### Данные ВОЗ

Источник — показатель [`WHOSIS_000001`](https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-%28years%29) «Ожидаемая продолжительность жизни при рождении» из Global Health Observatory. Для каждой страны берётся последний год, за который есть значения для мужчин, женщин и обоих полов. Текущий снимок — данные за 2023 год.

Снимок хранится в `src/data/life-expectancy.json`. Чтобы обновить его:

```bash
yarn fetch-who
```
