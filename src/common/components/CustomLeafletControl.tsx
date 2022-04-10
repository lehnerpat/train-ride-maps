// based on https://github.com/chris-m92/react-leaflet-custom-control/blob/master/src/Control.tsx
// licensed under MIT License, Copyright (c) 2021 Christopher McBride

import React from "react";
import L from "leaflet";
import ReactDOM from "react-dom";

interface Props {
  position: L.ControlPosition;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const POSITION_CLASSES = {
  bottomleft: "leaflet-bottom leaflet-left",
  bottomright: "leaflet-bottom leaflet-right",
  topleft: "leaflet-top leaflet-left",
  topright: "leaflet-top leaflet-right",
};

const Control = (props: Props): JSX.Element => {
  const [container, setContainer] = React.useState<any>(document.createElement("div"));
  const positionClass = (props.position && POSITION_CLASSES[props.position]) || POSITION_CLASSES.topright;

  React.useEffect(() => {
    const targetDiv = document.getElementsByClassName(positionClass);
    setContainer(targetDiv[0]);
  }, [positionClass]);

  const controlContainer = (
    <div className="leaflet-control" style={props.style}>
      {props.children}
    </div>
  );

  L.DomEvent.disableClickPropagation(container);

  return ReactDOM.createPortal(controlContainer, container);
};

export default Control;
