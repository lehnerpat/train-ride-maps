import { FC } from "react";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Coordinate } from "ol/coordinate";
import { RMap, ROSM, RLayerVector, RStyle, RFeature, ROverlay } from "rlayers";
import styled from "styled-components";
import "ol/ol.css";
import locationIcon from "./location.svg";

const coords: Record<string, Coordinate> = {
  origin: [2.364, 48.82],
  ArcDeTriomphe: [2.295, 48.8737],
};

export const OlTest: FC = () => {
  return (
    <MapContainer>
      <RMap className="example-map" initial={{ center: fromLonLat(coords.origin), zoom: 11 }} height={"100%"}>
        <ROSM />
        <RLayerVector zIndex={10}>
          <RStyle.RStyle>
            <RStyle.RIcon src={locationIcon} anchor={[0.5, 0.8]} />
          </RStyle.RStyle>
          <RFeature
            geometry={new Point(fromLonLat(coords.ArcDeTriomphe))}
            onClick={(e) =>
              e.map.getView().fit(e.target.getGeometry()!.getExtent(), {
                duration: 250,
                maxZoom: 15,
              })
            }
          >
            <ROverlay className="example-overlay">
              <MyOverlay>
                Arc de Triomphe
                <br />
                <em>&#11017; click to zoom</em>
              </MyOverlay>
            </ROverlay>
          </RFeature>
        </RLayerVector>
      </RMap>
    </MapContainer>
  );
};

const MapContainer = styled.div`
  height: 400px;
  width: 600px;
`;

const MyOverlay = styled.div`
  background: gray;
`;
