import { describe, expect, it } from "vitest";
import {
  findTimingPointProgressState,
  TIMING_POINT_PROGRESS_STATE_NONE,
  TimingPointProgressState,
} from "./usePlayerState";

describe(findTimingPointProgressState.name, () => {
  describe("given an empty list of timing points", () => {
    it("returns 'none'", () => {
      const result = findTimingPointProgressState(0, [], 0.5);
      expect(result).toEqual(TIMING_POINT_PROGRESS_STATE_NONE);
    });
  });

  describe("given a single timing point", () => {
    it("returns 'before-first' when the offset is before the timing point", () => {
      const timingPoints = [{ t: 10, d: 0 }];
      const result = findTimingPointProgressState(0, timingPoints, 0.5);
      expect(result).toEqual({
        type: "before-first",
        first: { t: 10, d: 0, index: 0 },
      } satisfies TimingPointProgressState);
    });

    it("returns 'after-last' when the offset is after the timing point", () => {
      const timingPoints = [{ t: 10, d: 0 }];
      const result = findTimingPointProgressState(20, timingPoints, 0.5);
      expect(result).toEqual({
        type: "after-last",
        last: { t: 10, d: 0, index: 0 },
      } satisfies TimingPointProgressState);
    });

    it.each([
      { scenario: "exactly on", offset: 10 },
      { scenario: "before (within tolerance)", offset: 9.51 },
      { scenario: "after (within tolerance)", offset: 10.49 },
    ])("returns 'exactly-on' when the offset is $scenario the timing point", ({ offset }) => {
      const timingPoints = [{ t: 10, d: 0 }];
      const result = findTimingPointProgressState(offset, timingPoints, 0.5);
      expect(result).toEqual({
        type: "exactly-on",
        previous: undefined,
        current: { t: 10, d: 0, index: 0 },
        next: undefined,
      } satisfies TimingPointProgressState);
    });
  });

  describe("given two timing points", () => {
    it.each([
      { scenario: "exactly on", offset: 10 },
      { scenario: "before (within tolerance)", offset: 9.51 },
      { scenario: "after (within tolerance)", offset: 10.49 },
    ])("returns 'exactly-on' when the offset is $scenario the first timing point", ({ offset }) => {
      const timingPoints = [
        { t: 10, d: 0 },
        { t: 20, d: 0 },
      ];
      const result = findTimingPointProgressState(offset, timingPoints, 0.5);
      expect(result).toEqual({
        type: "exactly-on",
        previous: undefined,
        current: { t: 10, d: 0, index: 0 },
        next: { t: 20, d: 0, index: 1 },
      } satisfies TimingPointProgressState);
    });

    it.each([
      { scenario: "exactly on", offset: 20 },
      { scenario: "before (within tolerance)", offset: 19.51 },
      { scenario: "after (within tolerance)", offset: 20.49 },
    ])("returns 'exactly-on' when the offset is $scenario the second timing point", ({ offset }) => {
      const timingPoints = [
        { t: 10, d: 0 },
        { t: 20, d: 0 },
      ];
      const result = findTimingPointProgressState(offset, timingPoints, 0.5);
      expect(result).toEqual({
        type: "exactly-on",
        previous: { t: 10, d: 0, index: 0 },
        current: { t: 20, d: 0, index: 1 },
        next: undefined,
      } satisfies TimingPointProgressState);
    });

    it("returns 'between' when the offset is between the timing points", () => {
      const timingPoints = [
        { t: 10, d: 0 },
        { t: 20, d: 0 },
      ];
      const result = findTimingPointProgressState(15, timingPoints, 0.5);
      expect(result).toEqual({
        type: "between",
        preceding: { t: 10, d: 0, index: 0 },
        succeeding: { t: 20, d: 0, index: 1 },
      } satisfies TimingPointProgressState);
    });
  });

  describe("given three timing points", () => {
    it.each([
      { scenario: "exactly on", offset: 20 },
      { scenario: "before (within tolerance)", offset: 19.51 },
      { scenario: "after (within tolerance)", offset: 20.49 },
    ])("returns 'exactly-on' when the offset is $scenario the middle timing point", ({ offset }) => {
      const timingPoints = [
        { t: 10, d: 0 },
        { t: 20, d: 0 },
        { t: 30, d: 0 },
      ];
      const result = findTimingPointProgressState(offset, timingPoints, 0.5);
      expect(result).toEqual({
        type: "exactly-on",
        previous: { t: 10, d: 0, index: 0 },
        current: { t: 20, d: 0, index: 1 },
        next: { t: 30, d: 0, index: 2 },
      } satisfies TimingPointProgressState);
    });
  });
});
