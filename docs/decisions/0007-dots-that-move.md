# 0007: one set of dots, moving between formations

Sri asked for a story that is fun to explore, with motion and sharper findings. The chapters of separate charts are replaced by one canvas of dots, one per order, that travels between formations as each chapter reaches the middle of the screen. Every chapter keeps a sentence with its finding, a table of its numbers and hover on every dot. The rules in DESIGN.md that forbade motion on scroll and any glow were rewritten to allow exactly this, and nothing else.

The stage is drawn on a canvas, not SVG: more than a thousand dots moving at once is too much for the DOM. Labels are drawn with the dots. Motion is Motion (motion.dev) for the year stories, springs and count-ups; the dots use their own loop.

The demo person was rewritten. The old one had the same favourite in every home, one dish per restaurant and orders only on the hour, so most findings were empty. The new one has distinct regulars per home, a favourite that survives a move, a Sunday lunch ritual, lockdown lunches, late-night snacks, a restaurant dropped without moving, rising prices and tipping that starts in 2020. Every restaurant, dish and street is still invented.

Findings worth a ticket live in `core/analyze/noticed.ts`. Each appears only past a threshold, chosen by judgement: a dish ordered at least four times across at least 300 days and at least 5% dearer; a place with four or more orders, silent for at least 90 days and six of its usual gaps, while you still live where you last ordered from it; a weekday-and-mealtime habit with five or more orders and at least 40% of that place's orders; payday at least 15% busier, from 60 orders up.

The order type compares each habit with a fixed bar, not with other people: half of orders at the top three places, 30% at a place never tried before, 10% after 22:00, 20% group orders, 62% from Friday to Sunday, 60% within 45 minutes of the usual time. The strongest habit relative to its bar names the type.

`munch check --coverage` prints counts of which fields are filled, never values. It showed that real cuisine lists can hold dozens of tags per order, so nothing new depends on cuisine. `MUNCH_DEMO_ONLY=1` makes the dev server refuse `/local/`, so screenshots and checks can only ever see the demo.
