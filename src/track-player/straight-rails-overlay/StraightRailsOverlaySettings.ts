import { useCallback, useMemo, useState } from "react";
import { LocalStorageService } from "../../common/components/LocalStorageService";
import { SetState, UseState } from "../../common-components/state-utils";
import { isFunction } from "../../common-components/type-helpers";

export interface PercentagePoint {
  x: number;
  y: number;
}
export interface PercentageLine {
  from: PercentagePoint;
  to: PercentagePoint;
}

export interface StraightRailsOverlaySettings {
  line1: PercentageLine;
  line2: PercentageLine;
  lineColorRgbHex: string;
  lineOpacityPercent: number;
  lineWidthPx: number;
  backgroundColorRgbHex: string;
  backgroundOpacityPercent: number;
}

export const DefaultStraightRailsOverlaySettings: Readonly<StraightRailsOverlaySettings> = Object.freeze({
  line1: Object.freeze({ from: Object.freeze({ x: 30, y: 95 }), to: Object.freeze({ x: 40, y: 50 }) }),
  line2: Object.freeze({ from: Object.freeze({ x: 50, y: 95 }), to: Object.freeze({ x: 45, y: 50 }) }),
  lineColorRgbHex: "#40e811",
  lineOpacityPercent: 100,
  lineWidthPx: 1,
  backgroundColorRgbHex: "#FFFFFF",
  backgroundOpacityPercent: 50,
});

export const StraightRailsOverlaySettingsStorage = new LocalStorageService(
  "trm_straight-rails-overlay-settings",
  DefaultStraightRailsOverlaySettings,
  {}
);

export const useStraightRailsOverlaySettingsState: () => UseState<StraightRailsOverlaySettings> = () => {
  const [settings, setSettings] = useState(StraightRailsOverlaySettingsStorage.load());
  const setSettingsWithSave: SetState<StraightRailsOverlaySettings> = useCallback(
    (newState) =>
      setSettings((prevSettings) => {
        const newSettings = isFunction(newState)
          ? (newState as (prev: Readonly<StraightRailsOverlaySettings>) => StraightRailsOverlaySettings)(prevSettings)
          : newState;
        return StraightRailsOverlaySettingsStorage.save(newSettings);
      }),
    [setSettings]
  );
  return useMemo(() => [settings, setSettingsWithSave], [settings, setSettingsWithSave]);
};
