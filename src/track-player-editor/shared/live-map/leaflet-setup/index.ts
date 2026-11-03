import "./leaflet-fix";
import "leaflet/dist/leaflet.css";

// import L from "leaflet";

// redeclare module to amend types, maintains compatibility with @types/leaflet
declare module "leaflet" {
  export interface LayerOptions {
    enableDraggableLines?: boolean;
  }
}
