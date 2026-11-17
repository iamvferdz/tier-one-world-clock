# tierOne

A public world clock for content creators, showing live local times in key Tier 1 markets: the United States, United Kingdom, Canada, Australia, New Zealand, and Germany. The local time card uses the visitor's device timezone; market clocks use IANA time-zone rules from the browser.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```bash
npm run build
npm run preview
```

## Features

- Live clocks for New York, Los Angeles, London, Toronto, Vancouver, Sydney, Auckland, and Berlin.
- Add clocks for countries worldwide and select a city/time zone where a country has multiple zones.
- Star clocks to keep them in a Favorites section; added clocks and favorites are saved in this browser.
- Toggle seconds on or off for every clock; the preference is saved in this browser.
- Switch between dark and light themes; the preference is saved in this browser.
- View a clearly labeled upload-time heuristic in a 24-hour chart, choose a country/time zone and weekday, save favorite upload markets in this browser, and follow the official YouTube Audience report link for channel-specific data.
- Compare the selected market's live time with your own local time on the upload planner.
- View a live day/night map on the homepage or open its full-page, interactive view to inspect countries and their local times.
- See continent names on the full day/night map.
- Use the map page's UTC timeline to preview the day/night boundary at another time, or return to live time; its longitude ruler shows approximate solar times around the world.
- See favorited clock names on the map; locations for clocks without a known city position use an approximate country-center marker.
- Optionally mark your precise location on the map after granting browser location permission; coordinates are not saved or sent.
- A local time card based on the visitor's device timezone.
- Automatic daylight-saving adjustments.
- No account, sign-in, backend, or YouTube integration is required.
- Find VFERDZ's membership, social, GitHub, and contact links in the shared footer; the business-inquiry form opens a prefilled email draft in the visitor's email app.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

