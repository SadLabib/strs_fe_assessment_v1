# Design notes

How the training workflow is organised, and why. The setup, architecture and testing details are in the [README](../../README.md).

## The idea the interface is built around

Underwriting a short-term rental comes down to three questions, in order:

1. **What does it cost up front?** Down payment, closing costs and setup spend: the total out of pocket.
2. **What does it earn each year?** Revenue minus operating costs and the mortgage: the free cash flow.
3. **How good is that return?** Free cash flow over the cash put in: Cash-on-Cash.

A trainee is graded on one input, the **Mid revenue forecast**. Everything else is there to make that forecast and see its consequences. So the screens keep two things visible at all times: where you are in that cost → earnings → return chain, and which number is being graded.

## The workflow

| Step | Screen                | What it's for                                                           |
| ---- | --------------------- | ----------------------------------------------------------------------- |
| 1    | Dashboard             | Progress at a glance and the obvious next case                          |
| 2    | Property brief        | The facts and the market before any numbers, plus how the grading works |
| 3–5  | Workspace             | Financials, Analysis and Deal tags, with a live summary beside them     |
| 6    | Review (in workspace) | What's missing, what the server calculated, and submit                  |
| 7    | Results               | The score, why, how it ranks, and what to do next                       |

### Dashboard

Four numbers across the top (completed, average score, in progress, not started), then one card per property. Each card has **one primary action** that depends on its state: Start, Resume draft or View results. "Try again" appears as a quieter secondary link on finished cases. The amber button in the page header always points at the most useful next step: resume an open draft first, otherwise the next case not started. Status is shown with an icon and a word, never colour alone.

### Property brief

The brief comes before the form on purpose: a trainee should look at the property (price, beds, area, listing link) and read the market description before forecasting its revenue. A "How this works" box explains the three steps above and says plainly that the score depends on the Mid forecast. Earlier attempts on the property are listed with their scores.

### Workspace

**Tabs follow the brief's own structure:** Financials (purchase & financing, the optimization list, operating expenses, taxes), Analysis (revenue scenarios and returns), Deal tags, Review. A trainee who has read the brief finds each input where they expect it, and each tab is short enough to finish without scrolling past unrelated fields. The Financials and Analysis tabs carry a status icon (a tick when complete, a dashed circle while incomplete, an alert when something is wrong), so progress is visible without opening each tab.

**The summary rail** sits beside the tabs (below them on narrow screens) and shows the three steps with live numbers: total out of pocket; NOI and free cash flow for Low, Mid and High; Cash-on-Cash for each scenario with Mid highlighted, plus tax savings and PRR. It updates on every keystroke, so changing the down payment or adding a hot tub shows its effect on the return immediately, whichever tab you're on. Until a step has enough inputs, it says what's missing instead of showing zeros.

Other choices in the workspace:

- **The graded field is marked.** Mid revenue carries a "Graded" badge and its hint says the score depends on it.
- **Defaults where the brief gives them.** Taxes start at the training values (20%, 25%, 60%, 37%) with a "Reset to training defaults" button; the purchase price starts at the list price; the co-hosting fee starts at 0.
- **Quick-add chips** for common line items (Furniture, Hot tub, Utilities, Insurance, …) add a row and put the cursor in its amount.
- **Every calculated number can explain itself.** An ⓘ next to NOI, free cash flow, Cash-on-Cash, tax savings and PRR opens the formula with the trainee's own numbers filled in, e.g. "Mid: $102,800 − $42,111 = $60,689".
- **The property stays one click away.** A collapsible "Property & market" panel at the top of the workspace repeats the key facts without leaving the form.

### Saving

Work is saved automatically about a second after the trainee stops typing, and a status next to the tabs says "Unsaved changes", "Saving…", "Saved 3:42 PM" or, on failure, what went wrong with a Retry button. There's also a "Save draft" button for people who like pressing it. Leaving the page with unsaved changes asks first.

The API only accepts complete sections, so each section is sent once it's valid. A half-filled section is simply held back until it's ready instead of causing a failed save.

### Review and submit

The Review tab is the last stop before something irreversible, so it answers three questions:

- **Can I submit?** A checklist per section. Each problem is a link that opens the right tab and puts the cursor in the field. Missing values are shown in normal text and wrong values in red, because an empty field isn't a mistake yet.
- **What did the server calculate?** Opening Review saves the draft, then shows the API's own numbers, labelled as such, with the inputs behind them.
- **What am I being graded on?** "You're graded on your Mid revenue forecast: $98,000", with the score bands in one sentence.

**Blocking vs warning.** Anything the API would reject, or that makes the numbers meaningless, blocks submission: a required field left empty, a percentage outside 0–100, a loan term that isn't whole years, Low > Mid or Mid > High, a line item with only a name or only an amount, and a total out of pocket of $0 (Cash-on-Cash can't be calculated). Things that are unusual but legitimate only warn: no operating expenses, no setup costs. Submit stays disabled until nothing blocks, and asks for confirmation because an attempt can't be changed afterwards. The confirmation opens with "Keep editing" focused.

### Results

The PDF asks to explain the score, not just display it, so the results page is built around one sentence:

> Your Mid forecast of $130,000 was 4.0% above the analyst's $125,000, inside the ±10% band for Best.

Around it:

- **The score** (100, 70 or 40) in a coloured ring, with the rating as a word and an icon.
- **A deviation scale**: a strip coloured Low | Medium | Best | Medium | Low with the analyst's number in the middle and the trainee's marker where it landed. It shows how far off the forecast was, not only which band it fell in.
- **The target ranges**: "Best (100) needed $112,500 – $137,500". The analyst's number is only revealed after submitting, so this is where the trainee learns what a good forecast would have been.
- **A leaderboard** of attempts on this property, ranked by distance from the analyst (scores only take three values, so ranking by score would be mostly ties). The current attempt is highlighted, and a note explains that it ranks attempts because the API doesn't have trainees yet.
- **What next?** One amber action: after a Best it's the next property, otherwise "Try again". Back to dashboard is always there.

## Numbers

Most of what a trainee reads is numbers, so they follow strict rules:

- **Whole dollars** in outputs ($675,000), **one decimal** for percentages (7.9%), and units always shown.
- **Negative values** use a real minus sign (−$4,210), and negative results (NOI, free cash flow, Cash-on-Cash) are red.
- **Tabular figures** everywhere numbers line up (tables, the rail, the KPI strip), right-aligned in tables.
- **Percentages are typed as whole numbers** (20 for 20%), as the brief writes them, and converted to the API's fractions in one place.
- **The live preview and the server always agree.** The preview rounds exactly like the API (money to cents, percentages to 4 places), so the rail never shows 18.1% next to the server's 18.2%.

## Visual design

- **STR Search's brand colours**: deep green (`#0A4B39`) for the header, primary buttons and the highlighted Mid scenario; amber (`#E9A753`) for **one call to action per screen**, with bold white text, matching the buttons on strsearch.com. White on this amber measures 2.1:1, below the 4.5:1 that WCAG AA asks for; I chose brand consistency for this one element and made the text bold to compensate. Charcoal text would pass at 7.9:1 if accessibility has to win. Score colours are green, orange and red, always paired with a word and an icon.
- **Type**: Montserrat for headings and big numbers, Inter for everything else. Inter has true tabular figures, which matters for columns of money.
- **Density**: compact components (shadcn/ui on Radix) because this is a working tool, with cards to group each section and generous spacing between groups.
- **Accessibility**: every input has a visible label and linked error text; the review checklist moves focus straight to the field; the save status is announced to screen readers; tabs, dialogs and popovers work from the keyboard; text meets WCAG AA contrast (checked with axe), apart from the white text on the amber buttons described above; layouts work down to phone width without sideways scrolling.
