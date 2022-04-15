import { createContext, FC, ReactNode, RefObject, useMemo, useRef } from "react";
import styled, { css } from "styled-components";
import { pickState, usePickedState, UseState } from "../../common-components/state-utils";
import { StraightRailsOverlayViewOptions } from "../ViewOptions";
import {
  PercentageLine,
  PercentagePoint,
  StraightRailsOverlaySettings,
  useStraightRailsOverlaySettingsState,
} from "./StraightRailsOverlaySettings";

interface StraightRailsOverlayProps {
  optionsState: UseState<StraightRailsOverlayViewOptions>;
}

const EditingContext = createContext({ isEditing: false });

export const StraightRailsOverlay: FC<StraightRailsOverlayProps> = ({ optionsState: [options, setOptions] }) => {
  const settingsState = useStraightRailsOverlaySettingsState();

  return !options.isOn ? null : (
    <EditingContext.Provider value={{ isEditing: options.isEditing }}>
      <StraightTracksOverlayContainer className="tracksoverlay" isEditing={options.isEditing}>
        <OverlayArea settingsState={settingsState} />
        {options.isEditing && (
          <>
            <EditingControls settingsState={settingsState} />
            <FinishEditingButton onClick={() => setOptions((prev) => ({ ...prev, isEditing: false }))} />
          </>
        )}
      </StraightTracksOverlayContainer>
    </EditingContext.Provider>
  );
};

interface EditingControlsProps {
  settingsState: UseState<StraightRailsOverlaySettings>;
}
const EditingControls: FC<EditingControlsProps> = ({ settingsState }) => {
  const [settings] = settingsState;
  const lineColorState = pickState(settingsState, "lineColorRgbHex");
  const lineOpacityState = pickState(settingsState, "lineOpacityPercent");
  const lineWidthState = pickState(settingsState, "lineWidthPx");
  const backgroundColorState = pickState(settingsState, "backgroundColorRgbHex");
  const backgroundOpacityState = pickState(settingsState, "backgroundOpacityPercent");

  return (
    <EditingControlsBoxContainer>
      <EditingControlSpannedRow>
        <SectionHeading style={{ marginTop: 0 }}>Line Coordinates</SectionHeading>
      </EditingControlSpannedRow>
      <EditingControlLeftCell>Line 1</EditingControlLeftCell>
      <EditingControlLineCoords line={settings.line1} />
      <EditingControlLeftCell>Line 2</EditingControlLeftCell>
      <EditingControlLineCoords line={settings.line2} />
      <EditingControlSpannedRow>
        <SectionHeading>Line style:</SectionHeading>
      </EditingControlSpannedRow>
      <EditingControlColor label="Color:" valueState={lineColorState} />
      <EditingControlRange label="Opacity:" valueState={lineOpacityState} min={0} max={100} valueSuffix="%" />
      <EditingControlRange label="Width:" valueState={lineWidthState} min={1} max={10} valueSuffix="px" />
      <EditingControlSpannedRow>
        <SectionHeading>Overlay background (while editing)</SectionHeading>
      </EditingControlSpannedRow>
      <EditingControlColor label="Color:" valueState={backgroundColorState} />
      <EditingControlRange label="Opacity:" valueState={backgroundOpacityState} min={0} max={100} valueSuffix="%" />
    </EditingControlsBoxContainer>
  );
};

interface PointInfo {
  ref: RefObject<SVGEllipseElement>;
  onDrag(p: Point): void;
  onDrop(p: Point): void;
}

interface MovableLineInfo {
  lineRef: RefObject<SVGLineElement>;
  fromPi: PointInfo;
  toPi: PointInfo;
}

function useMovableLineRef(svgRef: RefObject<SVGSVGElement>, lineState: UseState<PercentageLine>): MovableLineInfo {
  const [, setLine] = lineState;
  const lineRef = useRef<SVGLineElement>(null);
  const fromRef = useRef<SVGEllipseElement>(null);
  const toRef = useRef<SVGEllipseElement>(null);
  const fromPi = {
    ref: fromRef,
    onDrag(p: Point) {
      const line = lineRef.current;
      const from = fromRef.current;
      if (!line || !from) return;
      line.x1.baseVal.value = p.x;
      line.y1.baseVal.value = p.y;
      from.cx.baseVal.value = p.x;
      from.cy.baseVal.value = p.y;
    },
    onDrop(p: Point) {
      const svg = svgRef.current;
      if (!svg) return;
      const r = { x: (100 * p.x) / svg.clientWidth, y: (100 * p.y) / svg.clientHeight };
      setLine((prevLine) => ({ ...prevLine, from: r }));
    },
  };
  const toPi = {
    ref: toRef,
    onDrag(p: PercentagePoint) {
      const line = lineRef.current;
      const to = toRef.current;
      if (!line || !to) return;
      line.x2.baseVal.value = p.x;
      line.y2.baseVal.value = p.y;
      to.cx.baseVal.value = p.x;
      to.cy.baseVal.value = p.y;
    },
    onDrop(p: PercentagePoint) {
      const svg = svgRef.current;
      if (!svg) return;
      const r = { x: (100 * p.x) / svg.clientWidth, y: (100 * p.y) / svg.clientHeight };
      setLine((prevLine) => ({ ...prevLine, to: r }));
    },
  };
  return { lineRef, fromPi, toPi };
}

function opacityPercentToAlphaHex(opacityPercent: number): string {
  if (opacityPercent < 0 || opacityPercent > 100) throw Error(`Opacity ${opacityPercent} is out of range 0-100`);
  const alphaByte = Math.round((opacityPercent * 255) / 100.0);
  const alphaStr = alphaByte.toString(16);
  return alphaStr.length === 1 ? "0" + alphaStr : alphaStr;
}
function makeHexAlphaColor(backgroundColor: string, backgroundOpacity: number) {
  return backgroundColor + opacityPercentToAlphaHex(backgroundOpacity);
}

interface OverlayAreaProps {
  settingsState: UseState<StraightRailsOverlaySettings>;
}

const OverlayArea: FC<OverlayAreaProps> = ({ settingsState }) => {
  const line1State = usePickedState(settingsState, "line1");
  const line2State = usePickedState(settingsState, "line2");

  const svgRef = useRef<SVGSVGElement>(null);
  const movableLine1Ref = useMovableLineRef(svgRef, line1State);
  const movableLine2Ref = useMovableLineRef(svgRef, line2State);
  const unmanaged = useOverlay(svgRef, () => [movableLine1Ref, movableLine2Ref].flatMap((r) => [r.fromPi, r.toPi]));

  const [settings] = settingsState;
  const [line1] = line1State;
  const [line2] = line2State;

  const backgroundColorCss = makeHexAlphaColor(settings.backgroundColorRgbHex, settings.backgroundOpacityPercent);
  const lineColorCss = makeHexAlphaColor(settings.lineColorRgbHex, settings.lineOpacityPercent);
  const lineWidth = settings.lineWidthPx;

  return (
    <EditingContext.Consumer>
      {({ isEditing }) => (
        <OverlayAreaSvg
          ref={svgRef}
          onMouseDown={isEditing ? unmanaged.startDrag : undefined}
          onMouseMove={isEditing ? unmanaged.drag : undefined}
          onMouseUp={isEditing ? unmanaged.endDrag : undefined}
          onMouseLeave={isEditing ? unmanaged.endDrag : undefined}
          isEditing={isEditing}
          style={isEditing ? { background: backgroundColorCss } : {}}
        >
          <MovableOverlayLine line={line1} lineInfo={movableLine1Ref} color={lineColorCss} lineWidth={lineWidth} />
          <MovableOverlayLine line={line2} lineInfo={movableLine2Ref} color={lineColorCss} lineWidth={lineWidth} />
        </OverlayAreaSvg>
      )}
    </EditingContext.Consumer>
  );
};

function useOverlay(svgRef: RefObject<SVGSVGElement>, getPointInfos: () => PointInfo[]) {
  const ref = useMemo(() => {
    const pointInfos = getPointInfos();
    console.log("creating x");
    const x = {
      currentDrag: undefined as undefined | { el: SVGGraphicsElement; pi: PointInfo },
      startDrag(e: React.MouseEvent<SVGGraphicsElement, MouseEvent>) {
        const svg = svgRef.current;
        const el = e.target as SVGGraphicsElement;
        if (!svg || !el.classList.contains("draggable")) return;
        const pi = pointInfos.find((pi) => pi.ref.current === el);
        if (!pi) return;

        x.currentDrag = { el, pi };
      },
      drag(e: React.MouseEvent<SVGGraphicsElement, MouseEvent>) {
        const svg = svgRef.current;
        if (!svg || !x.currentDrag) return;
        e.preventDefault();
        const coord = toSvgCoords(svg, e);
        x.currentDrag.pi.onDrag(coord);
      },
      endDrag(e: React.MouseEvent<SVGGraphicsElement, MouseEvent>) {
        const svg = svgRef.current;
        if (svg && x.currentDrag) {
          const coord = toSvgCoords(svg, e);
          x.currentDrag.pi.onDrop(coord);
        }
        x.currentDrag = undefined;
      },
    };
    return x;
  }, [svgRef, getPointInfos]);
  return ref;
}

interface MovableOverlayLineProps {
  line: PercentageLine;
  lineInfo: MovableLineInfo;
  color: string;
  lineWidth: number;
}

const MovableOverlayLine: FC<MovableOverlayLineProps> = ({ line, lineInfo, color, lineWidth }) => {
  return (
    <EditingContext.Consumer>
      {({ isEditing }) => (
        <g>
          <line
            x1={`${line.from.x}%`}
            y1={`${line.from.y}%`}
            x2={`${line.to.x}%`}
            y2={`${line.to.y}%`}
            stroke={color}
            strokeWidth={lineWidth}
            ref={lineInfo.lineRef}
          />

          {isEditing && (
            <>
              <DragHandleEllipse
                cx={`${line.from.x}%`}
                cy={`${line.from.y}%`}
                rx={lineWidth + 5}
                ry={lineWidth + 5}
                fill={color}
                className="draggable"
                ref={lineInfo.fromPi.ref}
              />
              <DragHandleEllipse
                cx={`${line.to.x}%`}
                cy={`${line.to.y}%`}
                rx={lineWidth + 5}
                ry={lineWidth + 5}
                fill={color}
                className="draggable"
                ref={lineInfo.toPi.ref}
              />
            </>
          )}
        </g>
      )}
    </EditingContext.Consumer>
  );
};

function toSvgCoords(svg: SVGSVGElement, evt: { clientX: number; clientY: number }): Point {
  const ctm = svg.getScreenCTM();
  if (!ctm) throw new Error();
  return {
    x: (evt.clientX - ctm.e) / ctm.a,
    y: (evt.clientY - ctm.f) / ctm.d,
  };
}

interface Point {
  x: number;
  y: number;
}

const DragHandleEllipse = styled.ellipse`
  cursor: move;
`;
const StraightTracksOverlayContainer = styled.div<{ isEditing: boolean }>`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 1000;
  ${(props) =>
    !props.isEditing &&
    css`
      pointer-events: none;
    `}
`;

const OverlayAreaSvg = styled.svg<{ isEditing: boolean }>`
  width: 100%;
  aspect-ratio: 16 / 9;
  ${(props) =>
    props.isEditing &&
    css`
      pointer-events: initial;
    `}
`;

const FinishEditingButton: FC<{ onClick: React.MouseEventHandler<HTMLButtonElement> }> = ({ onClick }) => (
  <FinishEditingButtonBtn onClick={onClick}>
    Finish
    <br />
    editing
  </FinishEditingButtonBtn>
);
const FinishEditingButtonBtn = styled.button`
  position: absolute;
  top: 0;
  right: 0;
`;

const EditingControlsBoxContainer = styled.div`
  margin: 0 auto;
  width: fit-content;
  max-width: 100%;
  padding: 1em;
  background: #333;
  border: 1px solid #444;
  border-top: none;
  display: grid;
  grid-template-columns: [left] auto [mid] auto auto [right];
`;

const EditingControlSpannedRow = styled.div`
  grid-column: left / right;
`;
const EditingControlLeftCell = styled.div`
  grid-column: 1;
`;
const EditingControlMidCell = styled.div`
  grid-column: 2;
  text-align: center;
`;
const EditingControlRightCell = styled.div`
  grid-column: 3;
`;

const EditingControlRow: FC<{ left: ReactNode; mid: ReactNode; right: ReactNode }> = ({ left, mid, right }) => (
  <>
    <EditingControlLeftCell>{left}</EditingControlLeftCell>
    <EditingControlMidCell>{mid}</EditingControlMidCell>
    <EditingControlRightCell>{right}</EditingControlRightCell>
  </>
);

const EditingControlColor: FC<{ label: string; valueState: UseState<string> }> = ({
  label,
  valueState: [value, setValue],
}) => (
  <EditingControlRow
    left={label}
    mid={<input type="color" value={value} onChange={(e) => setValue(e.target.value)} />}
    right={value}
  />
);

const EditingControlRange: FC<{
  label: string;
  valueState: UseState<number>;
  min?: number;
  max?: number;
  step?: number;
  valueSuffix?: string;
}> = ({ label, valueState: [value, setValue], min, max, step, valueSuffix }) => (
  <EditingControlRow
    left={label}
    mid={
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number.parseFloat(e.target.value))}
      />
    }
    right={`${value}${valueSuffix ?? ""}`}
  />
);

const EditingControlLineCoords: FC<{ line: PercentageLine }> = ({ line }) => (
  <EditingControlLineCoordsContainer>
    <EditingControlLineCoordsCell>
      <DisplayPercentagePoint point={line.from} />
    </EditingControlLineCoordsCell>
    <EditingControlLineCoordsCell>→</EditingControlLineCoordsCell>
    <EditingControlLineCoordsCell>
      <DisplayPercentagePoint point={line.to} />
    </EditingControlLineCoordsCell>
  </EditingControlLineCoordsContainer>
);
const EditingControlLineCoordsContainer = styled.div`
  grid-column: mid / right;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
`;
const EditingControlLineCoordsCell = styled.div`
  text-align: center;
  padding: 0 2px;
`;

function formatPercentagePointNumber(n: number): string {
  return n.toFixed(1) + "%";
}
const DisplayPercentagePoint: FC<{ point: PercentagePoint }> = ({ point: { x, y } }) => (
  <>
    ({formatPercentagePointNumber(x)},{formatPercentagePointNumber(y)})
  </>
);

const SectionHeading = styled.h4`
  margin: 0.8em 0 0.4em;
`;
