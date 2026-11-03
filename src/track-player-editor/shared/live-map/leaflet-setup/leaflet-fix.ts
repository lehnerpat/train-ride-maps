import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// This fixes leaflet's default marker image being broken for retina (=2x)
// by leaflet's path manipulation logic being incompatible with the bundler's asset URL replacement.
// Source: https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
