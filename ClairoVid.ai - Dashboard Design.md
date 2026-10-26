# ClairoVid.ai — Dashboard design

Status: implementation handoff based on the approved Cinema direction. Stitch's existing project currently fails to load (“Sorry, we hit a snag”), and this session has no Stitch design-generation connector. This document is the Stitch-ready dashboard brief; it follows the approved Cinema brand board and application review notes already in this repository.

## Stitch prompt

Design the signed-in ClairoVid.ai personal dashboard, “My videos,” for one creator. Use the approved Cinema direction: near-black `#090909` canvas, `#151515` elevated surfaces, `#FAFAFA` primary text, `#A3A3A3` secondary text, `#303030` dividers, and one restrained warm orange `#E58C33` accent. Use Plus Jakarta Sans for headlines and Inter for interface text. The dashboard should feel like a calm, cinematic editorial workspace with useful negative space and clear next steps.

Show a compact left navigation with the ClairoVid wordmark, My videos, Settings, and the signed-in user's account plus a clearly labeled Sign out button. The wordmark is a home-to-dashboard link and must never be styled or wired as sign out. Main content has a welcoming heading, one “New explainer” primary action, and a My videos library with the approved status filters: All, Drafts, Ready, Scheduled, Published, Needs attention. Sort by recently updated. Do not add search, pagination counts, billing, team controls, fake statistics, or fabricated thumbnails. Project tiles must distinguish a real ready/published asset from a draft or schematic preview. The empty state should show how to start the first idea and one primary action.

On mobile, make the navigation compact but keep My videos, Settings, and Sign out reachable. Stack the page content, keep filter chips scrollable within their row, and preserve readable project cards without horizontal page overflow. Use at least 44px touch targets, visible keyboard focus, semantic headings, and reduced-motion-safe transitions. Keep the existing Idea → Storyboard → Video → Publish workflow and do not imply that rendering, Instagram, or publishing is available unless server state confirms it.

## Implementation rules

- Wordmark in signed-in chrome links to `/dashboard`; it is distinct from the Sign out action.
- Only My videos and Settings appear in navigation for V1.
- Keep status filters aligned with the API and omit project search.
- Use real project state and dates; do not invent progress, media assets, or social proof.
- Draft tiles identify themselves as idea drafts. Do not show a draft as an exported video.
- One primary action: New explainer. Empty state uses the same action.
- Desktop uses a stable sidebar and a wide, restrained content column. Mobile exposes navigation, actions, and filters without clipping.
- Focus rings, labels, count semantics, and keyboard access are part of the implementation, not decorative polish.
