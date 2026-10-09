# Concepts & data model

This page explains how a "track" is modelled and how the app turns video time into a map position.

## Terminology

- **Track**: one video plus the recorded movement of the train in it. The name follows OSM usage ("track" = record of the path actually taken, like a GPS tracker), not "rail track".
- **Path**: ordered list of coordinates (`lat`/`lng`) along the route, i.e. the line you see on the map. It carries no timing information.
- **Timing point**: a pair `{ t, d }` stating that at video time `t` (seconds) the train was `d` millimetres along the path, measured from the path start.

## Why location and timing are separate

Originally each track point combined time and place, so refining a curve also required inventing time values (and vice versa). Since [#4][issue-4] the two are independent: you can add path points to make curves smoother without touching timing, and add timing points to model speed changes on a straight piece without adding "squiggly" coordinates.

## Track JSON format

Defined in [src/track-models/index.ts](../src/track-models/index.ts) (validated with `io-ts` when loading):

```jsonc
{
  "uuid": "…",
  "title": "…",
  "videoUrl": "https://www.youtube.com/watch?v=…",
  "path": [{ "lat": 0, "lng": 0 }],
  "timingPoints": [{ "t": 0, "d": 0 }] // sorted by t
}
```

- `d` is an integer number of **millimetres** (integers avoid floating-point issues for indexing/comparison). The UI shows metres.
- UUIDs of individual path/timing points exist only in memory (for React keys) and are not serialized.
- Videos are played via `react-player` (YouTube). The player is started at `start: 1` with its own fullscreen button disabled (`fs: 0`), see [VideoPlayer.tsx](../src/track-player/VideoPlayer.tsx).

## How the position is computed

Implemented in [src/track-player/index.tsx](../src/track-player/index.tsx):

1. Find the timing points surrounding the current video time and linearly interpolate the distance `d`.
   - Before the first timing point, the train sits at the first timing point's `d`; after the last one, at the last `d`.
2. Walk along the path by that distance (cumulative segment lengths) and linearly interpolate the coordinate within the segment.
3. No timing points → the map stays at the first path point (or `0,0` for an empty path).

### Distance calculation

[src/geo/distance.ts](../src/geo/distance.ts) uses **spherical geometry** (mean earth radius, `geodesy`-style direct formula), rounded to integer millimetres per segment. Rationale (from [#4][issue-4]): it is fast, and ellipsoidal/Vincenty models would only be more accurate if elevation were known, which OSM data lacks. Measured on the Miyamai + Miyafuku lines, the result deviates about 1 % from Overpass Turbo's `length()`.

## Persistence

- Every change in the track page (timing points, path edits, import, reverse) is **auto-saved to the browser's `localStorage`** under the key `trm_tracks-v2_<track uuid>`.
- The four "example tracks" are bundled JSON files in [src/included-data/](../src/included-data/). Opening a track by UUID first looks in `localStorage`, then in the bundled data. So **once you edit an example track, your local copy permanently shadows the bundled one** (it also shows up under "Tracks saved in browser"). The original can only be seen again by deleting the local copy from the start page.
- Tracks can be exported with the download button in the top bar and re-imported with "Upload file…" on the start page (this saves them into `localStorage`, replacing a track with the same UUID).
- The straight-rails overlay's line/style settings are also stored in `localStorage` (see [StraightRailsOverlaySettings.ts](../src/track-player/straight-rails-overlay/StraightRailsOverlaySettings.ts)). The other view options are in-memory only and reset on reload.

[issue-4]: https://github.com/lehnerpat/train-ride-maps/issues/4
