# ClairoVid.ai — Public Homepage Design System

## 1. Scope and atmosphere

Design the signed-out public marketing homepage only. This page introduces ClairoVid.ai to individual creators and invites them to create an educational explainer video. It is not the authenticated dashboard, editor, pricing page, or a multi-screen application flow.

Visual reference: the supplied HTML proposes a dark, cinematic studio interface with a warm orange accent, compact glass-like navigation, and a vertical motion-graphics preview. Retain that visual direction while removing unsupported claims and production formats. Atmosphere: confident, editorial, and creator-focused. Density 4/10, layout variance 6/10, motion 4/10.

Brand name: ClairoVid.ai  
Brand tagline: “Complex ideas, clearly in motion.”

## 2. Color palette and roles

Use a single, muted burnt-orange accent. All other colors are charcoal neutrals and functional status colors.

- **Night Canvas** (`#090A0D`) — page background; deep charcoal, never pure black.
- **Studio Surface** (`#101217`) — preview frame and main content surface.
- **Raised Graphite** (`#1D2129`) — cards, navigation hover, and inset surfaces.
- **Soft White** (`#F5F5F3`) — primary text.
- **Signal Gray** (`#A1A5AD`) — supporting copy and metadata.
- **Motion Ember** (`#DF6844`) — the single brand accent for primary actions, selected indicators, and diagrams; use solid fills without glow.
- **Quiet Divider** (`rgba(255,255,255,0.09)`) — separators and subtle borders.
- **Success Green** (`#287A54`), **Caution Ochre** (`#8A5A16`), **Error Brick** (`#B8483D`) — functional feedback only.

Never use pure black, neon accents, purple/blue AI gradients, or multiple competing brand accents. Preserve readable contrast for all text and controls. Avoid large blurry glows and animated ambient orbs.

## 3. Typography

- Use **Plus Jakarta Sans** for display headings and **DM Sans** for body copy, navigation, and controls. Use system sans-serif fallbacks.
- Hero headline: 52–72 px desktop, 42–56 px mobile, 600–800 weight, tight but readable line height.
- Section headings: 28–36 px desktop, 24–30 px mobile, semibold.
- Body: 15–17 px with relaxed line-height; keep paragraphs near 60–65 characters per line.
- Navigation and controls: 14–16 px, medium weight; touch targets at least 44 px high.
- Establish hierarchy through scale, weight, and whitespace. Avoid oversized all-caps text and decorative font mixing.

## 4. Layout and components

- Use a maximum content width near 1,280 px with generous side margins.
- Build the hero as a left-aligned asymmetric split: headline and copy on the left, a framed vertical sample video on the right. Keep each element in its own clear spatial zone; never overlap text and imagery.
- Use an 8 px spacing rhythm, 10–16 px control radii, and restrained borders. Use elevation only to distinguish the sample-video frame from the page canvas.
- Header: left-aligned ClairoVid.ai wordmark with a simple motion-line mark; concise anchor links for workflow, storyboard, and output; a prototype link and one primary “Try the prototype” action.
- Hero: use the brand tagline as the headline, a direct factual benefit statement, one primary prototype action, and a compact note identifying the sample as an explainer.
- Sample video: use a clear 9:16 frame showing a river-flow educational diagram with a readable timed caption. Create the graphic with native SVG/CSS; do not depend on a remote stock image.
- How-it-works section: show **Idea → Storyboard → Video → Publish** as a numbered horizontal path on desktop and two-by-two or vertical path on small screens. Use a connected editorial timeline rather than four equal marketing cards.
- Supporting sections: alternate text and product-preview surfaces asymmetrically to explain storyboard review, narration/captions, and vertical MP4/Instagram delivery. Do not invent user statistics, customer logos, testimonials, or performance claims.
- Closing section: one clear prototype action, then a quiet footer that identifies the page as a product preview and does not imply account registration or publishing is already enabled.

## 5. Responsive behavior

- Desktop: asymmetric two-column hero with the video preview visible without crowding the copy; sticky translucent navigation with restrained blur.
- Below 768 px: stack the hero with text first and the sample preview directly beneath it; collapse navigation to a simple menu; keep the primary action visible and easy to tap.
- Prevent horizontal scrolling. Scale headings with `clamp()`. Respect reduced-motion settings.
- Maintain at least 44 px touch targets and visible keyboard focus.

## 6. Motion and interaction

- Use subtle opacity and transform transitions for menu opening, video controls, and section entrances. Keep motion brief and purposeful; do not run perpetual shimmer, pulse, or float animations. Respect reduced-motion preferences.
- Buttons provide a restrained pressed state and clear hover/focus state. Never use outer glow effects.
- Use a poster frame before playback. Provide visible playback state and accessible control labels.

## 7. Anti-patterns

- Do not generate a signed-in dashboard or application sidebar.
- Do not add pricing, billing, subscriptions, credit balances, analytics, team workspaces, brand-kit customization, or an in-app editor to this page.
- Do not use a centered generic hero, three equal feature cards, fake metrics, fabricated testimonials, generic AI copy, emojis, stock-photo collages, neon gradients, pure black, or overlapping elements.
- Do not claim 4K/60 fps, 12-second generation, 99.4% accuracy, free renders, ProRes, 16:9, web embeds, WebAssembly, or other capabilities not defined in the V1 PRD.
- Do not use filler prompts such as “Scroll to explore.”

## 8. Stitch generation prompt

Create one responsive, signed-out public marketing homepage for ClairoVid.ai using this design system. ClairoVid.ai helps individual creators turn teaching ideas and notes into short educational explainer videos. Use the tagline “Complex ideas, clearly in motion.” Follow the supplied dark studio HTML as visual inspiration: charcoal surfaces, a warm burnt-orange action color, compact navigation, and a cinematic vertical sample preview.

Build only the public homepage. Use a confident editorial studio look, deep charcoal canvas, soft white text, one muted burnt-orange accent, Plus Jakarta Sans display headings, and DM Sans body text. Make the left-aligned hero an asymmetric split: concise headline and factual copy on the left, a framed vertical sample explainer on the right. The sample should show a simple river-flow diagram with a readable caption, built from SVG/CSS. Include one clear “Try the prototype” call to action and a concise header with the ClairoVid.ai wordmark and anchor links to workflow, storyboard, and video output.

Continue below with the four-step path Idea → Storyboard → Video → Publish, then alternating product-preview sections showing combined script/storyboard review, narration with captions, and vertical 1080p MP4/Instagram delivery. Finish with one more prototype action and a footer that labels this as a product preview. Use realistic, factual product copy only; do not invent metrics, testimonials, free tiers, technical capabilities, or availability claims. Do not create a dashboard, pricing page, application editor, sign-in screen, or other screens. Show a thoughtful mobile adaptation of this same public homepage, with no horizontal overflow and touch-friendly controls.
