# Design tokens snapshot — 2026-11-10

Исходные значения до изменений контраста. Снято с `app/[locale]/globals.css` и текущих компонентов до каких-либо правок.

## CSS цветовые, радиусные и теневые переменные

| Переменная | Light (:root) |
|---|---|
| `--color-primary` | `var(--color-primary, #1a1a1a)` |
| `--color-primary-50` | `color-mix(in srgb, var(--color-primary) 5%, white)` |
| `--color-primary-100` | `color-mix(in srgb, var(--color-primary) 10%, white)` |
| `--color-primary-200` | `color-mix(in srgb, var(--color-primary) 20%, white)` |
| `--color-primary-300` | `color-mix(in srgb, var(--color-primary) 40%, white)` |
| `--color-primary-400` | `color-mix(in srgb, var(--color-primary) 60%, white)` |
| `--color-primary-500` | `var(--color-primary)` |
| `--color-primary-600` | `var(--color-primary)` |
| `--color-primary-700` | `var(--color-secondary, color-mix(in srgb, var(--color-primary) 80%, black))` |
| `--color-primary-800` | `color-mix(in srgb, var(--color-primary) 70%, black)` |
| `--color-primary-900` | `color-mix(in srgb, var(--color-primary) 60%, black)` |
| `--color-primary-950` | `color-mix(in srgb, var(--color-primary) 50%, black)` |
| `--radius-theme` | `var(--border-radius, 0.125rem)` |
| `--color-scroll-top-bg` | `#ffffff` |
| `--color-scroll-top-hover` | `#f1f1f1` |
| `--color-scroll-top-fg` | `#1a1a1a` |
| `--color-scroll-top-border` | `#1a1a1a` |
| `--shadow-scroll-top` | `0 4px 18px rgb(0 0 0 / 18%)` |
| `--color-primary` | `#1a1a1a` |
| `--color-action-bg` | `#1a1a1a` |
| `--color-button-hover` | `#111111` |
| `--color-on-action` | `#ffffff` |
| `--color-secondary` | `#404040` |
| `--color-bg` | `#ffffff` |
| `--color-surface` | `#ffffff` |
| `--color-surface-soft` | `#f5f5f5` |
| `--color-image-surface` | `#f3f3f3` |
| `--color-text` | `#111111` |
| `--color-text-secondary` | `#4a4a4a` |
| `--color-border` | `#dddddd` |
| `--color-border-hover` | `#999999` |
| `--color-muted` | `#767676` |
| `--color-sale` | `#d6001c` |
| `--color-on-primary` | `#ffffff` |
| `--color-overlay` | `rgb(0 0 0 / .58)` |
| `--color-success` | `#24734b` |
| `--color-warning` | `#9a6417` |
| `--color-error` | `#b42318` |
| `--color-info` | `#436d91` |
| `--radius-xs` | `0` |
| `--radius-sm` | `0.0625rem` |
| `--radius-md` | `0.125rem` |
| `--radius-lg` | `0.1875rem` |
| `--radius-card` | `0` |
| `--radius-control` | `0` |
| `--shadow-drawer` | `-18px 0 48px rgb(0 0 0 / .18)` |
| `--color-scroll-top-bg` | `#f4f4f4` |
| `--color-scroll-top-hover` | `#ffffff` |
| `--color-scroll-top-fg` | `#111111` |
| `--color-scroll-top-border` | `#ffffff` |
| `--shadow-scroll-top` | `0 4px 20px rgb(0 0 0 / 45%)` |
| `--color-primary` | `#f1f1f1` |
| `--color-secondary` | `#cfcfcf` |
| `--color-bg` | `#111315` |
| `--color-text` | `#f2f3f3` |
| `--color-text-secondary` | `#c3c7cb` |
| `--color-surface` | `#181b1f` |
| `--color-surface-soft` | `#20242a` |
| `--color-image-surface` | `#20242a` |
| `--color-action-bg` | `#e7e8ea` |
| `--color-button-hover` | `#d5d8dd` |
| `--color-on-action` | `#17191c` |
| `--color-border` | `#3a3a3a` |
| `--color-border-hover` | `#737373` |
| `--color-muted` | `#a3a3a3` |
| `--color-sale` | `#ff6577` |
| `--color-on-primary` | `#181818` |
| `--color-success` | `#78bd94` |
| `--color-warning` | `#e1b966` |
| `--color-error` | `#ff8d83` |
| `--color-info` | `#93b9d7` |
| `--shadow-drawer` | `-18px 0 48px rgb(0 0 0 / .38)` |

Dark theme overrides: `.dark` overrides listed below; inherited values remain as listed above.

- `--color-scroll-top-bg: #f4f4f4;`
- `--color-scroll-top-hover: #ffffff;`
- `--color-scroll-top-fg: #111111;`
- `--color-scroll-top-border: #ffffff;`
- `--shadow-scroll-top: 0 4px 20px rgb(0 0 0 / 45%);`

## Component values (before changes)

### Button (`components/ui/Button.tsx` + `.averon-*` rules)
- Variants: default=`averon-primary-button`; outline=`averon-secondary-button`; ghost=`averon-ghost-button`; link=transparent underline.
- Primary: bg `--color-action-bg`, text `--color-on-action`, hover bg `--color-button-hover`; transparent border; radius `--radius-control`; padding sizes default `h-10 px-4 py-2`, sm `h-9 px-3`, lg `h-11 px-8`; font 14px/500.
- Secondary/ghost: governed by CSS classes in globals.css; focus ring 2px `primary-500` with 2px offset; disabled opacity 0.5. States and exact declarations are recorded in source rules.

### Container (`components/ui/Container.tsx`)
- Default max-width 1440px; horizontal padding `px-4 sm:px-6 lg:px-8 2xl:px-12`; custom maxWidth prop overrides.

### Input, Select, Badge, Card, Modal
- Input uses surface bg, text color, border color, muted placeholder; radius `--radius-control`, 44px high; focus ring 2px primary-500, disabled opacity 0.5.
- Select/textarea native and app-specific rules are in globals.css; surface/text/border tokens, minimum 44px in storefront scope.
- Badge variants use contextual utility classes; exact individual uses are local to component call sites.
- Card `.averon-panel`: surface bg, border, `--border-radius`; shadows where declared by component.
- Modal panel: surface bg, text, border tokens; `shadow-xl`; overlay black/60; close button 44x44, secondary text and surface-soft hover.

Snapshot records original source values; utility-driven per-instance overrides remain component-local.
