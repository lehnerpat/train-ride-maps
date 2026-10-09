# Importing a path from OpenStreetMap

The path of a track can currently be obtained by importing OSM XML (editing mode → **Import OSM XML**). The importer ([parse-osm-xml.ts](../src/osm-input/parse-osm-xml.ts)) is deliberately strict. In the track page, failures are only logged to the **browser console** (nothing is shown in the UI) and the path stays unchanged. A developer page at `/osm-import` ([OsmImport.tsx](../src/osm-input/OsmImport.tsx)) runs the same parser and shows errors on screen, which is handy for diagnosing a rejected file (it does not save anything).

## Getting suitable data

1. Find the OSM **relation** of the route (e.g. a train line on openstreetmap.org) and note its ID.
2. Query it with [Overpass Turbo](https://overpass-turbo.eu/) and export as raw OSM XML:

   ```
   rel($RELATION_ID);
   >;
   out body;
   ```

   This returns the relation's ways and all their nodes (flat list). Multiple relations can be combined, e.g. `(rel(1);rel(2););>;out body;`.
3. Save the XML to a file and import it.

## Constraints on the data

The XML must describe **one continuous, non-branching line of ways**:

- Every `<nd>` must have a matching `<node>` in the file.
- No way may be closed (first node ≠ last node).
- A node may appear in at most two ways, and only as the first or last node of each.
- At least one node must join two ways (so a single way is rejected).
- All ways must chain together into one line; unchained ways, branches, or a node used twice in the final path are errors.
- Nodes may only contain `<tag>` children; ways only `<tag>`, `<nd>` and `<bounds>`; tag keys must be unique.

Ways are oriented automatically; the direction of the resulting path comes from the way ordering in the file. Use **Reverse Path** if it runs the wrong way for your video.

Common problems: route relations that are incomplete, outdated, or differ from the route in the video (e.g. a different platform at a multi-platform station). Fix small deviations afterwards with the path editor, or remove unwanted ways from the XML.

## Ideas

- A preview of the imported path before replacing the current one ([#11][issue-11]).
- An interactive route builder to pick ways/nodes instead of requiring a clean relation ([#16][issue-16]).
- Showing import errors in the UI (see [#18][issue-18] discussion).

[issue-11]: https://github.com/lehnerpat/train-ride-maps/issues/11
[issue-16]: https://github.com/lehnerpat/train-ride-maps/issues/16
[issue-18]: https://github.com/lehnerpat/train-ride-maps/issues/18
