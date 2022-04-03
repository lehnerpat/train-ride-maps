import { LatLngLiteral } from "leaflet";
import { FC, useEffect, useState } from "react";
import { MapContainer, Marker, Pane, Polyline, TileLayer } from "react-leaflet";
import styled from "styled-components";
import { distanceInMM } from "../geo/distance";
import { OsmNode, parseOsmXml } from "./parse-osm-xml";
type DistanceWithNode = [number, OsmNode];

export const OsmTest: FC = () => {
  const [osmNodes, setOsmNodes] = useState<OsmNode[]>();

  const [distanceFromStartMap, setDistanceFromStartMap] = useState<DistanceWithNode[]>();
  const [totalDistance, setTotalDistance] = useState<number>();
  const [current, setCurrent] = useState<LatLngLiteral>();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    osmNodesPromise.then((nodes) => {
      setOsmNodes(nodes);
      setCurrent(nodes[0].coord);
      let totalDistance = 0;
      let prevNode = nodes[0];
      let distanceFromStartMap: [number, OsmNode][] = [[0, prevNode]];
      for (const n of nodes.slice(1)) {
        totalDistance += distanceInMM(prevNode.coord, n.coord);
        distanceFromStartMap.push([totalDistance, n]);
        prevNode = n;
      }
      setDistanceFromStartMap(distanceFromStartMap);
      setTotalDistance(totalDistance);
    });
  }, []);

  useEffect(() => {
    if (!distanceFromStartMap || !totalDistance) return;
    const currentDistance = totalDistance * progress;
    const nextIdx = distanceFromStartMap.findIndex((t) => t[0] > currentDistance);
    const next = distanceFromStartMap[nextIdx];
    const prev = distanceFromStartMap[nextIdx - 1];
    const newCurrent = interpolateCoordinates(prev, next, currentDistance);
    setCurrent(newCurrent);
  }, [distanceFromStartMap, totalDistance, progress]);

  return (
    <div style={{ aspectRatio: "16/9", maxHeight: "100vh", margin: "0 auto", position: "relative" }}>
      {!!osmNodes && (
        <>
          <MapContainer center={osmNodes[0].coord} zoom={17} style={{ height: "100%", width: "100%" }}>
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
              <Polyline color="purple" positions={osmNodes.map((n) => n.coord)} />
              {!!current && <Marker position={current} />}
            </AllTrackPointsPane>
          </MapContainer>
          <button
            style={{ position: "absolute", top: 0, right: 0, zIndex: 10000 }}
            onClick={() => setOsmNodes((nodes) => [...(nodes ?? [])].reverse())}
          >
            Reverse path (first={osmNodes && osmNodes[0].id})
          </button>
          <div>
            <label htmlFor="lerpslider">
              <input
                id="lerpslider"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onChange={(e) => setProgress(Number.parseFloat(e.target.value))}
                style={{ width: "80%" }}
              />{" "}
              Progress: {progress.toFixed(3)}
            </label>
          </div>
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

const nodesOffset = 5;
const nodesCount = 20;
const osmNodesPromise = (async () => {
  const r = await fetch("/miyamai_line_miyafuku_line.osm");
  const xml = await r.text();
  console.log("got xml, length", xml.length);
  const osmNodes = parseOsmXml(xml);
  console.log("parsed osm nodes, num", osmNodes.length);
  console.log(`only using osmNodes.slice(${nodesOffset}, ${nodesOffset + nodesCount})`);
  return osmNodes.slice(nodesOffset, nodesOffset + nodesCount);
})();

function interpolateCoordinates(
  prevCoord: DistanceWithNode,
  nextCoord: DistanceWithNode,
  distance: number
): LatLngLiteral {
  if (distance < prevCoord[0] || distance > nextCoord[0])
    throw new Error(`Given offsetSec ${distance} was outside of TimedCoord range [${prevCoord[0]}, ${nextCoord[0]}]`);
  const p = (distance - prevCoord[0]) / (nextCoord[0] - prevCoord[0]);
  const lat = prevCoord[1].coord.lat + p * (nextCoord[1].coord.lat - prevCoord[1].coord.lat);
  const lng = prevCoord[1].coord.lng + p * (nextCoord[1].coord.lng - prevCoord[1].coord.lng);
  return { lat, lng };
}
