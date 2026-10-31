# UI components — own kit on framer-motion

HeroUI was removed. The UI layer is a small kit in `src/components/ui/`, written in this
project on top of **framer-motion** and Tailwind. Don't bring HeroUI or NextUI back, don't
add Radix, Base UI, or shadcn, and don't write HeroUI's API (`onPress`, `isDisabled`,
`classNames={{…}}`) from memory. If the kit lacks something, add it here.

## How the pieces fit

- `components/providers.tsx` mounts `<LazyMotion features={…} strict>` and
  `<MotionConfig reducedMotion='user'>` around the whole app.
- **Always use `m.*`, never `motion.*`.** `strict` throws on `motion.*`, which would pull
  the whole animation bundle into first load. Import as
  `import { m } from "framer-motion"`.
- The features load lazily from `ui/motion-features.ts` (`domAnimation`). That covers
  animations, variants, gestures, and exit animations. `layout` and `layoutId` need
  `domMax`, so they don't work here. Don't switch to `domMax` for one effect.
- Reduced motion is handled by `MotionConfig`. Transforms are skipped for people who ask
  for it.

## Components

| File               | Exports                                       | Notes                                                           |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| `button.tsx`       | `Button`                                      | See below                                                       |
| `modal/index.tsx`  | `ModalComponent`                              | `control`, `label`, `size`, `placement`                         |
| `drawer/index.tsx` | `DrawerComponent`, `DrawerHeader/Body/Footer` | Right-side panel. `control`, `label`, `size`                    |
| `overlay.tsx`      | `Overlay`                                     | What both share. Use it directly only for a new kind of overlay |
| `toast.tsx`        | `toast()`, `ToastViewport`                    | The viewport is mounted once in `providers.tsx`                 |
| `snippet.tsx`      | `Snippet`                                     | A value with a copy button                                      |
| `spinner.tsx`      | `Spinner`                                     | Dots. `size`: `sm`, `md`, `lg`                                  |
| `chip.tsx`         | `Chip`                                        | `color`: `success`, `danger`, `secondary`                       |
| `pagination.tsx`   | `Pagination`                                  | Controlled: `page`, `total`, `onChange`                         |
| `number-input.tsx` | `NumberInput`                                 | BTC amount. Digits and 8 decimals, reports `NaN` while empty    |
| `input-label.tsx`  | `InputLabel`                                  | Title, description, required mark                               |

### Button

Native button props plus three of its own. It's `onClick` and `disabled`, not `onPress`
and `isDisabled`.

```tsx
<Button
  className='bg-space-50 text-background'
  type='submit'
  size='sm'
  isLoading={isPending}
  disabled={!isValid}
  aria-label='Button send'>
  …
</Button>
```

`type` defaults to `"button"`, so a button inside a form doesn't submit it by accident.
`isLoading` shows the spinner and disables it. Icon-only buttons need `aria-label`.

### Modal and drawer

```tsx
const modal = useOverlayState()

<Button onClick={modal.open}>…</Button>

<ModalComponent control={modal} label='Send bitcoin' size='xl'>
  <SendForm onClose={modal.close} />
</ModalComponent>
```

- `useOverlayState()` from `@/hooks` gives `isOpen`, `open`, `close`, all stable.
- `label` becomes the dialog's `aria-label`. Always give a real one.
- The content unmounts when closed, so a typed passphrase doesn't stay in the form. State
  that must survive closing lives outside the overlay.
- **Overlays close only from inside**: no outside click, no Esc. An accidental click must
  not throw away a half-filled send form. Always render a close button.
- They stack: the send form opens a drawer and a modal over its own modal. Only the top
  one traps focus, focus returns to whatever opened it, and the page scrolls again when
  the last one closes.
- They render through a portal. React events still bubble to the parent in the React tree,
  so the overlay stops `submit` from reaching a form around it. Other events bubble as
  usual.

### Toast

```ts
import { toast } from "@/components/ui/toast"

toast({ title: "✅ Success", description: "Copied." })
toast({ title: "⚠️ Failed", description: message, timeout: 9e3 })
toast({ title: "✅ Sent", description: message, timeout: 0 }) // stays until closed
toast({ description: "Sending…", promise: send(), hasCloseButton: false }) // closes when it settles
```

Toasts sit below the navbar on purpose, so a toast that stays can't cover it.

## Patterns

- **Forms**: react-hook-form with the action's validator (`zodResolver(createValidator)`).
  Inputs use the `.form-input` class or the same `ring-*` utilities. Passphrase inputs are
  `type='password'` with `autoComplete='off'`.
- **Values set from code**: `setValue` doesn't revalidate by itself, so an error stays
  after the field is fixed. Pass `{ shouldValidate: isSubmitted }`, as `send/form.tsx`
  does.
- **Show every field's error.** A form that fails validation on a field with no visible
  error looks like a dead button. Pass `error={error.amount?.message}` down to custom
  fields.
- **Enter and exit animation**: wrap in `<AnimatePresence>`, and give the element a `key`
  and `initial` / `animate` / `exit`. Variants named `enter` and `exit` propagate from the
  overlay to the panel.
- **Prefer CSS** (`transition-colors`, `hover:`, `animate-pulse`) for simple hovers and
  fades. Reach for `m.*` when something enters or leaves the DOM.
- Animate only `transform` and `opacity`.
- **Skeletons**: `bg-space-50/5 animate-pulse rounded-xs` boxes of the final size.

## Theme

Tokens live in `src/styles/theme.css`. The app is dark-only, with no `dark:` variants.

- `background` is `#0a0a0a`, `foreground` is `#fafafa`.
- `space-50` to `space-950`: neutral greys, 50 is brightest. Used with opacity for
  surfaces (`bg-space-50/5`) and hairlines (`ring-space-50/10`).
- `foreground-50` to `foreground-900`: the same idea as an **inverted** scale, 50 is the
  darkest surface and 900 the brightest text. `text-foreground-500` is muted text,
  `ring-foreground-50` a quiet border.
- `overlay`: the backdrop colour. Other utilities: `max-w-space` (the page width),
  `word-tight`, `scrollbar-hide`.
- Primary emphasis is `bg-space-50 text-background`. Errors are `text-red-500`.
- Corners are `rounded-xs` nearly everywhere.
- The CSP blocks inline scripts but allows inline styles, so `style={{…}}` and
  framer-motion work.

### The dashboard's look

`/` has the wallet's look: `.mirror` cards, `rounded-xs`, Ubuntu and Inconsolata, the
stars and the glow, amber for fees, the shared navbar, and the `max-w-space` column.

- `docs/design/dashboard/` was its first design. The owner dropped that look on 2026-10-31
  (sharp corners, Geist and JetBrains Mono, its own colours), so don't bring its tokens
  back.
- Its pieces live in `app/(dashboard)/components/`. Promote one if a second route needs
  it.

## Screen width

Below `lg` (1024px) the root layout hides `.app-router` and shows `ScreenNotice`, so a
page never needs a layout for a narrow screen. The navbar stays, and wraps to fit. The
page is hidden rather than left out because its sync keeps the navbar's data fresh.

## Navbar

The navbar is `fixed`, 60px tall, and `NavbarGlass` fades in its background once the page
has scrolled past 100px. The toasts start at 64px, below it.

## Icons

Icons come from `@keyline-icons/react`. Import each by name with the `Icon` suffix, so it
can't clash with a component (`SendIcon`, not `Send`):

```tsx
import { SendIcon } from "@keyline-icons/react"

;<SendIcon className='size-5' />
```

- Size with `size-*` and colour with `text-*`. The stroke is `currentColor`, so an icon
  takes the text colour around it.
- An icon is `aria-hidden`, so an icon-only button needs an `aria-label`.
- Find names at [keylineicons.com](https://keylineicons.com). Don't draw your own or add a
  second icon package.
