import { createContext, FC, RefObject, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { UseState } from "../common-components/state-utils";
import { StraightTrackOverlayOptions } from "./ViewOptions";

interface PercentagePoint {
  x: number;
  y: number;
}
interface PercentageLine {
  from: PercentagePoint;
  to: PercentagePoint;
}

interface StraightTracksOverlayProps {
  optionsState: UseState<StraightTrackOverlayOptions>;
}

const EditingContext = createContext({ isEditing: false });

export const StraightTracksOverlay: FC<StraightTracksOverlayProps> = ({ optionsState: [options, setOptions] }) => {
  const line1State = useState<PercentageLine>({ from: { x: 30, y: 95 }, to: { x: 40, y: 5 } });
  const line2State = useState<PercentageLine>({ from: { x: 50, y: 95 }, to: { x: 45, y: 5 } });

  return !options.isOn ? null : (
    <EditingContext.Provider value={{ isEditing: options.isEditing }}>
      <StraightTracksOverlayContainer className="tracksoverlay" isEditing={options.isEditing}>
        <OverlayArea line1State={line1State} line2State={line2State} />
        {/* <div style={{ background: "gray" }}>Test</div> */}
        {options.isEditing && (
          <FinishEditingButton onClick={() => setOptions((prev) => ({ ...prev, isEditing: false }))}>
            Finish
            <br />
            editing
          </FinishEditingButton>
        )}
      </StraightTracksOverlayContainer>
    </EditingContext.Provider>
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

interface OverlayAreaProps {
  line1State: UseState<PercentageLine>;
  line2State: UseState<PercentageLine>;
}

const OverlayArea: FC<OverlayAreaProps> = ({ line1State, line2State }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const movableLine1Ref = useMovableLineRef(svgRef, line1State);
  const movableLine2Ref = useMovableLineRef(svgRef, line2State);
  const unmanaged = useOverlay(svgRef, () => [movableLine1Ref, movableLine2Ref].flatMap((r) => [r.fromPi, r.toPi]));

  const [line1] = line1State;
  const [line2] = line2State;
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
        >
          <MovableOverlayLine line={line1} lineInfo={movableLine1Ref} color="purple" />
          <MovableOverlayLine line={line2} lineInfo={movableLine2Ref} color="purple" />
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

const MovableOverlayLine: FC<{ line: PercentageLine; lineInfo: MovableLineInfo; color: string }> = ({
  line,
  lineInfo,
  color,
}) => {
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
            ref={lineInfo.lineRef}
          />

          {isEditing && (
            <>
              <DragHandleEllipse
                cx={`${line.from.x}%`}
                cy={`${line.from.y}%`}
                rx="5"
                ry="5"
                fill={color}
                className="draggable"
                ref={lineInfo.fromPi.ref}
              />
              <DragHandleEllipse
                cx={`${line.to.x}%`}
                cy={`${line.to.y}%`}
                rx="5"
                ry="5"
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
  pointer-events: initial;
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
      background: rgba(255, 255, 255, 0.5);
      /* pointer-events: initial; */
    `}
`;

const FinishEditingButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
`;
