# LIBrepair Design System

## Brand
- **Name:** LIBrepair
- **Tagline:** Premium Automotive Repair & Maintenance

## Colors
```
--color-bg:        #0a0a0a   (primary dark background)
--color-surface:   #141414   (card/panel surfaces)
--color-surface2:  #1e1e1e   (elevated surfaces)
--color-red:       #e02020   (primary accent, CTAs)
--color-red-dark:  #b01818   (hover state)
--color-silver:    #c0c0c0   (secondary text, icons)
--color-white:     #ffffff   (primary text)
--color-muted:     #6b7280   (muted text)
--color-border:    #2a2a2a   (borders/dividers)
--color-success:   #22c55e
--color-warning:   #f59e0b
```

## Typography
- **Display / Headings:** Rajdhani (700, 600)
- **Body / UI:** Poppins (400, 500, 600)
- **Monospace:** JetBrains Mono (for codes, IDs)

## Design Language
- **Dark-first** — white text on deep black backgrounds
- **Glassmorphism** — semi-transparent surfaces with backdrop blur on overlays/cards
- **Red accents** — used sparingly for CTAs, badges, alerts, active states
- **Silver/gray** — secondary labels, icons, dividers
- **Motion** — staggered reveal on page load, smooth transitions (framer-motion)
- **Anti-pattern avoidance** — no purple gradients, no boring card grids

## Component Tokens
- Border radius: `rounded-sm` (4px) for inputs, `rounded-md` (8px) for cards, `rounded-full` for badges/pills
- Shadows: `shadow-[0_0_30px_rgba(224,32,32,0.1)]` for red glow on active elements
- Glass card: `bg-white/5 backdrop-blur-md border border-white/10`
- Button primary: `bg-[#e02020] hover:bg-[#b01818] text-white font-semibold`
- Button outline: `border border-[#e02020] text-[#e02020] hover:bg-[#e02020]/10`

## Layout
- Max content width: 1280px
- Mobile-first breakpoints: sm(640) md(768) lg(1024) xl(1280)
- Navbar height: 72px
- Sidebar width: 240px (desktop dashboard)

## Logo Usage
- Primary logo: `/logo.png`
- Secondary/icon: `/logo1.png`
