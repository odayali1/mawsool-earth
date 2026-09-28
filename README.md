# Mawsool Earth

Country analytics on a living planet. **Phase 01 is Personal Email**: every personal-email record in `emailrev3 - Total Summary.csv`, counted by country.

The globe is [globe.gl](https://github.com/vasturiano/globe.gl) (the same engine as its country choropleth and population examples). Country shapes are Natural Earth 1:110m, public domain, via that project’s example dataset. Heights and color follow the count. Places too small for that map are beacons.

## Run

```bash
npm install
npm run dev
```

## Add the next record phase

Keep the same CSV shape: `Country Code, Country Name, Total Count`.

```bash
node scripts/import-summary.mjs "your-file.csv" your-phase-id --order 2 --code 02 --title "Your Title" --noun "your records" --singular "your record" --kicker "Phase 02" --summary "What this file counts."
```

The new JSON in `src/phases/` shows up as another phase tab. No other wiring.

If you refresh the base map:

```bash
node scripts/prepare-geo.mjs
```

That expects `data/raw/ne_110m_admin_0_countries.geojson` from the globe.gl example datasets.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node: 22

## GitHub

https://github.com/odayali1/mawsool-earth
