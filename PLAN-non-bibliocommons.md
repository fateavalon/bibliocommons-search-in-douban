# Plan: Supporting Non-BiblioCommons LINK+ Libraries

## Status: IMPLEMENTED (v2.0.0)

**Solution**: Instead of building individual adapters for each catalog system, we search the **LINK+ union catalog** (`csul.iii.com`) directly. This covers ALL ~65 member libraries in a single request.

## Original Problem

Of the ~65 LINK+ member libraries, only 17 use BiblioCommons. The remaining libraries use a variety of other catalog systems. This plan covered how to extend the script to search those systems.

## Catalog Systems Identified

### 1. Polaris (Innovative / CLC)

**Libraries using Polaris:**
- Alameda Free Library (`alameda.polarislibrary.com`)
- Napa Valley College (`napa.polarislibrary.com`)

**Search approach:**
- URL pattern: `https://{host}/polaris/search/searchresults.aspx?ctx=1.1033.0.0.5&type=Keyword&term={isbn}`
- Response: HTML page with search results
- Parse: Look for result count in page, or result item elements
- Feasibility: Medium -- HTML scraping, structure may vary between Polaris instances

### 2. SirsiDynix (Symphony/Enterprise)

**Libraries using SirsiDynix:**
- Amador County Library (`stks.ent.sirsi.net/client/en_US/amador/`)
- Berkeley Public Library (`berkeley.bibliocommons.com` exists but search broken; actual catalog likely SirsiDynix or Innovative)
- Mountain View Public Library
- Several others

**Search approach:**
- URL pattern: `https://{host}/client/en_US/{library}/search/results?qu={isbn}&te=`
- Response: HTML page
- Parse: Result count from page elements
- Feasibility: Medium -- consistent API across SirsiDynix instances

### 3. Innovative Interfaces (Sierra/Millennium/III)

**Libraries using III:**
- Alliant International University (all campuses) (`alliant.iii.com`)
- Whittier College (`library.whittier.edu`)

**Search approach:**
- URL pattern: `https://{host}/search~S0?/i?{isbn}` (ISBN search)
- Response: HTML page with MARC records
- Parse: Check for "No matches found" vs result entries
- Feasibility: Low-Medium -- older system, inconsistent HTML across versions

### 4. Koha (Open Source)

**Libraries possibly using Koha:**
- Some smaller libraries (need to verify case-by-case)

**Search approach:**
- URL pattern: `https://{host}/cgi-bin/koha/opac-search.pl?q=isbn:{isbn}`
- Response: HTML page
- Feasibility: Medium -- open source, well-documented

### 5. LS2 PAC / Other proprietary systems

**Libraries using various systems:**
- Many of the smaller city/county libraries use their own platforms
- Some use shared regional systems

**These need individual investigation.**

## Non-BiblioCommons LINK+ Libraries by Region

### Bay Area (not on BiblioCommons)

| Library | Catalog System | Search URL (needs verification) |
|---------|---------------|-------------------------------|
| Alameda Free Library | Polaris | `alameda.polarislibrary.com` |
| Berkeley Public Library | Innovative? | TBD |
| Belvedere-Tiburon Library | Unknown | TBD |
| Benicia Public Library | Unknown | TBD |
| Larkspur Public Library | Unknown | TBD |
| Marin County Free Library | Unknown | TBD |
| Mill Valley Library | Unknown | TBD |
| Mountain View Public Library | Unknown | TBD |
| Napa County Library | Unknown | TBD |
| Pleasanton Public Library | Unknown | TBD |
| San Anselmo Library | Unknown | TBD |
| San Leandro Public Library | Unknown | TBD |
| San Mateo City Library | Unknown | TBD |
| San Rafael Library | Unknown | TBD |
| Santa Cruz Public Library | Unknown | TBD |
| Sausalito Public Library | Unknown | TBD |
| St. Helena Public Library | Unknown | TBD |
| Solano County Library | Unknown | TBD |

### Central Valley

| Library | Catalog System |
|---------|---------------|
| Amador County Library | SirsiDynix |
| Calaveras County Library | Unknown |
| El Dorado County Library | Unknown |
| Lodi Public Library | Unknown |
| Nevada County Library | Unknown |
| Sacramento Public Library | Unknown |
| Stanislaus County Library | Unknown |
| Stockton San Joaquin County | Unknown |
| Tuolumne County Library | Unknown |
| Yolo County Library | Unknown |

### Southern California

| Library | Catalog System |
|---------|---------------|
| Carlsbad City Library | Unknown |
| Chula Vista Public Library | Unknown |
| Coronado Public Library | BiblioCommons (broken) |
| El Centro Library | Unknown |
| Escondido Public Library | Unknown |
| Glendale Library | Unknown |
| Imperial Public Library | Unknown |
| National City Public Library | Unknown |
| Oceanside Public Library | Unknown |
| Palm Desert Public Library | Unknown |
| Palos Verdes Library District | Unknown |
| Rancho Cucamonga Public Library | Unknown |

### Universities

| Library | Catalog System |
|---------|---------------|
| Alliant International University | III |
| Loyola Marymount University | Unknown |
| Pacific Union College | Unknown |
| Whittier College | III |

## Implementation Strategy

### Phase 1: Identify all catalog systems (Research)

For each "Unknown" library above:
1. Visit their home page
2. Follow their "Search Catalog" link
3. Identify the catalog system from the URL and page structure
4. Document the ISBN search URL pattern

### Phase 2: Group by catalog system and build adapters

Create a pluggable adapter system in the script:

```javascript
const CATALOG_ADAPTERS = {
  bibliocommons: {
    buildUrl(subdomain, query) { ... },
    parseResponse(html) { ... },
  },
  polaris: {
    buildUrl(host, query) { ... },
    parseResponse(html) { ... },
  },
  sirsi: {
    buildUrl(host, library, query) { ... },
    parseResponse(html) { ... },
  },
  // ...
};
```

Each adapter implements:
- `buildUrl(config, query)` -- construct search URL
- `parseResponse(html)` -- extract result count and basic info from HTML

### Phase 3: Extend BUILTIN_GROUPS

Change library entries from BiblioCommons-only format to generic format:

```javascript
// Current (BiblioCommons only):
{ name: 'SFPL', subdomain: 'sfpl' }

// Proposed (multi-system):
{ name: 'SFPL', type: 'bibliocommons', subdomain: 'sfpl' }
{ name: 'Alameda Free Library', type: 'polaris', host: 'alameda.polarislibrary.com' }
{ name: 'Amador County Library', type: 'sirsi', host: 'stks.ent.sirsi.net', path: '/client/en_US/amador/' }
```

### Phase 4: Priority

1. **High priority**: Bay Area non-BiblioCommons libraries (most useful for the user)
2. **Medium priority**: Central Valley libraries
3. **Low priority**: SoCal libraries, Universities

### Risks

- Each catalog system parses differently; HTML structure may change without notice
- Some libraries may block cross-origin requests even with GM_xmlhttpRequest
- Polaris and SirsiDynix may use JavaScript-rendered content not available in raw HTML
- Rate limiting across many simultaneous requests to different domains

### Alternative: LINK+ Direct Search

Instead of searching each library individually, LINK+ itself has a union catalog at `https://csul.iii.com/`. Searching LINK+ directly would cover ALL member libraries in one request. However:
- The LINK+ catalog uses III/Sierra, which has an older HTML interface
- It may not show per-library availability
- It tells you the item exists in the network but you'd still need to request via your home library

This could be a useful **supplementary** approach: show LINK+ union catalog results alongside individual library results.
