# Known limitations, ideas & development notes

Collated from the GitHub issues/PRs (state checked against the code on the current `main`). Issue numbers refer to <https://github.com/lehnerpat/train-ride-maps/issues>.

## Open ideas / missing features (all still unimplemented)

- [#1][issue-1]: Auto-rotate map so the direction of travel is up. Leaflet can't rotate; OpenLayers+rlayers was tried ([commit 8385069][commit-ol]) but needs much more work; plan was Leaflet non-interactive + CSS rotation, or a rotation plugin
- [#2][issue-2]: Show station info: previous/next station, next stop, time to next stop / departure / final stop (needs data model extensions; split into steps)
- [#9][issue-9]: Edit the track title (shown read-only in Video Info)
- [#10][issue-10]: Keyboard shortcuts for editing (play/pause/seek, add timing point) that work while the map has focus; maybe a "capture input" toggle
- [#11][issue-11]: Preview imported OSM path before replacing the path
- [#12][issue-12]: Create a path from scratch in the app (currently empty tracks need an import)
- [#13][issue-13]: "Download as file" button per track on the start page (exists only inside the track page)
- [#14][issue-14]: Mark example tracks that are shadowed by a local copy
- [#15][issue-15]: Show video duration in Video Info (hint: `onDurationChange` of `react-player`, state in `TrackPlayer`)
- [#16][issue-16]: Interactive OSM route builder (select ways/nodes)
- [#17][issue-17], [#18][issue-18], [PR #21][pr-21], [PR #22][pr-22]: Documentation (this folder partly addresses it; the PRs are unmerged drafts, [#22][pr-22] only adds screenshots)
- [#19][issue-19]: Custom train marker instead of the default pin, ideally rotating with direction of travel

Other known gaps seen in the code: OSM import errors are not shown in the track page; existing timing points can't be edited, only deleted; deleting a local track has no confirmation.

## Resolved issues (for context)

- [#3][issue-3]: Fullscreen: implemented (video + map together; not on iPhone).
- [#4][issue-4]: Separate path and timing: implemented, see [concepts.md](concepts.md).
- [#5][issue-5]: Commit ID in footer: implemented ("Built from commit …").
- [#6][issue-6]: Timing point markers on the path: implemented (green circles).
- [#7][issue-7]: Path geometry editing via [Leaflet.DraggableLines](https://github.com/FacilMap/Leaflet.DraggableLines) chosen over geoman; implemented, performance could improve.
- [#8][issue-8]: Material UI migration: done.
- [#20][issue-20]: DraggableLines broken in production: caused by the old CRA/webpack ES5 production output (`browserslist` made prod transpile classes to ES5, which broke the plugin's ES6-class + Leaflet `Handler` inheritance). After the Vite migration the production build works (verified: drag handles appear, no console errors).

## Development notes

- Node 26, npm: `npm install`, `npm start`, `npm test -- --run`, `npm run typecheck`, `npm run build` (output in `build/`).
- Video playback uses `react-player` 3 (YouTube via `youtube-video-element`); the former `postinstall` patch for repeated reloads is no longer needed.
- Dev-only routes: `/osm-test` and `/osm-import` (OSM parser test pages).
- Distance-function benchmarks and rationale are in [src/geo/distance.ts](../src/geo/distance.ts).

[commit-ol]: https://github.com/lehnerpat/train-ride-maps/commit/83850696a5b08f919b3f0d0b8939b699201138e0
[issue-1]: https://github.com/lehnerpat/train-ride-maps/issues/1
[issue-2]: https://github.com/lehnerpat/train-ride-maps/issues/2
[issue-3]: https://github.com/lehnerpat/train-ride-maps/issues/3
[issue-4]: https://github.com/lehnerpat/train-ride-maps/issues/4
[issue-5]: https://github.com/lehnerpat/train-ride-maps/issues/5
[issue-6]: https://github.com/lehnerpat/train-ride-maps/issues/6
[issue-7]: https://github.com/lehnerpat/train-ride-maps/issues/7
[issue-8]: https://github.com/lehnerpat/train-ride-maps/issues/8
[issue-9]: https://github.com/lehnerpat/train-ride-maps/issues/9
[issue-10]: https://github.com/lehnerpat/train-ride-maps/issues/10
[issue-11]: https://github.com/lehnerpat/train-ride-maps/issues/11
[issue-12]: https://github.com/lehnerpat/train-ride-maps/issues/12
[issue-13]: https://github.com/lehnerpat/train-ride-maps/issues/13
[issue-14]: https://github.com/lehnerpat/train-ride-maps/issues/14
[issue-15]: https://github.com/lehnerpat/train-ride-maps/issues/15
[issue-16]: https://github.com/lehnerpat/train-ride-maps/issues/16
[issue-17]: https://github.com/lehnerpat/train-ride-maps/issues/17
[issue-18]: https://github.com/lehnerpat/train-ride-maps/issues/18
[issue-19]: https://github.com/lehnerpat/train-ride-maps/issues/19
[issue-20]: https://github.com/lehnerpat/train-ride-maps/issues/20
[pr-21]: https://github.com/lehnerpat/train-ride-maps/pull/21
[pr-22]: https://github.com/lehnerpat/train-ride-maps/pull/22
