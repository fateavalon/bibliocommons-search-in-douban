# Changelog

All notable changes to the BiblioCommons Search in Douban userscript are documented here.

## [2.0.0] - 2026-03-17

### Added
- **LINK+ Union Catalog search**: Searches the LINK+ union catalog (`csul.iii.com`) which covers all ~65 LINK+ member libraries in a single request. Supports both ISBN and keyword/title search. Enabled by default alongside SFPL.
- **LINK+ group in settings**: New "LINK+" collapsible group at the top of the settings panel. Contains a single entry "LINK+ (All Members)" that can be toggled on/off.
- **MARINet (Marin County) BiblioCommons**: Added `marinet.bibliocommons.com` covering Marin County Free Library, Mill Valley, Belvedere-Tiburon, Larkspur, San Anselmo, San Rafael, and Sausalito.
- **San Mateo City Library BiblioCommons**: Added `smplibrary.bibliocommons.com`.
- **Unified search dispatcher**: Internal adapter architecture (`searchAnyLibrary`) that routes searches to the correct backend (BiblioCommons or LINK+) based on library type.

### Changed
- **Streaming results**: Results now appear progressively as each library responds, instead of waiting for all searches to complete. Cached results render instantly.
- **Sorted results**: After each result arrives, the list re-sorts: available items at top, found-but-unavailable next, errors below, and not-found at bottom. LINK+ is always pinned at the top.
- **Library data model extended**: Libraries now support a `type` field (`'linkplus'`) alongside the existing BiblioCommons `subdomain` format. A `libKey()` helper unifies ID handling.
- **BiblioCommons HTML parser**: Fixed regex to match `<script type="application/json" data-iso-key="_0">` variant used by newer BiblioCommons instances (e.g. MARINet). Skips empty script tag matches.
- **LINK+ row styling**: LINK+ results row has a subtle background to visually distinguish it from individual library rows.
- **Default enabled**: Both SFPL and LINK+ are enabled by default for new users.
- **Version bump to 2.0.0**: Major version for the multi-catalog-system architecture.

## [1.2.2] - 2026-03-16

### Added
- **"Search all by title" button**: After an ISBN search completes, a button appears at the bottom of results to re-search all enabled libraries by book title in one click. Useful when ISBN search yields no results across libraries.
- **Group-level checkbox**: Each region header (e.g. "Bay Area") now has a checkbox that enables/disables all libraries in that region at once. Supports indeterminate state when only some libraries are selected.

### Fixed
- **Removed Berkeley Public Library** from built-in list (BiblioCommons search endpoint non-functional for this library).

## [1.2.0] - 2026-03-16

### Added
- **17 built-in BiblioCommons libraries** from the [LINK+ member list](https://csul.iii.com/screens/members.html), all verified working:
  - **Bay Area (16)**: San Francisco Public Library, San Jose Public Library, Oakland Public Library, Berkeley Public Library, Santa Clara County Library, Santa Clara City Library, San Mateo County Libraries, Alameda County Library, Contra Costa County Library, Palo Alto City Library, Sunnyvale Public Library, Menlo Park Library, Hayward Public Library, Livermore Public Library, Richmond Public Library, Sonoma County Library
  - **San Diego (2)**: San Diego Public Library, San Diego County Library
- **Collapsible library groups** in settings: groups expand/collapse with arrow toggle. Bay Area defaults to expanded. Count badge shows "N/M" enabled per group.
- **Checkbox-based library selection**: Each library has a checkbox to enable/disable it individually. Default: only SFPL enabled.
- **Custom libraries section**: Users can still add non-built-in BiblioCommons libraries in a separate "Custom Libraries" section below the groups.
- **Empty state message**: When no libraries are enabled, shows a helpful prompt to configure via settings.

### Changed
- **Storage model redesigned** for groups support:
  - `bc_enabled` stores a flat array of enabled subdomains (replaces old `bc_libraries` object array)
  - `bc_custom` stores user-added custom libraries separately
  - Automatic one-time migration from v1.x `bc_libraries` format on first run
- **Settings UI fully rewritten** with collapsible groups, checkboxes, and cleaner layout.

## [1.1.1] - 2026-03-16

### Fixed
- **Settings "Add" button invisible in narrow sidebar**: Replaced horizontal flex row with 2-column grid layout so the subdomain/name inputs sit side-by-side and the "+ Add" button spans the full width below them.
- **Stale v1.0 cache missing availability data**: Cache entries from v1.0.0 (which lack `status` field on items) are now automatically invalidated, forcing a fresh fetch that includes availability info.
- **Detail level select cut off**: Added `flex: 1` and `min-width: 0` to the dropdown so it fits within the narrow sidebar.

## [1.1.0] - 2026-03-16

### Fixed
- **Availability data now extracted accurately**: Parse `bib.availability` from BiblioCommons embedded state to get `status`, `totalCopies`, and `availableCopies` per item. Previously only counted bib entries without any availability info.
- **Total result count uses pagination metadata**: Use `state.search.catalogSearch.pagination.count` for the true total instead of counting `entities.bibs` entries (which only contains the first page of results).
- **Non-Latin titles displayed correctly**: Use `multiscriptTitle` when available (e.g. Chinese book titles) instead of the romanized `title` field.

### Changed
- **Detail levels now show copy availability**:
  - Simple: "Available" / "Unavailable" instead of generic "Found"
  - Medium: result count + "X/Y copies available"
  - Detailed: result count + copies + format types (Book, eBook, etc.)
- **Expanded format code map**: Added `LPRINT` (Large Print), `BLURAY` (Blu-ray), `MUSIC_DOWNLOAD` (Music), `BOOK_CD` (Book + CD), `VIDEO_DOWNLOAD` (Video), `MAG_ONLINE` (Magazine), `MN` (Music Score). Fixed `LARGE_PRINT` → `LPRINT` to match BiblioCommons actual codes.

## [1.0.0] - 2026-03-16

### Added
- Initial release of BiblioCommons Search in Douban userscript.
- **Douban page integration**: Runs on `book.douban.com/subject/*`, extracts ISBN from `#info` section and title from `<h1>`.
- **BiblioCommons search**: Fetches library catalog search pages via `GM_xmlhttpRequest`, parses embedded SSR state (`<script data-iso-key="_0">`) to extract search results.
- **Aggregated multi-library search**: Searches all libraries in the user's allowlist in parallel.
- **Results panel**: Injected at top of Douban right sidebar (`.aside`) with per-library result rows.
- **3 detail levels** (user-configurable):
  - Simple: library name + found/not found icon + catalog link
  - Medium: library name + result count + catalog link
  - Detailed: library name + result count + format types (Book, eBook, Audiobook, etc.) + catalog link
- **Title fallback search**: When ISBN search returns no results for a library, a "Search by Title" button triggers an inline title-based search.
- **Library allowlist management**:
  - In-page settings panel toggled by gear icon in panel header
  - Tampermonkey menu command "Manage Libraries" for quick access
  - Add/remove libraries with subdomain + display name
  - Default library: SFPL (`sfpl.bibliocommons.com`)
- **Caching**: Results cached via `GM_getValue`/`GM_setValue` with 24-hour TTL. Refresh button bypasses cache.
- **Error handling**: Graceful error states per library with timeout protection (15s).
