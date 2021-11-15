import * as BT from "./BaseTypes";
import * as TRC from "./TimeRangeCollection";
import {TimeRangeCollection} from "./TimeRangeCollection";
import * as TRT from "./TimeRange.test";

/* eslint-disable camelcase, max-len*/
export const name = "TimeRangeCollectionTests";

// TESTS for isContinuous(...)
test("checks that determining continuity of TimeRanges using isContinuous(...) works properly", () => {
  let timeRanges = ((undefined as unknown) as Array<BT.ITimeRange>);
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  timeRanges = ((null as unknown) as Array<BT.ITimeRange>);
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  timeRanges = [];
  expect(TRC.isContinuous(timeRanges)).toBe(false);

  timeRanges = [TRT.TimeRange_MIN, TRT.TimeRange_Early, TRT.TimeRange_Middle, TRT.TimeRange_Late, TRT.TimeRange_MAX];
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  timeRanges = [TRT.TimeRange_MAX, TRT.TimeRange_MIN, TRT.TimeRange_Early, TRT.TimeRange_Middle, TRT.TimeRange_Late];
  expect(TRC.isContinuous(timeRanges)).toBe(false);

  timeRanges = [TRT.TimeRange_MIN_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Late_MAX];
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  timeRanges = [TRT.TimeRange_Late_MAX, TRT.TimeRange_MIN_Early, TRT.TimeRange_Early_Middle];
  expect(TRC.isContinuous(timeRanges)).toBe(false);

  timeRanges = [TRT.TimeRange_MIN_Early, TRT.TimeRange_Middle_Late, TRT.TimeRange_Late_MAX];
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  timeRanges = [TRT.TimeRange_Late_MAX, TRT.TimeRange_MIN_Early, TRT.TimeRange_Middle_Late];
  expect(TRC.isContinuous(timeRanges)).toBe(false);

  timeRanges = [TRT.TimeRange_MIN_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Middle_Late, TRT.TimeRange_Late_MAX];
  expect(TRC.isContinuous(timeRanges)).toBe(true);
  timeRanges = [TRT.TimeRange_Late_MAX, TRT.TimeRange_MIN_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Middle_Late];
  expect(TRC.isContinuous(timeRanges)).toBe(true);

  timeRanges = [TRT.TimeRange_MIN, TRT.TimeRange_MIN_Early, TRT.TimeRange_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Middle, TRT.TimeRange_Middle_Late, TRT.TimeRange_Late, TRT.TimeRange_Late_MAX, TRT.TimeRange_MAX];
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  expect(TRC.isContinuous(timeRanges, false)).toBe(false);
  expect(TRC.isContinuous(timeRanges, true)).toBe(true);
  timeRanges = [TRT.TimeRange_MAX, TRT.TimeRange_MIN, TRT.TimeRange_MIN_Early, TRT.TimeRange_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Middle, TRT.TimeRange_Middle_Late, TRT.TimeRange_Late, TRT.TimeRange_Late_MAX];
  expect(TRC.isContinuous(timeRanges)).toBe(false);
  expect(TRC.isContinuous(timeRanges, false)).toBe(false);
  expect(TRC.isContinuous(timeRanges, true)).toBe(true);
});

// TESTS for get(...)
test("checks that getting TimeRange from TimeRangeCollection using get(...) works properly", () => {
  const timeRanges = [TRT.TimeRange_MIN_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Middle_Late, TRT.TimeRange_Late_MAX];
  const timeRangeCollection = new TimeRangeCollection(timeRanges);

  // TESTS for get(...) passing number
  expect(timeRangeCollection.get(0)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(1)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(2)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(3)).toBe(TRT.TimeRange_Late_MAX);

  // TESTS for get(...) passing string
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.orderableKey)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.orderableKey)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.orderableKey)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.orderableKey)).toBe(TRT.TimeRange_Late_MAX);

  // TESTS for get(...) passing Timestamp
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.start)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.end)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.start)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.end)).toBe(TRT.TimeRange_Late_MAX);

  // TESTS for get(...) passing Timestamp
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start, true)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end, true)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start, true)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end, true)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.start, true)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.end, true)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.start, true)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.end, true)).toBe(TRT.TimeRange_Late_MAX);

  // TESTS for get(...) passing Timestamp
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start, false)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end, false)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start, false)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end, false)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.start, false)).toBe(TRT.TimeRange_Middle_Late);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_Late.end, false)).toBe(TRT.TimeRange_Late_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.start, false)).toBe(TRT.TimeRange_Late_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Late_MAX.end, false)).toBe(TRT.TimeRange_Late_MAX);
});

// TESTS for split(...)
test("checks that splitting TimeRange in TimeRangeCollection using split(...) works properly", () => {
  const timeRanges = [TRT.TimeRange_MIN_MAX];
  const timeRangeCollection = new TimeRangeCollection(timeRanges);

  expect(timeRangeCollection.count).toBe(1);
  expect(timeRangeCollection.get(0)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.orderableKey)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.start)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.start, true)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.start, false)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.end)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.end, true)).toBe(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.end, false)).toBe(TRT.TimeRange_MIN_MAX);

  expect(() => timeRangeCollection.split(TRT.Timestamp_MIN)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_MAX)).toThrow();

  timeRangeCollection.split(TRT.Timestamp_Middle);

  expect(timeRangeCollection.count).toBe(2);
  expect(timeRangeCollection.get(0)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(1)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.orderableKey)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.orderableKey)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.start)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.start, true)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.start, false)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.end)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.end, true)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.end, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, true)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, true)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);

  expect(() => timeRangeCollection.split(TRT.Timestamp_MIN)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_Middle)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_MAX)).toThrow();

  timeRangeCollection.split(TRT.Timestamp_Early);

  expect(timeRangeCollection.count).toBe(3);
  expect(timeRangeCollection.get(0)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(1)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(2)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.orderableKey)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.orderableKey)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.orderableKey)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start, true)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start, false)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end, true)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end, false)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start, true)).toStrictEqual(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start, false)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end, true)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, true)).toStrictEqual(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, true)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);

  expect(() => timeRangeCollection.split(TRT.Timestamp_MIN)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_Early)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_Middle)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_MAX)).toThrow();
});

// TESTS for merge(...)
test("checks that splitting TimeRange in TimeRangeCollection using split(...) works properly", () => {
  const timeRanges = [TRT.TimeRange_MIN_Early, TRT.TimeRange_Early_Middle, TRT.TimeRange_Middle_MAX];
  const timeRangeCollection = new TimeRangeCollection(timeRanges);

  expect(timeRangeCollection.count).toBe(3);
  expect(timeRangeCollection.get(0)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(1)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(2)).toBe(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.orderableKey)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.orderableKey)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.orderableKey)).toBe(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start, true)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.start, false)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end, true)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Early.end, false)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start, true)).toBe(TRT.TimeRange_MIN_Early);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.start, false)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end, true)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Early_Middle.end, false)).toBe(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, true)).toBe(TRT.TimeRange_Early_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, false)).toBe(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end)).toBe(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, true)).toBe(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, false)).toBe(TRT.TimeRange_Middle_MAX);

  expect(() => timeRangeCollection.split(TRT.Timestamp_MIN)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_Early)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_Middle)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_MAX)).toThrow();

  timeRangeCollection.merge(TRT.Timestamp_Early);

  expect(timeRangeCollection.count).toBe(2);
  expect(timeRangeCollection.get(0)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(1)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.orderableKey)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.orderableKey)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.start)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.start, true)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.start, false)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.end)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.end, true)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_Middle.end, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, true)).toStrictEqual(TRT.TimeRange_MIN_Middle);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.start, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, true)).toStrictEqual(TRT.TimeRange_Middle_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_Middle_MAX.end, false)).toStrictEqual(TRT.TimeRange_Middle_MAX);

  expect(() => timeRangeCollection.split(TRT.Timestamp_MIN)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_Middle)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_MAX)).toThrow();

  timeRangeCollection.merge(TRT.Timestamp_Middle);

  expect(timeRangeCollection.count).toBe(1);
  expect(timeRangeCollection.get(0)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.orderableKey)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.start)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.start, true)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.start, false)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.end)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.end, true)).toStrictEqual(TRT.TimeRange_MIN_MAX);
  expect(timeRangeCollection.get(TRT.TimeRange_MIN_MAX.end, false)).toStrictEqual(TRT.TimeRange_MIN_MAX);

  expect(() => timeRangeCollection.split(TRT.Timestamp_MIN)).toThrow();
  expect(() => timeRangeCollection.split(TRT.Timestamp_MAX)).toThrow();
});
