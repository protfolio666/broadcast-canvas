
# Overlay Studio — v1 Plan

Scope trimmed to what you described: upload PNG → drag fields → bind to Google Sheet columns → get an OBS browser-source URL that reflects sheet changes automatically. Multiple PNGs (pages) per project. Design: "Obsidian tech elite" direction you picked.

Skipped for v1 (can add later): AI assistant, AI PNG detection, video/GIF/QR/gradient layers, animations, custom fonts upload, templates marketplace, asset library, groups, in-editor collaboration.

## Hosting note
You asked for Netlify + your own Supabase. Lovable projects run on TanStack Start (Cloudflare Workers) with Lovable Cloud (managed Supabase). I'll build here using Lovable Cloud so auth, DB, storage, and the OBS endpoint work immediately. The code is standard React + Supabase JS, so you can later self-host to Netlify with your own Supabase project — that's a separate export step, not part of this build.

## Pages
```
/                         Landing (hero, 3-step, features, pricing, FAQ, footer)
/auth                     Email + Google sign-in / register / forgot password
/dashboard                Projects grid + "New project"
/project/:id              Project with left rail of pages, canvas editor, right panel
/overlay/:pageId          Transparent 1920x1080 OBS view (no chrome, no auth)
```

Design tokens (obsidian, electric cyan `#00F0FF`, slate panels, Chakra Petch display + Inter body) ported into `src/styles.css` verbatim from the selected prototype.

## Editor (v1 feature set)
Canvas is a fixed 1920x1080 stage (zoom-to-fit + wheel zoom + pan). Background is the uploaded PNG at 1:1.

Layer types:
- Text (font size, weight, color, alignment, stroke, shadow)
- Image (URL or uploaded, fit modes)
- Rectangle (fill, radius, border)

Per-layer ops: drag, resize (8 handles), rotate, opacity, duplicate, delete, lock, hide, bring forward/backward, snap to grid + guides, multi-select, undo/redo, keyboard (Ctrl+C/V/D/Z/Y, Delete, Shift-select).

Layers panel: rename, hide, lock, delete, drag-reorder.

Properties panel: X, Y, W, H, rotation, opacity, plus type-specific fields, plus the **Data Binding** block (sheet + column dropdown, or "Static value"). Binding only replaces the text/image src — position, font, color are never touched by sheet updates.

Rendering: Konva.js in the editor; the `/overlay/:pageId` view renders the same JSON with an HTML/CSS renderer for crisp text/images in OBS and a transparent body.

## Google Sheets binding
- User pastes a Google Sheet URL and picks a worksheet.
- We store `spreadsheet_id`, `worksheet`, and the header row (row 1) as available columns.
- Each bindable layer stores `{ source: "sheet", sheetId, worksheet, column, row }` (default row = 2) or `{ source: "static", value }`.
- Data fetch: server function calls the Sheets API using the Lovable App Connector for Google Sheets (`google_sheets`) so users don't paste API keys. The sheet must be shared with the connector's service account or set to "anyone with the link can view" — we'll surface that instruction in the connect dialog.
- `/overlay/:pageId` polls the values endpoint every 1s (configurable: 1/2/5/10s or manual) and swaps only the bound values. Positions/styles stay locked.

## OBS URL
- Each page has a stable public URL: `/overlay/:pageId`.
- Body has `background: transparent`, no auth, no UI. Sized 1920x1080; the user configures OBS Browser Source at 1920x1080.
- "Copy OBS URL" button in editor header.

## Data model (Supabase)
```
profiles(id, email, created_at)
projects(id, owner_id, name, created_at, updated_at)
pages(id, project_id, name, background_url, refresh_ms, updated_at)
layers(id, page_id, type, x, y, w, h, rotation, opacity,
       z_index, locked, hidden, style_json, binding_json)
sheet_connections(id, owner_id, project_id, spreadsheet_id,
                  worksheet, header_row_json)
assets(id, owner_id, kind, storage_path, mime, created_at)
```
RLS: owner-only on all tables. Public read on `pages` + `layers` for OBS view is done through a server function that returns a redacted render JSON given a `pageId` (no auth), so RLS stays owner-only.

Storage buckets: `backgrounds` (private, signed URL), `assets` (private, signed URL). The overlay renderer receives signed URLs from the server function.

## Auth
Supabase Auth: email/password + Google (via Lovable-managed provider). Password reset page at `/reset-password`.

## Architecture
- State: Zustand for editor (layers, selection, history stacks).
- Data: TanStack Query for projects/pages/sheet data.
- Server: TanStack `createServerFn` for all DB and Sheets calls; `/overlay/:pageId` uses a public server function to load render JSON + resolved sheet values.
- Editor split into `Canvas`, `LayersPanel`, `PropertiesPanel`, `Toolbar`, `BindingPicker`.

## Build order
1. Enable Lovable Cloud, create schema + RLS + storage buckets.
2. Landing page (matching selected direction).
3. Auth (email + Google) + `/dashboard`.
4. Project + page CRUD, PNG upload → background.
5. Editor: canvas, add text/image/rect, transform, layers panel, properties panel, undo/redo, save.
6. Google Sheets connector + binding picker.
7. `/overlay/:pageId` transparent renderer + polling + "Copy OBS URL".
8. Polish: FAQ, pricing (static), keyboard shortcuts help, empty states.

## Technical details
- Canvas: `react-konva` for text/image/rect nodes with `Transformer`; OBS renderer uses absolutely-positioned HTML for correct font rendering and transparency.
- Sheet fetch cache: 1s TTL on the server fn keyed by `(spreadsheetId, worksheet)` to protect the Sheets quota when many overlays poll.
- Undo/redo: keep last 50 snapshots of the layers array in Zustand.
- Text auto-fit: optional per text layer, scales font-size to fit width.

## Out of scope for v1 (explicit)
AI assistant, AI PNG region detection, video/GIF/QR/SVG/gradient layers, animations, custom fonts, templates marketplace, asset library UI, groups/nested groups, Netlify export/self-host, team collaboration, embed URLs beyond `/overlay/:pageId`.
