# Design System

## Design Direction

Loopin should feel modern, urban, and confident without becoming noisy. The visual language should balance planning clarity with a sense of local discovery.

Recommended aesthetic:

- expressive but readable typography
- warm map-adjacent colors rather than cold dashboard colors
- strong card and panel hierarchy
- clear distance, cost, and timing metadata
- lightweight motion that reinforces flow, not decoration

## Typography

Recommended families:

- Heading: `Space Grotesk`
- Body and UI: `Manrope`
- Monospace and diagnostic text: `IBM Plex Mono`

Scale:

- `display`: 48/56, reserved for hero or key trip headers
- `h1`: 36/44
- `h2`: 28/36
- `h3`: 22/30
- `title`: 18/26
- `body`: 16/24
- `body-sm`: 14/20
- `caption`: 12/16

Rules:

- Use a strong heading contrast between marketing and app surfaces
- Keep dense travel metadata in `body-sm` or `caption`
- Avoid long blocks of explanatory prose in the main app UI

## Spacing And Shape

Spacing scale:

- `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`

Border radius:

- `sm`: 10
- `md`: 16
- `lg`: 24
- `pill`: 999

Elevation:

- keep shadows soft and low-contrast
- prefer layered surfaces and borders over heavy shadow stacks

## Color Palette

### Core colors

- `ink-950`: deep text and primary chrome
- `sand-50`: default background
- `sea-500`: primary action and route emphasis
- `sea-700`: hover and selected state
- `coral-500`: accent for food, activity energy, and warnings
- `moss-500`: hidden gem and local discovery accent
- `sun-400`: budget and timing highlights

### Semantic roles

- primary action: `sea`
- success: `moss`
- warning: `sun`
- error: muted red, not neon
- info and map overlays: `sea` and `ink`

### Light/Dark guidance

- Light mode is the default reference mode
- Dark mode should keep route and map information legible, not just inverted
- Preserve strong contrast for cost, time, and availability metadata

## Core Components

Build and reuse these primitives:

- `Button`
- `TextField`
- `Textarea`
- `Select`
- `SegmentedControl`
- `Card`
- `Badge`
- `Chip`
- `ListRow`
- `EmptyState`
- `Toast`
- `Modal` or `Sheet`
- `Tabs`
- `MapPanel`
- `TimelineStop`
- `PricePill`
- `HiddennessBadge`

Rules:

- Component APIs should prefer clear semantic props over styling flags
- State variants should include hover, pressed, disabled, loading, and error where relevant
- Do not let trip-planning screens invent one-off tags for distance, price, or hiddenness

## Layout Patterns

### Web

- Marketing:
  - bold hero
  - short feature sections
  - neighborhood or itinerary story examples
- App shell:
  - stable nav
  - primary content column
  - secondary side panel for map, details, or collaboration
- Avoid screen designs that require horizontal scanning across too many unrelated panels

### Mobile

- Bottom tabs: Trips, Explore, Now, Social, Profile
- Primary actions should sit within thumb reach
- Prefer clear single-purpose screens over deeply nested stacks
- Use sheets for quick actions such as swap, filters, and join intent

## Map And Timeline Rules

- Always pair map context with list or timeline context
- Show distance, travel time, and open status near the place name
- Use badges for hiddenness and cost instead of burying them in prose
- Smart swap suggestions should explain the tradeoff in one line, such as:
  - closer and cheaper
  - more local but slightly farther

## Responsive Guidance

- Mobile-first content hierarchy
- Web breakpoints should expand the map or side context before expanding decorative padding
- Keep primary trip actions visible without requiring long scrolls
- On smaller screens, prioritize: current day plan, next action, nearby options

## Accessibility Rules

- Meet contrast requirements in both modes
- Keyboard support is required on web
- Touch targets on mobile should be comfortably tappable
- Error states should explain what happened and what the user can do next
- Do not use color alone to convey hiddenness, cost, or visibility state

## Design System Governance

- Add new tokens sparingly and document them
- If a component is reused across more than one core flow, it belongs in the shared system
- When the design system changes, update this file and the implementation status ledger
