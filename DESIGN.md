# Design Philosophy

The NACOS 100 store is designed to look like a contemporary streetwear campaign rather than a generic SaaS dashboard. It utilizes a monochrome base with strategic NACOS green accents and relies on high-quality product photography to provide color.

## Typography
- **Headings / Display**: `Space Grotesk`
- **Body**: `Manrope`

## Colors
```css
--bg: #FFFFFF;
--bg-subtle: #F7F7F5;
--surface: #FFFFFF;
--text: #0A0A0A;
--text-muted: #626262;
--text-faint: #858585;
--border: #E4E4E4;
--border-strong: #111111;

--nacos-green: #1E8E2E;
--nacos-green-bright: #2EC95A;
--black: #000000;
--white: #FFFFFF;
```

## Iconography
- **Phosphor Icons**: Used for functional punctuation, not decoration.

## Spacing & Layout
- 4px grid spacing, generous gutters on mobile.
- 8-12px radii.
- Subtle shadows and high contrast.
- Large touch targets (min 44x44px).
- Mobile-first approach.

## Components & Interactions
- Primary CTAs are solid black with white text.
- Micro-interactions (button press scale, card image lift) bring life to the interface.
- 120ms - 320ms animation durations. Respects `prefers-reduced-motion`.
- Skeleton loaders for missing data; contextual empty states instead of generic messages.
