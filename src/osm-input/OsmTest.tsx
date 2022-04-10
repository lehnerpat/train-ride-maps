import { FC } from "react";
import { CircleMarker, MapContainer, Marker, Pane, Polyline, TileLayer } from "react-leaflet";
import styled from "styled-components";
import { closestPointOnPath } from "../geo/distance";

export const OsmTest: FC = () => {
  const n0 = { lat: 35.2564587, lng: 139.1564383 };
  const n1 = { lat: 35.2566783, lng: 139.156592 };
  const n2 = { lat: 35.2568798, lng: 139.1567186 };
  const n3 = { lat: 35.2573469, lng: 139.1570074 };
  const path = [n0, n1, n2, n3];

  const c1 = { lat: 35.256584020886294, lng: 139.15733392721452 };
  const p1 = { lat: 35.25684747559839, lng: 139.15669609123353 };

  const c2 = { lat: 35.256091651659, lng: 139.15678726538317 };
  const p2 = { lat: 35.2564570711282, lng: 139.15643692016604 };

  const c3 = { lat: 35.257259482447424, lng: 139.15670774404137 };
  const p3 = { lat: 35.25717769343186, lng: 139.156900949624 };

  const r2 = closestPointOnPath(c2, path)!;

  return (
    <div style={{ aspectRatio: "16/9", maxHeight: "100vh", margin: "0 auto", position: "relative" }}>
      {!!path && (
        <>
          <MapContainer center={path[0]} zoom={17} style={{ height: "100%", width: "100%" }}>
            <BaseTileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              detectRetina
              maxZoom={20}
              minNativeZoom={2}
              maxNativeZoom={18}
            />
            <TileLayer
              url="http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
              attribution='<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
              minZoom={2}
              maxZoom={20}
              maxNativeZoom={18}
              tileSize={256}
              detectRetina
            />
            <AllTrackPointsPane name="all-trackPoints-pane">
              <Polyline color="purple" positions={path} />
              {path.map((p, idx) => (
                <Marker key={idx} position={p} title={`n${idx}`} />
              ))}
            </AllTrackPointsPane>
            <Pane name="other">
              <CircleMarker center={p1} radius={4} />
              <CircleMarker center={p2} radius={4} />
              <CircleMarker center={p3} radius={4} />
              <Marker position={c1} title="c1" />
              <Marker position={c2} title="c2" />
              <Marker position={c3} title="c3" />
              <CircleMarker center={r2.closestOnPath} color="red" />
            </Pane>
          </MapContainer>
        </>
      )}
    </div>
  );
};

const BaseTileLayer = styled(TileLayer)`
  & img {
    filter: grayscale(0.7);
  }
`;

const AllTrackPointsPane = styled(Pane)`
  z-index: 600;
  & img {
    filter: hue-rotate(90deg);
  }
`;

// const nodesOffset = 5;
// const nodesCount = 20;
// const osmNodesPromise = (async () => {
//   const r = await fetch("/miyamai_line_miyafuku_line.osm");
//   const xml = await r.text();
//   console.log("got xml, length", xml.length);
//   const osmNodes = parseOsmXml(xml);
//   console.log("parsed osm nodes, num", osmNodes.length);
//   console.log(`only using osmNodes.slice(${nodesOffset}, ${nodesOffset + nodesCount})`);
//   return osmNodes.slice(nodesOffset, nodesOffset + nodesCount);
// })();

// function interpolateCoordinates(
//   prevCoord: DistanceWithNode,
//   nextCoord: DistanceWithNode,
//   distance: number
// ): LatLngLiteral {
//   if (distance < prevCoord[0] || distance > nextCoord[0])
//     throw new Error(`Given offsetSec ${distance} was outside of TimedCoord range [${prevCoord[0]}, ${nextCoord[0]}]`);
//   const p = (distance - prevCoord[0]) / (nextCoord[0] - prevCoord[0]);
//   const lat = prevCoord[1].coord.lat + p * (nextCoord[1].coord.lat - prevCoord[1].coord.lat);
//   const lng = prevCoord[1].coord.lng + p * (nextCoord[1].coord.lng - prevCoord[1].coord.lng);
//   return { lat, lng };
// }
