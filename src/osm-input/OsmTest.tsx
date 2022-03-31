import { FC, useEffect, useState } from "react";
import { MapContainer, Pane, Polyline, TileLayer } from "react-leaflet";
import styled from "styled-components";
import { OsmNode, parseOsmXml } from "./parse-osm-xml";

export const OsmTest: FC = () => {
  const [osmNodes, setOsmNodes] = useState<OsmNode[]>();

  useEffect(() => {
    osmNodesPromise.then((nodes) => setOsmNodes(nodes));
  });

  return (
    <div style={{ aspectRatio: "16/9", maxHeight: "100vh", margin: "0 auto" }}>
      <MapContainer center={{ lat: 35.5282457, lng: 135.271744 }} zoom={17} style={{ height: "100%", width: "100%" }}>
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
          {!!osmNodes && <Polyline color="purple" positions={osmNodes.map((n) => n.coord)} />}
        </AllTrackPointsPane>
      </MapContainer>
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

const osmNodesPromise = (async () => {
  const r = await fetch("/miyamai_line.osm");
  const xml = await r.text();
  console.log("got xml, length", xml.length);
  const osmNodes = parseOsmXml(xml);
  console.log("parsed osm nodes, num", osmNodes.length);
  return osmNodes;
})();
