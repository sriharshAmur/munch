# 0008: question cards and story rings instead of the plate

Supersedes the stage in 0007. The rest of 0007 (the findings, the order type, `--coverage`, `MUNCH_DEMO_ONLY`) still holds.

Sri tried the dot stage on real orders and asked for it to go: the plate was hard to read and had become the centre of the page. The parts that worked were the kitchen tickets and the year story. So the home page is now built from those, plus plain charts a person can read at a glance:

- **Story rings** at the top, like the stories row in a messaging app: the whole history first, then one per month with at least three orders, newest first. A ring is lit until you watch it; watched rings are remembered in this browser. The player is the year story from 0007, now telling a month as well as a year (`recap(history, period)`).
- **A headline and four facts**: orders since when, spend, restaurants, busiest month, last order.
- **Question cards**: each asks one question, answers it in large type, says the finding in a sentence, and shows the evidence as bars, a ranked list or a calendar. Every mark is a link into the orders, filtered. Every card can turn into its table.
- Then the tickets, the order type and the guess.

Thuisbezorgd keeps about a year of orders, so the page is designed for a year, not a decade. Weeks replace months in the timeline, one calendar replaces one per year, months replace years in the stories, and the demo person now has one year, two homes and about 90 orders. Long home names are cut with an ellipsis in legends and keep their full name on hover; with more than three homes the homes card spans the page.

The habit bars in the order type are now the share itself, with the mark at the line where a habit counts as strong. Before, the bar was the share divided by the line, so 57% could look full.

Restaurants get a monogram: initials on a tint of one of the six categorical slots, picked by a hash of the id. Cuisine tags proved too noisy to colour by (0007), and the initials make rows recognisable without logos.

The explorer gained search that needs every word and marks the matches, removable filter chips (including a week and a price range, so the weekly bars and the cost histogram can link somewhere exact), month breaks with totals, a "first time" tag, and an order sheet that steps to the previous and next order. Places are profiled in `core/analyze/place.ts`: a status (regular, gone quiet, old home, tried once, new, now and then), a twelve-month sparkline, the usual gap between orders, weekdays, and each dish with its price change.
