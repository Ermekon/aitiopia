# AItiopia Rebuild Plan — vs. "Shot on iPhone in Black & White"

**Reference:** https://shotoniphone.lorenzobocchi.com/ (teardown dated 2026-04-13)
**Analyzed:** 2026-07-03, against the uncommitted working tree.

---

## 0. Reality check on the current stack

The task brief said "Tailwind v4 + Motion" — neither is actually installed. The real stack:

| | Reference (teardown) | AItiopia (actual) |
|---|---|---|
| Framework | Next.js App Router | Next.js **16.2.7**, React 19.2.4 |
| Styling | Tailwind CSS | **Hand-rolled CSS custom properties** (`globals.css` tokens) + inline styles |
| Animation | GSAP (maybe) / CSS | **CSS transitions + IntersectionObserver** (no animation lib) |
| Images | Supabase Storage + next/image | Same, plus per-image `blur_data_url`, `onError` fallback |
| Data | `photos` table (path, date, lat/lng) | Rich `images` table: status workflow, per-series metadata, curation pipeline |
| Fonts | System / Inter / Geist | **Syne** (display) + **Lora** (body italic) |
| Theme | Pure black only | Dark `#06060F` / light `#F5F5F0` toggle, gradient brand accent |
| Views | Flow (vertical masonry) / Grid / Map | Flow (**horizontal filmstrip**) / Grid + FilterBar |
| Caching | Not noted | ISR `revalidate = 3600`, React `cache()`, `server-only` |

Keeping the no-dependency styling approach is recommended — it already matches the
teardown's own conclusion ("CSS columns is most likely — zero-JS").

---

## 1. Architecture comparison

### Where AItiopia is already ahead of the reference

- **Data pipeline**: status workflow (processing → draft → published → rejected), RLS,
  auto-ingest Edge Function, `/curate` admin, integrity scripts. The reference has a bare
  `photos` table.
- **Performance discipline**: ISR, `cache()` dedup, dynamic-imported lightbox, memoized
  index maps, tuned `sizes` attributes, real blur placeholders. The reference serves
  `w=3840` images (the teardown itself flags this as wasteful).
- **Accessibility**: focus traps, focus restore, `aria-pressed`, keyboard scroll,
  reduced-motion support, empty states. None of this is evident in the reference.
- **SEO plumbing**: JSON-LD (WebSite + CollectionPage/ImageObject), per-series routes with
  `generateStaticParams`, OG/Twitter metadata.
- **Lightbox** with keyboard + swipe navigation — reference has none.

### Where the reference is ahead — the gaps to close

1. **About drawer presentation.** ~~On-page hero essay~~ — **CORRECTED 2026-07-03 from
   live screenshot**: the reference's essay is *also in a hamburger drawer*, not on-page
   (the teardown saw the text in the HTML and assumed it was visible). AItiopia's drawer
   text is likewise already in the SSR HTML (the `<aside>` renders translated off-screen),
   so the crawlability gap is smaller than assumed — the real remaining SEO gap is just
   the **missing `<h1>`**. What the reference's drawer does better *visually*:
   dark panel that blends with the site (AItiopia's is stark white), a display-type
   **headline** ("The beautiful dark of life."), wider panel (~60vw), real avatar photo +
   signature flourish on the founder row, hamburger morphs into an **X in place** while
   the wordmark stays visible, and the gallery remains dimmed-but-visible beside it.
2. **Flow scroll zoom-out.** ~~Vertical masonry~~ ~~natural aspect ratios~~ —
   **CORRECTED TWICE 2026-07-03 from live screenshots**: the reference Flow is a
   horizontal filmstrip of *uniform ~3:4 cards*, exactly like AItiopia's (the teardown's
   "vertical masonry" was a wrong inference, and the "variable widths" in the first
   screenshot were clipped edge cards). The one real difference: **while scrolling, the
   reference's strip zooms out to ~60% scale** (cards ~630px → ~375px tall), giving an
   overview of more cards mid-scroll, then eases back to full size when scrolling stops.
   AItiopia's strip is static. This scroll-state zoom is the missing signature effect.
3. **A third view.** The reference's Map view is its architectural showpiece. AItiopia has
   no GPS data — the culturally-equivalent third view is a **Fidel index**: a chart of the
   script itself where each cell is a letter (from `fidel_letter` metadata) linking to its
   artwork. Map : geography :: Fidel chart : the writing system.
4. **Pagination.** Reference paginates with `range()` + sentinel. AItiopia loads all
   images in one query — fine at 52, a problem at ~200+. Defer, but design for it.
5. **View crossfade.** Reference likely animates Flow↔Grid. AItiopia hard-swaps.

### Deliberate divergences to keep (do NOT copy the reference)

- Keep the **FilterBar** (series filter) — the reference has nothing like it and it fits
  the three-series content model.
- Keep the **theme toggle** — B&W photography wants pure black; colorful fidel art
  benefits from both themes.
- Keep the **Preloader** (brand moment, already optimized to ~350ms).
- Keep 3:4 uniform crop **in Grid** (teardown itself recommends uniform crop for grids).

---

## 2. Component-by-component rebuild guide

| Component | Verdict | Action |
|---|---|---|
| `app/layout.tsx` | Keep | No change |
| `app/page.tsx` | Extend | Add an `<h1>` (visually-hidden or in TopBar wordmark) — the only true SEO gap (Phase 1) |
| `components/PageClient.tsx` | Extend | Accept `hero` children slot; view type union grows to `'flow' \| 'grid' \| 'fidel'` |
| `components/TopBar.tsx` | Extend | Third toggle pill "Fidel" (Phase 3); pill markup already maps over a `View[]` array |
| `components/PhotoGallery.tsx` | Extend | Add `view === 'fidel'` branch; add crossfade wrapper (Phase 4) |
| `components/FlowLayout.tsx` | Adjust | Keep the filmstrip and the 3:4 crop (both verified correct vs. live reference). Add scroll-state zoom-out effect (Phase 2) |
| `components/GridLayout.tsx` | Keep | Already matches teardown's Grid spec exactly |
| `components/PhotoCard.tsx` | Keep | Add `natural?: boolean` prop so masonry can opt out of 3:4 crop |
| `components/FilterBar.tsx` | Extend | Show in Flow view too once Flow is vertical (currently grid-only) |
| `components/ImageLightbox.tsx` | Keep | Optionally respect natural aspect ratio instead of forced 3:4 |
| `components/AboutDrawer.tsx` | Restyle | KEEP (reference uses the same pattern). Dark panel, add headline, wider (~60vw), hamburger→X morph, signature/avatar polish (Phase 1) |
| `components/Preloader.tsx` | Keep | No change |
| `hooks/useView.ts` | Extend | Accept `'fidel'` param value |
| `hooks/useScrollReveal.ts` | Keep | Reuse as-is for masonry + fidel views |
| `lib/queries.ts` | Extend later | `getImagesPage(offset, limit)` when pagination lands (Phase 5) |
| ~~NEW `components/Hero.tsx`~~ | Dropped | Reference has no on-page hero — essay stays in the drawer |
| NEW `components/FidelLayout.tsx` | Build | Fidel chart view (Phase 3) |

---

## 3. Key pattern code examples

### 3a. Flow scroll zoom-out (CORRECTED — was "vertical masonry", then "natural ratios")

Verified against live screenshots: the reference keeps uniform 3:4 cards (like AItiopia)
but scales the whole strip to ~60% while the user is actively scrolling, easing back to
100% on idle. Measured card heights (630px rest → 375px scrolling) match a container
`transform: scale(0.6)` almost exactly.

```tsx
// FlowLayout.tsx — track "is the strip actively scrolling?"
const [scrolling, setScrolling] = useState(false)
const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

useEffect(() => {
  const el = containerRef.current
  if (!el) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const onScroll = () => {
    setScrolling(true)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setScrolling(false), 180)
  }
  el.addEventListener('scroll', onScroll, { passive: true })
  return () => { el.removeEventListener('scroll', onScroll); clearTimeout(idleTimer.current) }
}, [])

// Inner track wraps the cards so the scroll container itself isn't transformed
// (transforming the scroller would change the scrollable area mid-gesture).
<div ref={containerRef} className="flow-scroll" ...>
  <div className="flow-track" data-scrolling={scrolling || undefined}>
    {images.map(...)}
  </div>
</div>
```

```css
/* globals.css */
.flow-track {
  display: flex;
  align-items: center;
  gap: 12px;
  transform-origin: center center;
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}
.flow-track[data-scrolling] {
  transform: scale(0.6);
  transition-duration: 250ms;   /* zoom out fast, ease back slow */
}
```

Notes: fire the same `setScrolling` path from the existing wheel handler and pointer-drag
move (drag scrolling sets `scrollLeft` directly, which does emit `scroll` events, so the
listener covers all three input modes). Keep the effect off for `prefers-reduced-motion`.
Also apply `scale`-aware padding: at 0.6 the track's visual left edge moves inward, which
is fine — the reference shows the same widened margins mid-scroll.

### 3b. Scroll reveal

Already built and better than the teardown's snippet (`useScrollReveal` has stagger
capping, reduced-motion, and a 2s fallback). Reuse: add `reveal-item` class to masonry
items and pass the same ref. Zero new code.

### 3c. View crossfade without a library (View Transitions API)

```tsx
function changeView(next: View, setView: (v: View) => void) {
  if (!document.startViewTransition) { setView(next); return }
  document.startViewTransition(() => flushSync(() => setView(next)))
}
```

```css
::view-transition-old(root) { animation: 180ms ease both fade-out; }
::view-transition-new(root) { animation: 220ms ease both fade-in; }
@keyframes fade-out { to { opacity: 0 } }
@keyframes fade-in  { from { opacity: 0 } }
```

Progressive enhancement — unsupported browsers get the current instant swap. No Motion
dependency needed.

### 3d. Fidel index view (the "Map" equivalent)

```tsx
// FidelLayout.tsx — chart of the script; cells with artwork are live
const byFidel = new Map(
  images.filter(i => i.series === 'letters' && i.fidel_letter)
        .map(i => [i.fidel_letter!, i])
)
// Render the fidel inventory (base characters) as a CSS grid;
// cells present in byFidel show a hover thumbnail + open the lightbox,
// absent cells render dimmed (--text-subtle) — "not yet illustrated".
<div role="grid" aria-label="Fidel character index" className="fidel-grid">
  {FIDEL_INVENTORY.map(ch => {
    const img = byFidel.get(ch)
    return img
      ? <button key={ch} className="fidel-cell live" onClick={() => onSelect(img)}>{ch}</button>
      : <span key={ch} className="fidel-cell">{ch}</span>
  })}
</div>
```

This doubles as a progress tracker: the dimmed cells show which letters remain to be
created — the collection literally fills in the alphabet over time.

### 3e. Infinite scroll (Phase 5, when needed)

```ts
// lib/queries.ts
export const getImagesPage = cache(async (offset: number, limit = 40) => {
  const { data, error } = await supabase.from('images').select('*')
    .eq('status', 'published').order('sort_order')
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data ?? []
})
```

Client: sentinel `<div>` after the gallery + IntersectionObserver → server action or
route handler fetches the next page and appends. Keep first page server-rendered for SEO.

---

## 4. Phase-by-phase build plan

### Phase 0 — Ship what exists *(~30 min)* ← do first
Commit the working tree, push (Vercel auto-deploys), set `CURATE_PASSWORD` in Vercel.
Also: continue curating the 36 published images that still have placeholder metadata —
Phase 3's Fidel view depends on `fidel_letter` being filled in.

**Checklist:** `npm run build` passes · production `/` renders · `/curate` gated by
password in prod · `/letters` `/words` `/miscellaneous` render · `npm run check` clean.

### Phase 1 — About drawer restyle + `<h1>` *(3–4 h)* — ✅ IMPLEMENTED 2026-07-03 (uncommitted)
**CORRECTED**: the reference's essay is in a hamburger drawer too — keep AItiopia's
drawer, upgrade it to reference quality:
- **Dark panel** that blends with the site (`--bg-raised`/`--bg-overlay` tokens, both
  themes) instead of the current stark white.
- **Headline** at the top in Syne display type — e.g. "No face. No filter. Just the
  letters." — mark it up as the page `<h1>` (drawer is in the SSR HTML, so this also
  closes the missing-h1 SEO gap; alternatively put a visually-hidden `<h1>` in page.tsx).
- **Wider panel**: ~min(60vw, 900px) on desktop; essay in a comfortable measure.
- **Hamburger → X morph in place**: the TopBar pill keeps the wordmark, icon swaps to X
  while open (reference behavior) — instead of a separate close button inside the panel.
- Founder row: keep; consider a real avatar photo over the "EM" initials circle, and an
  Amharic signature/flourish on the right as the brand moment.

**Checklist:** exactly one `<h1>` on every route · essay text in view-source ·
drawer readable in both themes · hamburger/X toggles and focus trap still work ·
Esc + backdrop click close · 320px: panel leaves ≥40px backdrop · Lighthouse SEO ≥ 95 ·
gallery dimmed-but-visible beside the open panel.

### Phase 2 — Flow scroll zoom-out *(2–3 h)* — ✅ IMPLEMENTED 2026-07-03 (uncommitted)
**CORRECTED TWICE**: screenshots confirm the reference Flow is a horizontal filmstrip of
uniform 3:4 cards — AItiopia's resting state already matches it exactly. The gap is the
scroll-state zoom: strip scales to ~0.6 while scrolling, eases back on idle (§3a).
Implementation: inner `.flow-track` wrapper + `scrolling` state + CSS transform
transition. Disabled under `prefers-reduced-motion`.

**Checklist:** zoom-out engages on wheel, drag, and arrow-key scroll · eases back ~500ms
after scroll stops · no jitter when scroll events stream (state only flips at edges) ·
transform doesn't break click-to-open lightbox or drag-vs-click detection · edge fades
stay aligned · 60fps on mobile (transform-only, no layout) · reduced-motion: no zoom ·
images stay sharp at rest (no lingering transform).

### Phase 3 — Fidel index view *(6–8 h)* — ✅ IMPLEMENTED 2026-07-03 (uncommitted)
`FidelLayout.tsx` per §3d + `View` union grows to `'fidel'` (types, useView, TopBar pill,
PhotoGallery branch). Needs `fidel_letter` curated (Phase 0). Cells without artwork render
dimmed. Clicking a live cell opens the existing lightbox.

**Checklist:** every published letter appears on its cell · uncurated letters dimmed, not
clickable · `?view=fidel` survives refresh · lightbox opens from cell · works in both
themes · mobile: grid scrolls vertically, cells ≥ 44px tap targets · screen reader
announces character + transliteration.

### Phase 4 — View transitions + polish *(2–3 h)* — ✅ IMPLEMENTED 2026-07-03 (uncommitted)
`document.startViewTransition` crossfade (§3c), guard with `prefers-reduced-motion`.
Optionally let the lightbox use natural aspect ratio.

**Checklist:** crossfade in Chrome/Edge · Safari/Firefox fall back to instant swap with no
error · reduced-motion disables it · no flash of empty gallery mid-transition.

### Phase 5 — Pagination *(3–4 h, deferred until ~150+ images)*
`getImagesPage` + sentinel observer (§3e). First 40 SSR'd; JSON-LD stays complete
(metadata-only query for the rest, or sitemap).

**Checklist:** first paint unchanged · scrolling appends without jumps · filter + fidel
views still see full dataset or refetch correctly · no duplicate keys · Supabase egress
per visit drops.

**Total active effort: ~13–17 h** across phases 0–4; Phase 5 deferred.

---

## 5. Decisions (resolved 2026-07-03)

1. **Filmstrip: KEEP, including the 3:4 crop.** Live screenshots proved the reference
   Flow is a horizontal filmstrip of uniform 3:4 cards — the teardown's "vertical
   masonry" was wrong, and so was the intermediate "natural aspect ratios" read (clipped
   edge cards looked like variable widths). Phase 2 is now the scroll zoom-out effect.
2. **AboutDrawer: KEEP and restyle** (reversed 2026-07-03 — screenshot shows the
   reference uses the same drawer pattern; the teardown's "essay above the gallery" was
   wrong). Dark panel + headline-as-h1 + wider + hamburger→X morph. No Hero component.
3. **Fidel inventory scope**: 33 base characters first; expand to the 7-order syllabary
   later by nesting orders under each base character.
