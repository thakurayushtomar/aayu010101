# EARTH JUKEBOX — TEAM OPTIMUS
**NASA Space Apps Challenge 2026 · The Earth Information Jukebox**

> Every location has a story. Every change has a sound.

An accessible browser-based Earth science experience with two clearly separated modes:
1. **Global Data Explorer** — select a point on Earth and explore NASA POWER daily meteorological data.
2. **EIC Jukebox** — play an actual NASA Earth Information Center (EIC) visualization and synthesize sound from sampled video frames.

This is an independent student project and is not endorsed by NASA.

## Run locally

1. Extract the ZIP and open the folder in VS Code.
2. Install/use the VS Code Live Server extension, or run another local static HTTP server.
3. Open `index.html` through that server.
4. Allow internet access for CDN libraries and NASA services.
5. In Global Data Explorer: search a city, click the globe, or enter coordinates; choose year and parameter; click **Load NASA data**.
6. Press **Play yearly sonification** to hear the monthly averages mapped to notes.
7. Open **EIC Jukebox** and press **Play EIC with sound**.

No API key is required for the documented NASA POWER endpoint. Browser audio requires a user gesture.

## EIC mode — challenge-critical

The first wired EIC track is:
- **Title:** Change in Night Lights between 2012 and 2023 – EIC Version
- **NASA SVS ID:** 5313
- **Official page:** https://svs.gsfc.nasa.gov/5313/
- **NASA EIC gallery:** https://svs.gsfc.nasa.gov/gallery/earth-information-center/
- **NASA SVS credit shown on the item:** Kel Elkins
- **Media:** NASA-hosted EIC MP4 listed on the SVS page.

The app samples the current video frame at intervals, calculates average frame luminance from downscaled pixels, and maps it to a pentatonic note. This is a real-time, deterministic sonification derived from the EIC visual frames. The video is muted so the synthesized data sound is heard.

**Cross-origin limitation:** some browsers will block JavaScript from reading pixels from a NASA-hosted video because of media CORS policy. If this happens, download the MP4 from the official NASA SVS item page and use the local EIC video upload field. Local uploaded video frames can be sampled without cross-origin restrictions. The application reports this condition rather than silently playing unrelated music.

**Scientific interpretation:** average frame brightness is a visual feature, not a calibrated radiance measurement. Titles, transitions, map backgrounds and other visual elements can affect it. The interface explicitly discloses this. For a stronger final submission, use the official EIC frame set or its underlying science data and design a region-of-interest or data-value mapping with an explained legend. Do not claim frame brightness equals physical night-light radiance.

Other linked EIC gallery starting points are listed in the app. They are not represented as integrated sonification tracks yet; verify each item’s EIC status, exact media file, third-party media restrictions and credits before adding it.

NASA's Space Apps Navigator explained that the dedicated NASA SVS EIC gallery contains content used on the EIC Hyperwall and is a good starting point; it also cautioned that not every general SVS/Hyperwall visualization should automatically be treated as EIC content. GIBS/Worldview can be supplementary, but EIC visuals should remain central. Source: https://github.com/nasa/spaceapps/discussions/1801

## Global data explorer

NASA POWER Daily Point API:
`https://power.larc.nasa.gov/api/temporal/daily/point`

Parameters:
- `T2M` — 2 m air temperature (°C)
- `RH2M` — 2 m relative humidity (%)
- `PRECTOTCORR` — corrected precipitation (mm/day)
- `WS10M` — wind speed at 10 m (m/s)
- `PS` — surface pressure (kPa)
- `ALLSKY_SFC_SW_DWN` — all-sky surface shortwave downward radiation (MJ/m²/day)

The app displays daily measurements, summary statistics, a chart, monthly averages, and CSV export. Yearly sonification uses monthly means, one note per available month.

### Data limitations
- NASA POWER is gridded analysis-ready data. A cursor coordinate is not a claim that a station exists at that exact point. The grid's spatial support and the product's provenance should be described in the demo.
- Parameter coverage, missing data and update latency vary. The current year can be incomplete. Values marked `-999` are excluded.
- Monthly averages are arithmetic means of available daily values. They are not a substitute for specialist climate analysis.
- The six POWER parameters are supporting global-explorer data; they are not automatically the underlying data for the EIC video.
- Place-name lookup uses OpenStreetMap Nominatim, not NASA. Review its usage policy before deployment: https://operations.osmfoundation.org/policies/nominatim/
- Speech recognition depends on browser support, permissions and potentially network access. Text search and coordinate entry remain alternatives.

## Sonification mapping

### Global explorer
- Temperature: pitch
- Humidity: pitch/timbre
- Precipitation: note duration
- Wind: tempo
- Pressure: pitch intervals
- Solar radiation: volume

The prototype uses a fixed musical scale to keep the sound listenable. It maps relative values within the selected year; it does not imply that one physical unit always equals one semitone across all tracks. The legend and units must be explained to listeners.

### EIC mode
- Frame sampling interval: approximately 280 ms
- Feature: mean luminance across a downscaled frame
- Scale: fixed pentatonic sequence
- Higher sampled brightness: higher note
- Sound generated locally through Web Audio API

## Accessibility implemented
- Skip link and semantic headings/landmarks
- Labels for search, coordinates, selectors and buttons
- Keyboard-accessible controls
- Live announcements for data loading and location changes
- Data table alternative to chart
- Optional browser voice commands and text-to-speech
- EIC video controls and plain-language audio mapping description
- No audio autoplay

### Accessibility testing still required
This code is designed with accessibility in mind but is not certified WCAG-conformant. Test with NVDA/VoiceOver, keyboard only, zoom/reflow, reduced motion settings and real blind/low-vision participants where possible. Ask participants for consent and document feedback and resulting changes. Do not claim user testing until it has actually happened.

## Challenge compliance checklist

- [x] EIC visual content is included as a central, separately labelled mode.
- [x] An actual EIC visual item is identified and credited.
- [x] The EIC video is paired with sound generated from sampled frames.
- [x] EIC sound is generated by the running program, not an AI music generator.
- [x] Mapping explanation and caveats are visible and spoken.
- [x] Global supplementary explorer is clearly separated from the EIC track.
- [x] Keyboard alternatives and accessible text/table content are provided.
- [ ] Test the EIC video in the actual presentation browser; use local official video upload if remote canvas sampling is blocked.
- [ ] Obtain feedback from someone outside the team and, if possible, blind/low-vision users; record what changed.
- [ ] Verify all third-party media restrictions and credits for any additional EIC tracks.
- [ ] Record demo video with clear direct system audio.
- [ ] Publish repository and public deployment URL; test without login.
- [ ] Fill in team members, AI-tool-use disclosure and final submission details required by the official portal.

## Voice command examples
- "Find Delhi"
- "Show temperature"
- "Show humidity"
- "Load data"
- "Play"
- "Stop"
- "Open EIC mode"
- "Read description"

Voice recognition is optional and browser-dependent. Text and keyboard alternatives remain available.

## Deploy
This is a static site. It can be hosted on GitHub Pages, Netlify, or Vercel:
1. Create a public Git repository.
2. Add the contents of this folder.
3. Enable static hosting from the repository root (or import the repository into a static hosting service).
4. Open the public URL in a private/incognito browser to verify it works without login.
5. Test the NASA API, globe library, video, audio and keyboard navigation on the deployed URL.

Do not add API keys, passwords, personal data or private team details to the repository.

## Sources
- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- NASA EIC SVS gallery: https://svs.gsfc.nasa.gov/gallery/earth-information-center/
- NASA SVS 5313 EIC item: https://svs.gsfc.nasa.gov/5313/
- NASA Space Apps Navigator clarification: https://github.com/nasa/spaceapps/discussions/1801
- Globe.gl: https://globe.gl/
- Chart.js: https://www.chartjs.org/
- NASA SVS API help: https://svs.gsfc.nasa.gov/help/

Built by Team Optimus.
