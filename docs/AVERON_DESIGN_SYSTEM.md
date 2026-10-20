# AVERON Design System

Status: canonical visual source of truth for AVERON storefront and admin UI.  
Owner: AVERON product requirements and this document. Tools such as Taste, Impeccable, Stitch, and reference libraries provide review and implementation guidance; they do not override these rules.

## 1. Brand principles

- Fashion-first, product photography first, editorial but easy to shop.
- AVERON's visual signature is a quiet warm-neutral canvas with precise cobalt actions, restrained ink typography, hairline borders, and full-bleed product imagery.
- Keep storefront chrome light. Keep admin information dense, direct, and task-oriented while sharing brand colors, type, controls, and status language.
- Mobile-first layout, fast feedback, stable geometry, and accessible interaction are part of the visual system.
- Do not copy another retailer's logo, copy, artwork, page composition, or distinctive brand treatment. Learn only general principles such as spacing, hierarchy, responsive behavior, and image handling.
- Avoid generic SaaS/dashboard cards in the storefront, decorative gradients, excessive shadows, blur, giant rounded panels, decorative finance metrics, and motion without a functional purpose.

## 2. Typography

Use Hanken Grotesk for display and headings, with Inter for interface/body text. Fallbacks: `Arial, "Segoe UI", system-ui, sans-serif`. Both fonts must include Cyrillic coverage. Do not add a font download/runtime dependency until licensing, loading cost, and offline fallback are checked.

| Role | Mobile | Desktop | Weight / line height / tracking |
|---|---:|---:|---|
| Display | 36px | 56px, max 64px | 600 / 1.05 / -0.035em |
| H1 | 30px | 48px | 600 / 1.12 / -0.03em |
| H2 | 26px | 32px | 600 / 1.2 / -0.025em |
| H3 | 22px | 24px | 500 / 1.25 / -0.02em |
| H4 | 18px | 20px | 500 / 1.3 / -0.01em |
| Body | 15px | 16px | 400 / 1.5 / 0 |
| Body small | 13px | 14px | 400 / 1.45 / 0 |
| Caption | 12px | 12px | 500 / 1.35 / 0.01em |
| Button | 13px | 13px | 600 / 1.2 / 0.01em |
| Price | 16px | 16px | 600 / 1.25 / 0 |
| Previous price | 12px | 12px | 400 / 1.25 / 0, strike-through |
| Badge | 11px | 11px | 600 / 1.2 / 0.04em |

Use sentence case for headings and controls. Reserve uppercase tracking for short metadata/kickers, never long instructions. Do not use more than the listed weights for an individual page unless the brand mark requires it.

## 3. Spacing

Base unit: 4px. Use `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96px`. Prefer these values for margins, gaps, padding, and section rhythm. Arbitrary values require a content, viewport, or pixel-alignment reason.

## 4. Layout and grid

| Viewport | Page inset | Content width | Catalog columns |
|---|---:|---:|---:|
| Mobile: 320–767px | 16px (12px only for dense utility rows) | fluid | 2 |
| Tablet: 768–1023px | 24px | fluid | 3 |
| Desktop: 1024–1399px | 32px | max 1440px | 3 with filters; 4 when filters are hidden and card minimum width remains 220px |
| Wide desktop: 1400px+ | 48px | max 1440px | 4 when card minimum width remains 220px, including with filters visible |

Catalog gaps: 12px mobile, 20px tablet/desktop. Product page: gallery and purchase panel in a two-column layout from 1024px, with the gallery receiving approximately 60% of the content width. Cart/checkout may use a two-column summary layout from 1024px. All grid children must be allowed to shrink (`min-width: 0`). No page may create horizontal viewport overflow at 320px.

## 5. Color roles

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FBF9F7` | `#111315` | Page background |
| `surface` | `#FFFFFF` | `#181B1F` | Inputs, dialogs, raised content |
| `surface-muted` | `#F4F2EF` | `#20242A` | Quiet sections and image backing |
| `text-primary` | `#1B1C1C` | `#F2F3F3` | Main content |
| `text-secondary` | `#444654` | `#C3C7CB` | Supporting content |
| `text-muted` | `#747685` | `#9BA2A9` | Metadata; never the only label for a control |
| `border` | `#D8D7D4` | `#30353C` | Hairline separators and control borders |
| `accent` | `#244FC7` | `#8EA5FF` | Primary actions, links, selected states |
| `accent-hover` | `#193DA8` | `#B0BFFF` | Hover/pressed action state |
| `success` | `#24734B` | `#78BD94` | Confirmed success |
| `warning` | `#9A6417` | `#E1B966` | Attention needed |
| `danger` | `#B42318` | `#FF8D83` | Destructive/error state |

Dark and light themes use the same semantic tokens and component structure. Images retain a neutral light backing when required for product clarity. Sale color is not the brand accent; keep sale/error semantics distinct. Verify text contrast to WCAG AA where practical, including disabled and selected controls.

## 6. Radius and depth

- Small: 2px for flags, tight chips, and image details.
- Medium: 4px for most controls, cards, and dialogs.
- Large: 8px for grouped operational surfaces and admin panels only.
- Pill: 999px only for status pills, compact filters, and circular icon controls.
- Product images and editorial sections remain square-edged unless the image itself has a native shape.
- Default elevation is none. Use a single soft shadow only for an overlay/menu that must separate from content. No nested card shadows.

## 7. Buttons

Primary: 44px minimum height, 16–20px horizontal padding, 4px radius, cobalt fill with white/light-theme or ink/dark-theme text as contrast requires. Secondary: 44px minimum, transparent/surface fill, one-pixel border. Ghost: 44px minimum without a visible border. Danger: semantic danger color plus explicit confirmation for destructive actions. Icon: 44×44px touch target; a smaller visible glyph is centered inside. Compact desktop-only table actions may use 36px with a clear accessible name.

All variants use the button typeface, consistent focus-visible ring, 140–180ms color transitions, a pressed state, and a real disabled state. Loading uses one shared inline spinner, `aria-busy`, and stable button width; reduce or remove animation for `prefers-reduced-motion`. Never rely on color alone to communicate disabled, selected, or error state.

## 8. Inputs and forms

- Standard control height: 44px; multi-line fields grow with content and start at 96px.
- Border: 1px `border`; radius 4px; horizontal padding 12px.
- Label: 13px/500 above the control; helper/error copy 12–13px directly below it.
- Focus: 2px visible accent outline with 2px offset; invalid uses danger border plus text/icon explanation.
- Disabled: preserve readable text and indicate unavailable behavior; do not rely on low-opacity alone.
- Keep labels visible after typing. Placeholders are examples, not labels.
- Localize validation and keep RU/UZ/EN strings flexible; avoid fixed widths sized for one locale.

## 9. Product card

- Image is the dominant element, 3:4 ratio, `object-fit: cover`, with a neutral image surface and no layout shift.
- Keep the card surface borderless; separate cards with grid spacing. No card-on-card framing.
- Title: two-line clamp, 14px mobile / 15px desktop, normal/medium weight.
- Price: 16px semibold; old price 12px muted and struck through; discount is a compact text badge.
- Favorite and compare actions have 44px targets, accessible state labels, and stable layout. On touch, actions are visible; on pointer devices, reveal them on hover and keyboard focus.
- Country, size, and availability are short secondary metadata. Do not add every product field to the card.
- Loading cards exactly match the live card image ratio, columns, and text block height. Unavailable and preorder states must stay readable and distinct.

## 10. Product detail

- Desktop: image gallery left, purchase decision panel right; mobile: image gallery first, then title/price/variant/availability/action/delivery details in that order.
- Preserve product image proportions and provide keyboard-operable gallery controls and descriptive alt text.
- Place size/color choices before the primary purchase action. Selected/unavailable choices need text/shape cues in addition to color.
- Size chart is horizontally contained on narrow viewports and must not widen the page.
- Size recommendation appears only when enough profile/product data exists and is described as guidance, not certainty.
- Quick order/Telegram must not expose unnecessary customer data and must use the existing backend/API contract.

## 11. Catalog filters and navigation

- Desktop filters are a 240px sidebar; the product grid receives the remaining width. The hide/show control communicates state with `aria-expanded` and a localized label.
- Mobile filters open in a scroll-contained bottom sheet or full-height drawer with a visible close/apply action and retained filter state.
- Menus/drawers have semantic layer tokens: page 0, sticky header 20, menu 40, overlay 50, modal 60, toast 70. Use a portal when an ancestor clips the surface. Constrain menus to the viewport and support Escape, outside click, and keyboard navigation.
- Header keeps search, catalog, account, favorites, and cart accessible without hiding the primary shopping paths. Preserve locale and safe query parameters on navigation.
- Back navigation must have a safe route fallback and must not cause cart/login loops.

## 12. Modals, loading, empty and error states

- Dialog width: 480px default, 640px for form detail, 960px for dense media/product work; 24px desktop padding and 16px mobile padding.
- On mobile, forms that require scrolling may use full-height dialogs with safe-area padding, pinned title/close control, and a sticky footer.
- Dialogs dim the page with a flat overlay, not a blurred background; lock background scroll, trap focus, close on Escape where safe, and restore focus.
- Use one button spinner, content skeletons that reserve final dimensions, and lazy image placeholders with fixed aspect ratio.
- Empty state says what is empty and offers the next relevant action. Error state names the failure and offers retry when retry is safe. Never replace failed API data with fake products or zero-valued financial data.

## 13. Admin interface

Admin shares colors, typography, spacing scale, controls, and status semantics. It uses denser tables, clear section headings, sticky operational toolbars only when needed, visible row actions, and readable state badges. Avoid storefront product-card styling, decorative hero blocks, excess whitespace, and dashboard decoration. Product publishing must remain an explicit authenticated admin action after review; this design system does not change permission or API behavior.

## 14. Motion and performance

- Default interaction: 140ms; menu/dialog entrance: 180ms; drawer: at most 280ms.
- Animate opacity and transform only. Honor reduced motion. No autoplay or motion required to understand a page.
- Avoid blur/backdrop filters on frequently scrolling or full-screen surfaces. Reserve image dimensions and avoid loading shifts. Prefer CSS and existing project dependencies; do not add a UI framework for styling convenience.

## 15. Accessibility and localization

- WCAG AA contrast where practical; semantic elements; visible keyboard focus; meaningful button names; correct dialog/menu semantics; keyboard-operable gallery, filters, and dropdowns.
- Touch controls target at least 44×44px. Keep focus order logical and focus within active dialogs/drawers.
- Support RU, UZ, and EN without fixed text widths. Test long labels, product names, prices, tabs, buttons, and validation messages at 320px and 200% zoom.
- Use text plus icon/shape for status; do not communicate success, warning, unavailable, or selection by hue alone.

## 16. Design review checklist

Before a UI change, read this file and `UI_AUDIT.md`; define the affected routes, states, viewport sizes, and preserved business interactions. Use Taste for direction/preflight and Impeccable for audit/refinement, then compare the rendered result to these tokens. Run Playwright on local/test data, capture 390px and 1440px screenshots, review console/network failures, and rerun relevant regression/security checks. Do not write to production, submit a real order/payment, publish products, or use production credentials in browser automation.

## 17. Reference method

This system draws general principles from the local AVERON Stitch exploration in `.stitch-reference/stitch_averon_fashion_design_system/averon_editorial_retail/DESIGN.md` and `averon_noir/DESIGN.md`: product-forward imagery, concise hierarchy, precise grid, restrained surface treatment, and clear state handling. Values and compositions are AVERON-specific; reference logos, copy, artwork, and complete page layouts are not to be copied.
