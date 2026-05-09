# UX Principles

## Product UX Goals

- Plan in minutes
- Adjust in seconds
- Make distance, time, and cost obvious
- Give strong guidance without trapping the user
- Keep social features contextual, safe, and optional

## Core Interaction Principles

### Smart defaults, easy escape hatches

Loopin should make a strong first suggestion, but every major choice must be editable.

Examples:

- auto-generated day plans can be reordered or swapped
- nearby suggestions can be filtered or dismissed
- social visibility can be enabled or disabled per trip

### Show tradeoffs directly

Do not hide the reason behind a suggestion. If a place is recommended because it is:

- closer
- cheaper
- more local
- better for the weather

then say that directly in the UI.

### Reduce planning anxiety

Users should not need to decipher dense maps or read long explanatory paragraphs to understand their next action. Use cards, grouped sections, visible filters, and clear labels.

### Keep privacy explicit

Location sharing, city presence, place presence, and chat participation should all be opt-in and legible.

## Key Flows

### Trip creation wizard

Goals:

- gather enough signal for a useful first itinerary
- keep the flow short and confidence-building

Pattern:

1. destination and dates
2. party size and budget
3. interests and pace
4. hidden-gem preference and optional dietary or mobility needs
5. summary and generate

Rules:

- show progress
- explain why each step matters
- keep the default path short

### City overview

Goals:

- help users understand the city shape before they commit to places

Pattern:

- neighborhood cards with strengths
- category clusters such as landmarks, food, parks, hidden gems
- visible balance between popular spots and local alternatives

### Day-by-day plan

Goals:

- make route, timing, and spend understandable at a glance

Pattern:

- timeline plus map
- stop cards with time, duration, cost, and hiddenness
- inline controls for move, delete, and smart swap

### Near me now

Goals:

- support real-time decisions with minimal cognitive load

Pattern:

- map and ranked list
- quick actions for common states:
  - fill one hour
  - rainy day
  - late-night
- each suggestion should explain why it fits the moment

### Social lobby

Goals:

- make social coordination useful without feeling like a generic matching app

Pattern:

- focus on shared city context and planned activities
- show minimal profile details
- foreground visibility controls and reporting paths

## Safety And Consent

- Users are private by default
- Presence settings must be reversible
- Avoid showing exact live location unless a future explicit feature requires and justifies it
- Group and match chat should remain tied to trip or activity context
- Report, block, and leave actions should be easy to find when social features launch

## Error And Empty State Guidance

- Empty states should offer a next action, not just explain absence
- Recovery text should be short and actionable
- If AI-generated content is uncertain or delayed, say so plainly and offer fallback options

## UX Success Criteria

A strong Loopin experience should let a new user answer these questions quickly:

- Where am I going?
- What is my plan today?
- How far apart are these stops?
- How much will this roughly cost?
- What can I do if I need to change course?
- Am I sharing this with anyone, and if so, how?
