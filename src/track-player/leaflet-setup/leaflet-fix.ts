import L from "leaflet";

// This fixes leaflet's default marker image being broken for retina (=2x)
// by leaflet's path manipulation logic being incompatible with webpack's data-uri replacement.
// Source: https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
