# Agent skills

Only the skills this work needs, each with the reason it is here. Every copied skill keeps its licence file next to it, and none has been changed. When a skill disagrees with `AGENTS.md` or `DESIGN.md`, those win.

| Skill | Source | Licence | Why |
| --- | --- | --- | --- |
| `frontend-design` | anthropics/skills | Apache-2.0 | Craft and restraint when building screens. DESIGN.md already fixes the palette and type, so use it for composition, copy and self-critique, not to pick a new look. |
| `shadcn` | shadcn-ui/ui | MIT | Correct use of shadcn components and the CLI. DESIGN.md's component rules override its defaults. |
| `web-interface-guidelines` | vercel-labs/web-interface-guidelines | MIT | A review checklist for accessibility, focus, forms and motion, run after the DESIGN.md checks. |
| `emil-design-eng` | emilkowalski/skill | MIT | The small details (borders, press states, easing) that make an interface feel finished. |
| `animate` | emilkowalski/skill | MIT | For the few animations Munch has (the plate's first fill, sheets, filter swaps): whether to animate at all, then the curve and duration. |
| `unslop` | pstack | MIT | Plain English for the story's ledes, the README and interface copy. |
| `typescript-best-practices` | pstack | MIT | Applies to every .ts and .tsx file: discriminated unions, no casts, parse at the boundary. |
| `principle-type-system-discipline` | pstack | MIT | Referenced by the TypeScript skill. |
| `principle-boundary-discipline` | pstack | MIT | Validate site responses and `orders.json` at the edge; trust types in `core/`. |
| `principle-test-behavior-not-implementation` | pstack | MIT | Analysis is proven by behaviour tests on demo orders. |
| `principle-prove-it-works` | pstack | MIT | Run the CLI and open the page before saying something is done. |

Charts also follow the dataviz skill that ships with Claude Code (form, colour by job, validated palettes, marks, hover and a table view). Its rules are written into DESIGN.md's Charts section, and its palette validator was used for the chart colours in `design/tokens.json`.
