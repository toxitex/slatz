# Resources

What went into the SLATZ storefront and admin: what was named in chat,
what was opened while choosing pieces, and what is actually in the site.

## Named in chat

- The repo, on `cursor/sveltekit-apple-rebuild-9a5a`.
- Screenshots of the storefront and the dashboard, used as the visual check.
- English type: Helvetica first, then SF Pro.
- A real dark and black theme with a switch, not a color swap on the same theme.
- The dashboard idea: an overview, category columns, products dragged between
  those columns, and a popup to create and edit a product.
- That dashboard message also included links. The raw URLs are not in the
  text still on hand, so they are not listed here.

## Opened while choosing the dashboard

These pages were read while picking the pieces. Only the ones marked used are in the site.

| Resource                                     | Address                                                                                      | In the site                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| svelte-dnd-action                            | [github.com/isaacHagoel/svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action) | Yes. Product board.                       |
| FormKit Drag & Drop                          | [drag-and-drop.formkit.com](https://drag-and-drop.formkit.com)                               | No.                                       |
| Bits UI Dialog                               | [Dialog](https://www.bits-ui.com/docs/components/dialog)                                     | Yes. Product editor.                      |
| Bits UI Alert Dialog                         | [Alert Dialog](https://www.bits-ui.com/docs/components/alert-dialog)                         | Yes. Delete confirms.                     |
| Bits UI Select, Switch, Dropdown Menu        | [bits-ui.com](https://www.bits-ui.com)                                                       | Yes. Forms and the account menu.          |
| Bits UI Slider, Combobox, Command, Accordion | [bits-ui.com](https://www.bits-ui.com)                                                       | Looked at. Not added.                     |
| shadcn-svelte Chart                          | [shadcn-svelte.com](https://shadcn-svelte.com)                                               | Looked at. The sales chart is custom SVG. |
| LayerChart                                   | [next.layerchart.com](https://next.layerchart.com)                                           | Looked at. Not installed.                 |

## In the site

### Type

- Thai: [Anuphan](https://fontsource.org/fonts/anuphan) variable, weights 100–700,
  Thai characters only (`@fontsource-variable/anuphan`).
- English: SF Pro Text and SF Pro Display, then the system font, Helvetica Neue,
  Helvetica, Arial. SF Pro is the font already on Apple devices. It is not a
  file in the repo.
- Mono: SF Mono, then Menlo.
- `static/fonts/FCPride.ttf` is in the repo and is not used by any page.

### Visual references copied into the code

- [Magic UI Morphing Text](https://magicui.design/docs/components/morphing-text) for the hero phrases.
- [React Bits Grainient](https://reactbits.dev/backgrounds/grainient) for the animated background.
- Apple’s store pages for the hero, product stories, and the frosted pill navigation.
- macOS System Settings for the grouped admin sidebar.
- GitHub’s contribution calendar for the 26-week sales heatmap. The line chart
  next to it is drawn in the page, not from a chart library.

### UI kit

- [shadcn-svelte](https://shadcn-svelte.com) for Button, Input, Textarea, Label,
  Badge, Select, Switch, Dialog, Alert Dialog, Dropdown Menu, Separator, and
  Sonner.
- [Bits UI](https://www.bits-ui.com) under those components.
- [Lucide](https://lucide.dev) for the icons.
- [svelte-sonner](https://github.com/wobsoriano/svelte-sonner) for toasts.
- Tailwind CSS 4, `tw-animate-css`, `tailwind-variants`, `tailwind-merge`, and `clsx`.

### App stack

- SvelteKit 2, Svelte 5, TypeScript, Vite.
- Express, SQLite (`better-sqlite3`), JWT, bcrypt, Zod, cookie-parser.

`@internationalized/date` is installed and is not imported by any page.
