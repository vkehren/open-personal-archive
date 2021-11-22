import * as admin from "firebase-admin";
import * as TR from "./TimeRange";
import {TimeRange} from "./TimeRange";

/* eslint-disable camelcase, max-len*/
export const name = "TimeRangeTests";

export const Date_Early = new Date(2, 1, 2);
export const Date_Middle = new Date(2021, 11, 15);
export const Date_Late = new Date(9998, 12, 30);
export const Timestamp_MIN = new admin.firestore.Timestamp(TR.Timestamp_Seconds_MIN, TR.Timestamp_Nanoseconds_MIN);
export const Timestamp_MAX = new admin.firestore.Timestamp(TR.Timestamp_Seconds_MAX, TR.Timestamp_Nanoseconds_MAX);
export const Timestamp_Early = admin.firestore.Timestamp.fromDate(Date_Early);
export const Timestamp_Middle = admin.firestore.Timestamp.fromDate(Date_Middle);
export const Timestamp_Late = admin.firestore.Timestamp.fromDate(Date_Late);

// VALID TEST CASES:
export const TimeRange_MIN = new TimeRange(Timestamp_MIN);
export const TimeRange_MIN_Early = new TimeRange(Timestamp_MIN, Timestamp_Early);
export const TimeRange_MIN_Middle = new TimeRange(Timestamp_MIN, Timestamp_Middle);
export const TimeRange_MIN_Late = new TimeRange(Timestamp_MIN, Timestamp_Late);
export const TimeRange_MIN_MAX = new TimeRange(Timestamp_MIN, Timestamp_MAX);
export const TimeRange_Early = new TimeRange(Timestamp_Early);
export const TimeRange_Early_Middle = new TimeRange(Timestamp_Early, Timestamp_Middle);
export const TimeRange_Early_Late = new TimeRange(Timestamp_Early, Timestamp_Late);
export const TimeRange_Early_MAX = new TimeRange(Timestamp_Early, Timestamp_MAX);
export const TimeRange_Middle = new TimeRange(Timestamp_Middle);
export const TimeRange_Middle_Late = new TimeRange(Timestamp_Middle, Timestamp_Late);
export const TimeRange_Middle_MAX = new TimeRange(Timestamp_Middle, Timestamp_MAX);
export const TimeRange_Late = new TimeRange(Timestamp_Late);
export const TimeRange_Late_MAX = new TimeRange(Timestamp_Late, Timestamp_MAX);
export const TimeRange_MAX = new TimeRange(Timestamp_MAX);

// TESTS order of Timestamps
test("checks that comparing order of Timestamps works properly", () => {
  expect(TR.compareTimestamps(Timestamp_MIN, Timestamp_MIN)).toBe(0);
  expect(TR.compareTimestamps(Timestamp_Early, Timestamp_Early)).toBe(0);
  expect(TR.compareTimestamps(Timestamp_Middle, Timestamp_Middle)).toBe(0);
  expect(TR.compareTimestamps(Timestamp_Late, Timestamp_Late)).toBe(0);
  expect(TR.compareTimestamps(Timestamp_MAX, Timestamp_MAX)).toBe(0);

  expect(TR.compareTimestamps(Timestamp_MIN, Timestamp_Early)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_MIN, Timestamp_Middle)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_MIN, Timestamp_Late)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_MIN, Timestamp_MAX)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_Early, Timestamp_Middle)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_Early, Timestamp_Late)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_Early, Timestamp_MAX)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_Middle, Timestamp_Late)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_Middle, Timestamp_MAX)).toBe(-1);
  expect(TR.compareTimestamps(Timestamp_Late, Timestamp_MAX)).toBe(-1);

  expect(TR.compareTimestamps(Timestamp_MAX, Timestamp_Late)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_MAX, Timestamp_Middle)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_MAX, Timestamp_Early)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_MAX, Timestamp_MIN)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_Late, Timestamp_Middle)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_Late, Timestamp_Early)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_Late, Timestamp_MIN)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_Middle, Timestamp_Early)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_Middle, Timestamp_MIN)).toBe(1);
  expect(TR.compareTimestamps(Timestamp_Early, Timestamp_MIN)).toBe(1);
});

// TESTS order of TimeRanges
test("checks that comparing order of TimeRanges works properly", () => {
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_MIN)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_MIN_Early)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_MIN_Middle)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_MIN_Late)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_MIN_MAX)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Early)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Early_Middle)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Early_Late)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Early_MAX)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Middle)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Middle_Late)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Middle_MAX)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Late)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Late_MAX)).toBe(0);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_MAX)).toBe(0);

  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_MIN_Early)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_MIN_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_MIN_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_MIN_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Early)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Early_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_MIN_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_MIN_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_MIN_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Early)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Early_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_MIN_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_MIN_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Early)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Early_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_MIN_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Early)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Early_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Early)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Early_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Early_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Early_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Early_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Middle)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Middle_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Middle_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Late)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Late_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_MAX)).toBe(-1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_MAX)).toBe(-1);

  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Late_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Middle_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Middle_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Early_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MAX, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Middle_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Middle_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Early_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late_MAX, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Middle_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Middle_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Early_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Late, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Middle_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Early_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_MAX, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Early_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle_Late, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Early_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Middle, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Early_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_MAX, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Early_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Late, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early_Middle, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_MIN_MAX)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_Early, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_MIN_Late)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_MAX, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_MIN_Middle)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Late, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_MIN_Early)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Middle, TimeRange_MIN)).toBe(1);
  expect(TR.compareTimeRanges(TimeRange_MIN_Early, TimeRange_MIN)).toBe(1);
});

// TESTS for TimeRange_MIN
test("checks that getting start() of TimeRange_MIN returns Timestamp_MIN", () => {
  expect(TimeRange_MIN.start.seconds).toBe(Timestamp_MIN.seconds);
  expect(TimeRange_MIN.start.nanoseconds).toBe(Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN.start).toBe(Timestamp_MIN);
  expect(TimeRange_MIN.contains(Timestamp_MIN, true, true)).toBe(true);
  expect(TimeRange_MIN.contains(Timestamp_MIN, true, false)).toBe(true);
  expect(TimeRange_MIN.contains(Timestamp_MIN, false, true)).toBe(true);
  expect(TimeRange_MIN.contains(Timestamp_MIN, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_MIN returns Timestamp_MIN", () => {
  expect(TimeRange_MIN.end.seconds).toBe(Timestamp_MIN.seconds);
  expect(TimeRange_MIN.end.nanoseconds).toBe(Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN.end).toBe(Timestamp_MIN);
  expect(TimeRange_MIN.contains(Timestamp_MIN, true, true)).toBe(true);
  expect(TimeRange_MIN.contains(Timestamp_MIN, true, false)).toBe(true);
  expect(TimeRange_MIN.contains(Timestamp_MIN, false, true)).toBe(true);
  expect(TimeRange_MIN.contains(Timestamp_MIN, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_MIN returns Duration of (Timestamp_MIN - Timestamp_MIN)", () => {
  expect(TimeRange_MIN.duration.seconds).toBe(Timestamp_MIN.seconds - Timestamp_MIN.seconds);
  expect(TimeRange_MIN.duration.nanoseconds).toBe(Timestamp_MIN.nanoseconds - Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN.duration.isEmpty).toBe(true);
  expect(TimeRange_MIN.isPointInTime).toBe(true);
});

test("checks that getting orderableKey() of TimeRange_MIN returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_MIN, null) == TR.createOrderableKey(Timestamp_MIN, null)).toBe(true);
  expect(TimeRange_MIN.orderableKey).toBe(TR.createOrderableKey(Timestamp_MIN, null));
  expect(TimeRange_MIN.orderableKey).toBe(Timestamp_MIN.valueOf());
});

// TESTS for TimeRange_MIN_Early
test("checks that getting start() of TimeRange_MIN_Early returns Timestamp_MIN", () => {
  expect(TimeRange_MIN_Early.start.seconds).toBe(Timestamp_MIN.seconds);
  expect(TimeRange_MIN_Early.start.nanoseconds).toBe(Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_Early.start).toBe(Timestamp_MIN);
  expect(TimeRange_MIN_Early.contains(Timestamp_MIN, true, true)).toBe(true);
  expect(TimeRange_MIN_Early.contains(Timestamp_MIN, true, false)).toBe(true);
  expect(TimeRange_MIN_Early.contains(Timestamp_MIN, false, true)).toBe(false);
  expect(TimeRange_MIN_Early.contains(Timestamp_MIN, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_MIN_Early returns Timestamp_Early", () => {
  expect(TimeRange_MIN_Early.end.seconds).toBe(Timestamp_Early.seconds);
  expect(TimeRange_MIN_Early.end.nanoseconds).toBe(Timestamp_Early.nanoseconds);
  expect(TimeRange_MIN_Early.end).toBe(Timestamp_Early);
  expect(TimeRange_MIN_Early.contains(Timestamp_Early, true, true)).toBe(true);
  expect(TimeRange_MIN_Early.contains(Timestamp_Early, true, false)).toBe(false);
  expect(TimeRange_MIN_Early.contains(Timestamp_Early, false, true)).toBe(true);
  expect(TimeRange_MIN_Early.contains(Timestamp_Early, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_MIN_Early returns Duration of (Timestamp_Early - Timestamp_MIN)", () => {
  expect(TimeRange_MIN_Early.duration.seconds).toBe(Timestamp_Early.seconds - Timestamp_MIN.seconds);
  expect(TimeRange_MIN_Early.duration.nanoseconds).toBe(Timestamp_Early.nanoseconds - Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_Early.duration.isEmpty).toBe(false);
  expect(TimeRange_MIN_Early.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_MIN_Early returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_MIN, null) < TR.createOrderableKey(Timestamp_Early, null)).toBe(true);
  expect(TimeRange_MIN_Early.orderableKey).toBe(TR.createOrderableKey(Timestamp_MIN, Timestamp_Early));
  expect(TimeRange_MIN_Early.orderableKey).toBe(Timestamp_MIN.valueOf() + "_" + Timestamp_Early.valueOf());
});

// TESTS for TimeRange_MIN_Middle
test("checks that getting start() of TimeRange_MIN_Middle returns Timestamp_MIN", () => {
  expect(TimeRange_MIN_Middle.start.seconds).toBe(Timestamp_MIN.seconds);
  expect(TimeRange_MIN_Middle.start.nanoseconds).toBe(Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_Middle.start).toBe(Timestamp_MIN);
  expect(TimeRange_MIN_Middle.contains(Timestamp_MIN, true, true)).toBe(true);
  expect(TimeRange_MIN_Middle.contains(Timestamp_MIN, true, false)).toBe(true);
  expect(TimeRange_MIN_Middle.contains(Timestamp_MIN, false, true)).toBe(false);
  expect(TimeRange_MIN_Middle.contains(Timestamp_MIN, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_MIN_Middle returns Timestamp_Middle", () => {
  expect(TimeRange_MIN_Middle.end.seconds).toBe(Timestamp_Middle.seconds);
  expect(TimeRange_MIN_Middle.end.nanoseconds).toBe(Timestamp_Middle.nanoseconds);
  expect(TimeRange_MIN_Middle.end).toBe(Timestamp_Middle);
  expect(TimeRange_MIN_Middle.contains(Timestamp_Middle, true, true)).toBe(true);
  expect(TimeRange_MIN_Middle.contains(Timestamp_Middle, true, false)).toBe(false);
  expect(TimeRange_MIN_Middle.contains(Timestamp_Middle, false, true)).toBe(true);
  expect(TimeRange_MIN_Middle.contains(Timestamp_Middle, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_MIN_Middle returns Duration of (Timestamp_Middle - Timestamp_MIN)", () => {
  expect(TimeRange_MIN_Middle.duration.seconds).toBe(Timestamp_Middle.seconds - Timestamp_MIN.seconds);
  expect(TimeRange_MIN_Middle.duration.nanoseconds).toBe(Timestamp_Middle.nanoseconds - Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_Middle.duration.isEmpty).toBe(false);
  expect(TimeRange_MIN_Middle.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_MIN_Middle returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_MIN, null) < TR.createOrderableKey(Timestamp_Middle, null)).toBe(true);
  expect(TimeRange_MIN_Middle.orderableKey).toBe(TR.createOrderableKey(Timestamp_MIN, Timestamp_Middle));
  expect(TimeRange_MIN_Middle.orderableKey).toBe(Timestamp_MIN.valueOf() + "_" + Timestamp_Middle.valueOf());
});

// TESTS for TimeRange_MIN_Late
test("checks that getting start() of TimeRange_MIN_Late returns Timestamp_MIN", () => {
  expect(TimeRange_MIN_Late.start.seconds).toBe(Timestamp_MIN.seconds);
  expect(TimeRange_MIN_Late.start.nanoseconds).toBe(Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_Late.start).toBe(Timestamp_MIN);
  expect(TimeRange_MIN_Late.contains(Timestamp_MIN, true, true)).toBe(true);
  expect(TimeRange_MIN_Late.contains(Timestamp_MIN, true, false)).toBe(true);
  expect(TimeRange_MIN_Late.contains(Timestamp_MIN, false, true)).toBe(false);
  expect(TimeRange_MIN_Late.contains(Timestamp_MIN, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_MIN_Late returns Timestamp_Late", () => {
  expect(TimeRange_MIN_Late.end.seconds).toBe(Timestamp_Late.seconds);
  expect(TimeRange_MIN_Late.end.nanoseconds).toBe(Timestamp_Late.nanoseconds);
  expect(TimeRange_MIN_Late.end).toBe(Timestamp_Late);
  expect(TimeRange_MIN_Late.contains(Timestamp_Late, true, true)).toBe(true);
  expect(TimeRange_MIN_Late.contains(Timestamp_Late, true, false)).toBe(false);
  expect(TimeRange_MIN_Late.contains(Timestamp_Late, false, true)).toBe(true);
  expect(TimeRange_MIN_Late.contains(Timestamp_Late, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_MIN_Late returns Duration of (Timestamp_Late - Timestamp_MIN)", () => {
  expect(TimeRange_MIN_Late.duration.seconds).toBe(Timestamp_Late.seconds - Timestamp_MIN.seconds);
  expect(TimeRange_MIN_Late.duration.nanoseconds).toBe(Timestamp_Late.nanoseconds - Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_Late.duration.isEmpty).toBe(false);
  expect(TimeRange_MIN_Late.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_MIN_Late returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_MIN, null) < TR.createOrderableKey(Timestamp_Late, null)).toBe(true);
  expect(TimeRange_MIN_Late.orderableKey).toBe(TR.createOrderableKey(Timestamp_MIN, Timestamp_Late));
  expect(TimeRange_MIN_Late.orderableKey).toBe(Timestamp_MIN.valueOf() + "_" + Timestamp_Late.valueOf());
});

// TESTS for TimeRange_MIN_MAX
test("checks that getting start() of TimeRange_MIN_MAX returns Timestamp_MIN", () => {
  expect(TimeRange_MIN_MAX.start.seconds).toBe(Timestamp_MIN.seconds);
  expect(TimeRange_MIN_MAX.start.nanoseconds).toBe(Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_MAX.start).toBe(Timestamp_MIN);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MIN, true, true)).toBe(true);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MIN, true, false)).toBe(true);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MIN, false, true)).toBe(false);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MIN, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_MIN_MAX returns Timestamp_MAX", () => {
  expect(TimeRange_MIN_MAX.end.seconds).toBe(Timestamp_MAX.seconds);
  expect(TimeRange_MIN_MAX.end.nanoseconds).toBe(Timestamp_MAX.nanoseconds);
  expect(TimeRange_MIN_MAX.end).toBe(Timestamp_MAX);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MAX, true, true)).toBe(true);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MAX, true, false)).toBe(false);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MAX, false, true)).toBe(true);
  expect(TimeRange_MIN_MAX.contains(Timestamp_MAX, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_MIN_MAX returns Duration of (Timestamp_MAX - Timestamp_MIN)", () => {
  expect(TimeRange_MIN_MAX.duration.seconds).toBe(Timestamp_MAX.seconds - Timestamp_MIN.seconds);
  expect(TimeRange_MIN_MAX.duration.nanoseconds).toBe(Timestamp_MAX.nanoseconds - Timestamp_MIN.nanoseconds);
  expect(TimeRange_MIN_MAX.duration.isEmpty).toBe(false);
  expect(TimeRange_MIN_MAX.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_MIN_MAX returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_MIN, null) < TR.createOrderableKey(Timestamp_MAX, null)).toBe(true);
  expect(TimeRange_MIN_MAX.orderableKey).toBe(TR.createOrderableKey(Timestamp_MIN, Timestamp_MAX));
  expect(TimeRange_MIN_MAX.orderableKey).toBe(Timestamp_MIN.valueOf() + "_" + Timestamp_MAX.valueOf());
});

// TESTS for TimeRange_Early
test("checks that getting start() of TimeRange_Early returns Timestamp_Early", () => {
  expect(TimeRange_Early.start.seconds).toBe(Timestamp_Early.seconds);
  expect(TimeRange_Early.start.nanoseconds).toBe(Timestamp_Early.nanoseconds);
  expect(TimeRange_Early.start).toBe(Timestamp_Early);
  expect(TimeRange_Early.contains(Timestamp_Early, true, true)).toBe(true);
  expect(TimeRange_Early.contains(Timestamp_Early, true, false)).toBe(true);
  expect(TimeRange_Early.contains(Timestamp_Early, false, true)).toBe(true);
  expect(TimeRange_Early.contains(Timestamp_Early, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Early returns Timestamp_Early", () => {
  expect(TimeRange_Early.end.seconds).toBe(Timestamp_Early.seconds);
  expect(TimeRange_Early.end.nanoseconds).toBe(Timestamp_Early.nanoseconds);
  expect(TimeRange_Early.end).toBe(Timestamp_Early);
  expect(TimeRange_Early.contains(Timestamp_Early, true, true)).toBe(true);
  expect(TimeRange_Early.contains(Timestamp_Early, true, false)).toBe(true);
  expect(TimeRange_Early.contains(Timestamp_Early, false, true)).toBe(true);
  expect(TimeRange_Early.contains(Timestamp_Early, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Early returns Duration of (Timestamp_Early - Timestamp_Early)", () => {
  expect(TimeRange_Early.duration.seconds).toBe(Timestamp_Early.seconds - Timestamp_Early.seconds);
  expect(TimeRange_Early.duration.nanoseconds).toBe(Timestamp_Early.nanoseconds - Timestamp_Early.nanoseconds);
  expect(TimeRange_MIN_Late.duration.isEmpty).toBe(false);
  expect(TimeRange_MIN_Late.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Early returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Early, null) == TR.createOrderableKey(Timestamp_Early, null)).toBe(true);
  expect(TimeRange_Early.orderableKey).toBe(TR.createOrderableKey(Timestamp_Early, null));
  expect(TimeRange_Early.orderableKey).toBe(Timestamp_Early.valueOf());
});

// TESTS for TimeRange_Early_Middle
test("checks that getting start() of TimeRange_Early_Middle returns Timestamp_Early", () => {
  expect(TimeRange_Early_Middle.start.seconds).toBe(Timestamp_Early.seconds);
  expect(TimeRange_Early_Middle.start.nanoseconds).toBe(Timestamp_Early.nanoseconds);
  expect(TimeRange_Early_Middle.start).toBe(Timestamp_Early);
  expect(TimeRange_Early_Middle.contains(Timestamp_Early, true, true)).toBe(true);
  expect(TimeRange_Early_Middle.contains(Timestamp_Early, true, false)).toBe(true);
  expect(TimeRange_Early_Middle.contains(Timestamp_Early, false, true)).toBe(false);
  expect(TimeRange_Early_Middle.contains(Timestamp_Early, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Early_Middle returns Timestamp_Middle", () => {
  expect(TimeRange_Early_Middle.end.seconds).toBe(Timestamp_Middle.seconds);
  expect(TimeRange_Early_Middle.end.nanoseconds).toBe(Timestamp_Middle.nanoseconds);
  expect(TimeRange_Early_Middle.end).toBe(Timestamp_Middle);
  expect(TimeRange_Early_Middle.contains(Timestamp_Middle, true, true)).toBe(true);
  expect(TimeRange_Early_Middle.contains(Timestamp_Middle, true, false)).toBe(false);
  expect(TimeRange_Early_Middle.contains(Timestamp_Middle, false, true)).toBe(true);
  expect(TimeRange_Early_Middle.contains(Timestamp_Middle, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Early_Middle returns Duration of (Timestamp_Middle - Timestamp_Early)", () => {
  expect(TimeRange_Early_Middle.duration.seconds).toBe(Timestamp_Middle.seconds - Timestamp_Early.seconds);
  expect(TimeRange_Early_Middle.duration.nanoseconds).toBe(Timestamp_Middle.nanoseconds - Timestamp_Early.nanoseconds);
  expect(TimeRange_Early_Middle.duration.isEmpty).toBe(false);
  expect(TimeRange_Early_Middle.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Early_Middle returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Early, null) < TR.createOrderableKey(Timestamp_Middle, null)).toBe(true);
  expect(TimeRange_Early_Middle.orderableKey).toBe(TR.createOrderableKey(Timestamp_Early, Timestamp_Middle));
  expect(TimeRange_Early_Middle.orderableKey).toBe(Timestamp_Early.valueOf() + "_" + Timestamp_Middle.valueOf());
});

// TESTS for TimeRange_Early_Late
test("checks that getting start() of TimeRange_Early_Late returns Timestamp_Early", () => {
  expect(TimeRange_Early_Late.start.seconds).toBe(Timestamp_Early.seconds);
  expect(TimeRange_Early_Late.start.nanoseconds).toBe(Timestamp_Early.nanoseconds);
  expect(TimeRange_Early_Late.start).toBe(Timestamp_Early);
  expect(TimeRange_Early_Late.contains(Timestamp_Early, true, true)).toBe(true);
  expect(TimeRange_Early_Late.contains(Timestamp_Early, true, false)).toBe(true);
  expect(TimeRange_Early_Late.contains(Timestamp_Early, false, true)).toBe(false);
  expect(TimeRange_Early_Late.contains(Timestamp_Early, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Early_Late returns Timestamp_Late", () => {
  expect(TimeRange_Early_Late.end.seconds).toBe(Timestamp_Late.seconds);
  expect(TimeRange_Early_Late.end.nanoseconds).toBe(Timestamp_Late.nanoseconds);
  expect(TimeRange_Early_Late.end).toBe(Timestamp_Late);
  expect(TimeRange_Early_Late.contains(Timestamp_Late, true, true)).toBe(true);
  expect(TimeRange_Early_Late.contains(Timestamp_Late, true, false)).toBe(false);
  expect(TimeRange_Early_Late.contains(Timestamp_Late, false, true)).toBe(true);
  expect(TimeRange_Early_Late.contains(Timestamp_Late, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Early_Late returns Duration of (Timestamp_Late - Timestamp_Early)", () => {
  expect(TimeRange_Early_Late.duration.seconds).toBe(Timestamp_Late.seconds - Timestamp_Early.seconds);
  expect(TimeRange_Early_Late.duration.nanoseconds).toBe(Timestamp_Late.nanoseconds - Timestamp_Early.nanoseconds);
  expect(TimeRange_Early_Late.duration.isEmpty).toBe(false);
  expect(TimeRange_Early_Late.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Early_Late returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Early, null) < TR.createOrderableKey(Timestamp_Late, null)).toBe(true);
  expect(TimeRange_Early_Late.orderableKey).toBe(TR.createOrderableKey(Timestamp_Early, Timestamp_Late));
  expect(TimeRange_Early_Late.orderableKey).toBe(Timestamp_Early.valueOf() + "_" + Timestamp_Late.valueOf());
});

// TESTS for TimeRange_Early_MAX
test("checks that getting start() of TimeRange_Early_MAX returns Timestamp_Early", () => {
  expect(TimeRange_Early_MAX.start.seconds).toBe(Timestamp_Early.seconds);
  expect(TimeRange_Early_MAX.start.nanoseconds).toBe(Timestamp_Early.nanoseconds);
  expect(TimeRange_Early_MAX.start).toBe(Timestamp_Early);
  expect(TimeRange_Early_MAX.contains(Timestamp_Early, true, true)).toBe(true);
  expect(TimeRange_Early_MAX.contains(Timestamp_Early, true, false)).toBe(true);
  expect(TimeRange_Early_MAX.contains(Timestamp_Early, false, true)).toBe(false);
  expect(TimeRange_Early_MAX.contains(Timestamp_Early, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Early_MAX returns Timestamp_MAX", () => {
  expect(TimeRange_Early_MAX.end.seconds).toBe(Timestamp_MAX.seconds);
  expect(TimeRange_Early_MAX.end.nanoseconds).toBe(Timestamp_MAX.nanoseconds);
  expect(TimeRange_Early_MAX.end).toBe(Timestamp_MAX);
  expect(TimeRange_Early_MAX.contains(Timestamp_MAX, true, true)).toBe(true);
  expect(TimeRange_Early_MAX.contains(Timestamp_MAX, true, false)).toBe(false);
  expect(TimeRange_Early_MAX.contains(Timestamp_MAX, false, true)).toBe(true);
  expect(TimeRange_Early_MAX.contains(Timestamp_MAX, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Early_MAX returns Duration of (Timestamp_MAX - Timestamp_Early)", () => {
  expect(TimeRange_Early_MAX.duration.seconds).toBe(Timestamp_MAX.seconds - Timestamp_Early.seconds);
  expect(TimeRange_Early_MAX.duration.nanoseconds).toBe(Timestamp_MAX.nanoseconds - Timestamp_Early.nanoseconds);
  expect(TimeRange_Early_MAX.duration.isEmpty).toBe(false);
  expect(TimeRange_Early_MAX.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Early_MAX returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Early, null) < TR.createOrderableKey(Timestamp_MAX, null)).toBe(true);
  expect(TimeRange_Early_MAX.orderableKey).toBe(TR.createOrderableKey(Timestamp_Early, Timestamp_MAX));
  expect(TimeRange_Early_MAX.orderableKey).toBe(Timestamp_Early.valueOf() + "_" + Timestamp_MAX.valueOf());
});

// TESTS for TimeRange_Middle
test("checks that getting start() of TimeRange_Middle returns Timestamp_Middle", () => {
  expect(TimeRange_Middle.start.seconds).toBe(Timestamp_Middle.seconds);
  expect(TimeRange_Middle.start.nanoseconds).toBe(Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle.start).toBe(Timestamp_Middle);
  expect(TimeRange_Middle.contains(Timestamp_Middle, true, true)).toBe(true);
  expect(TimeRange_Middle.contains(Timestamp_Middle, true, false)).toBe(true);
  expect(TimeRange_Middle.contains(Timestamp_Middle, false, true)).toBe(true);
  expect(TimeRange_Middle.contains(Timestamp_Middle, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Middle returns Timestamp_Middle", () => {
  expect(TimeRange_Middle.end.seconds).toBe(Timestamp_Middle.seconds);
  expect(TimeRange_Middle.end.nanoseconds).toBe(Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle.end).toBe(Timestamp_Middle);
  expect(TimeRange_Middle.contains(Timestamp_Middle, true, true)).toBe(true);
  expect(TimeRange_Middle.contains(Timestamp_Middle, true, false)).toBe(true);
  expect(TimeRange_Middle.contains(Timestamp_Middle, false, true)).toBe(true);
  expect(TimeRange_Middle.contains(Timestamp_Middle, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Middle returns Duration of (Timestamp_Middle - Timestamp_Middle)", () => {
  expect(TimeRange_Middle.duration.seconds).toBe(Timestamp_Middle.seconds - Timestamp_Middle.seconds);
  expect(TimeRange_Middle.duration.nanoseconds).toBe(Timestamp_Middle.nanoseconds - Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle.duration.isEmpty).toBe(true);
  expect(TimeRange_Middle.isPointInTime).toBe(true);
});

test("checks that getting orderableKey() of TimeRange_Middle returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Middle, null) == TR.createOrderableKey(Timestamp_Middle, null)).toBe(true);
  expect(TimeRange_Middle.orderableKey).toBe(TR.createOrderableKey(Timestamp_Middle, null));
  expect(TimeRange_Middle.orderableKey).toBe(Timestamp_Middle.valueOf());
});

// TESTS for TimeRange_Middle_Late
test("checks that getting start() of TimeRange_Middle_Late returns Timestamp_Middle", () => {
  expect(TimeRange_Middle_Late.start.seconds).toBe(Timestamp_Middle.seconds);
  expect(TimeRange_Middle_Late.start.nanoseconds).toBe(Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle_Late.start).toBe(Timestamp_Middle);
  expect(TimeRange_Middle_Late.contains(Timestamp_Middle, true, true)).toBe(true);
  expect(TimeRange_Middle_Late.contains(Timestamp_Middle, true, false)).toBe(true);
  expect(TimeRange_Middle_Late.contains(Timestamp_Middle, false, true)).toBe(false);
  expect(TimeRange_Middle_Late.contains(Timestamp_Middle, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Middle_Late returns Timestamp_Late", () => {
  expect(TimeRange_Middle_Late.end.seconds).toBe(Timestamp_Late.seconds);
  expect(TimeRange_Middle_Late.end.nanoseconds).toBe(Timestamp_Late.nanoseconds);
  expect(TimeRange_Middle_Late.end).toBe(Timestamp_Late);
  expect(TimeRange_Middle_Late.contains(Timestamp_Late, true, true)).toBe(true);
  expect(TimeRange_Middle_Late.contains(Timestamp_Late, true, false)).toBe(false);
  expect(TimeRange_Middle_Late.contains(Timestamp_Late, false, true)).toBe(true);
  expect(TimeRange_Middle_Late.contains(Timestamp_Late, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Middle_Late returns Duration of (Timestamp_Late - Timestamp_Middle)", () => {
  expect(TimeRange_Middle_Late.duration.seconds).toBe(Timestamp_Late.seconds - Timestamp_Middle.seconds);
  expect(TimeRange_Middle_Late.duration.nanoseconds).toBe(Timestamp_Late.nanoseconds - Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle_Late.duration.isEmpty).toBe(false);
  expect(TimeRange_Middle_Late.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Middle_Late returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Middle, null) < TR.createOrderableKey(Timestamp_Late, null)).toBe(true);
  expect(TimeRange_Middle_Late.orderableKey).toBe(TR.createOrderableKey(Timestamp_Middle, Timestamp_Late));
  expect(TimeRange_Middle_Late.orderableKey).toBe(Timestamp_Middle.valueOf() + "_" + Timestamp_Late.valueOf());
});

// TESTS for TimeRange_Middle_MAX
test("checks that getting start() of TimeRange_Middle_MAX returns Timestamp_Middle", () => {
  expect(TimeRange_Middle_MAX.start.seconds).toBe(Timestamp_Middle.seconds);
  expect(TimeRange_Middle_MAX.start.nanoseconds).toBe(Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle_MAX.start).toBe(Timestamp_Middle);
  expect(TimeRange_Middle_MAX.contains(Timestamp_Middle, true, true)).toBe(true);
  expect(TimeRange_Middle_MAX.contains(Timestamp_Middle, true, false)).toBe(true);
  expect(TimeRange_Middle_MAX.contains(Timestamp_Middle, false, true)).toBe(false);
  expect(TimeRange_Middle_MAX.contains(Timestamp_Middle, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Middle_MAX returns Timestamp_MAX", () => {
  expect(TimeRange_Middle_MAX.end.seconds).toBe(Timestamp_MAX.seconds);
  expect(TimeRange_Middle_MAX.end.nanoseconds).toBe(Timestamp_MAX.nanoseconds);
  expect(TimeRange_Middle_MAX.end).toBe(Timestamp_MAX);
  expect(TimeRange_Middle_MAX.contains(Timestamp_MAX, true, true)).toBe(true);
  expect(TimeRange_Middle_MAX.contains(Timestamp_MAX, true, false)).toBe(false);
  expect(TimeRange_Middle_MAX.contains(Timestamp_MAX, false, true)).toBe(true);
  expect(TimeRange_Middle_MAX.contains(Timestamp_MAX, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Middle_MAX returns Duration of (Timestamp_MAX - Timestamp_Middle)", () => {
  expect(TimeRange_Middle_MAX.duration.seconds).toBe(Timestamp_MAX.seconds - Timestamp_Middle.seconds);
  expect(TimeRange_Middle_MAX.duration.nanoseconds).toBe(Timestamp_MAX.nanoseconds - Timestamp_Middle.nanoseconds);
  expect(TimeRange_Middle_MAX.duration.isEmpty).toBe(false);
  expect(TimeRange_Middle_MAX.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Middle_MAX returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Middle, null) < TR.createOrderableKey(Timestamp_MAX, null)).toBe(true);
  expect(TimeRange_Middle_MAX.orderableKey).toBe(TR.createOrderableKey(Timestamp_Middle, Timestamp_MAX));
  expect(TimeRange_Middle_MAX.orderableKey).toBe(Timestamp_Middle.valueOf() + "_" + Timestamp_MAX.valueOf());
});

// TESTS for TimeRange_Late
test("checks that getting start() of TimeRange_Late returns Timestamp_Late", () => {
  expect(TimeRange_Late.start.seconds).toBe(Timestamp_Late.seconds);
  expect(TimeRange_Late.start.nanoseconds).toBe(Timestamp_Late.nanoseconds);
  expect(TimeRange_Late.start).toBe(Timestamp_Late);
  expect(TimeRange_Late.contains(Timestamp_Late, true, true)).toBe(true);
  expect(TimeRange_Late.contains(Timestamp_Late, true, false)).toBe(true);
  expect(TimeRange_Late.contains(Timestamp_Late, false, true)).toBe(true);
  expect(TimeRange_Late.contains(Timestamp_Late, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Late returns Timestamp_Late", () => {
  expect(TimeRange_Late.end.seconds).toBe(Timestamp_Late.seconds);
  expect(TimeRange_Late.end.nanoseconds).toBe(Timestamp_Late.nanoseconds);
  expect(TimeRange_Late.end).toBe(Timestamp_Late);
  expect(TimeRange_Late.contains(Timestamp_Late, true, true)).toBe(true);
  expect(TimeRange_Late.contains(Timestamp_Late, true, false)).toBe(true);
  expect(TimeRange_Late.contains(Timestamp_Late, false, true)).toBe(true);
  expect(TimeRange_Late.contains(Timestamp_Late, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Late returns Duration of (Timestamp_Late - Timestamp_Late)", () => {
  expect(TimeRange_Late.duration.seconds).toBe(Timestamp_Late.seconds - Timestamp_Late.seconds);
  expect(TimeRange_Late.duration.nanoseconds).toBe(Timestamp_Late.nanoseconds - Timestamp_Late.nanoseconds);
  expect(TimeRange_Late.duration.isEmpty).toBe(true);
  expect(TimeRange_Late.isPointInTime).toBe(true);
});

test("checks that getting orderableKey() of TimeRange_Late returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Late, null) == TR.createOrderableKey(Timestamp_Late, null)).toBe(true);
  expect(TimeRange_Late.orderableKey).toBe(TR.createOrderableKey(Timestamp_Late, null));
  expect(TimeRange_Late.orderableKey).toBe(Timestamp_Late.valueOf());
});

// TESTS for TimeRange_Late_MAX
test("checks that getting start() of TimeRange_Late_MAX returns Timestamp_Late", () => {
  expect(TimeRange_Late_MAX.start.seconds).toBe(Timestamp_Late.seconds);
  expect(TimeRange_Late_MAX.start.nanoseconds).toBe(Timestamp_Late.nanoseconds);
  expect(TimeRange_Late_MAX.start).toBe(Timestamp_Late);
  expect(TimeRange_Late_MAX.contains(Timestamp_Late, true, true)).toBe(true);
  expect(TimeRange_Late_MAX.contains(Timestamp_Late, true, false)).toBe(true);
  expect(TimeRange_Late_MAX.contains(Timestamp_Late, false, true)).toBe(false);
  expect(TimeRange_Late_MAX.contains(Timestamp_Late, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_Late_MAX returns Timestamp_MAX", () => {
  expect(TimeRange_Late_MAX.end.seconds).toBe(Timestamp_MAX.seconds);
  expect(TimeRange_Late_MAX.end.nanoseconds).toBe(Timestamp_MAX.nanoseconds);
  expect(TimeRange_Late_MAX.end).toBe(Timestamp_MAX);
  expect(TimeRange_Late_MAX.contains(Timestamp_MAX, true, true)).toBe(true);
  expect(TimeRange_Late_MAX.contains(Timestamp_MAX, true, false)).toBe(false);
  expect(TimeRange_Late_MAX.contains(Timestamp_MAX, false, true)).toBe(true);
  expect(TimeRange_Late_MAX.contains(Timestamp_MAX, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_Late_MAX returns Duration of (Timestamp_MAX - Timestamp_Late)", () => {
  expect(TimeRange_Late_MAX.duration.seconds).toBe(Timestamp_MAX.seconds - Timestamp_Late.seconds);
  expect(TimeRange_Late_MAX.duration.nanoseconds).toBe(Timestamp_MAX.nanoseconds - Timestamp_Late.nanoseconds);
  expect(TimeRange_Late_MAX.duration.isEmpty).toBe(false);
  expect(TimeRange_Late_MAX.isPointInTime).toBe(false);
});

test("checks that getting orderableKey() of TimeRange_Late_MAX returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_Late, null) < TR.createOrderableKey(Timestamp_MAX, null)).toBe(true);
  expect(TimeRange_Late_MAX.orderableKey).toBe(TR.createOrderableKey(Timestamp_Late, Timestamp_MAX));
  expect(TimeRange_Late_MAX.orderableKey).toBe(Timestamp_Late.valueOf() + "_" + Timestamp_MAX.valueOf());
});

// TESTS for TimeRange_MAX
test("checks that getting start() of TimeRange_MAX returns Timestamp_MAX", () => {
  expect(TimeRange_MAX.start.seconds).toBe(Timestamp_MAX.seconds);
  expect(TimeRange_MAX.start.nanoseconds).toBe(Timestamp_MAX.nanoseconds);
  expect(TimeRange_MAX.start).toBe(Timestamp_MAX);
  expect(TimeRange_MAX.contains(Timestamp_MAX, true, true)).toBe(true);
  expect(TimeRange_MAX.contains(Timestamp_MAX, true, false)).toBe(true);
  expect(TimeRange_MAX.contains(Timestamp_MAX, false, true)).toBe(true);
  expect(TimeRange_MAX.contains(Timestamp_MAX, false, false)).toBe(false);
});

test("checks that getting end() of TimeRange_MAX returns Timestamp_MAX", () => {
  expect(TimeRange_MAX.end.seconds).toBe(Timestamp_MAX.seconds);
  expect(TimeRange_MAX.end.nanoseconds).toBe(Timestamp_MAX.nanoseconds);
  expect(TimeRange_MAX.end).toBe(Timestamp_MAX);
  expect(TimeRange_MAX.contains(Timestamp_MAX, true, true)).toBe(true);
  expect(TimeRange_MAX.contains(Timestamp_MAX, true, false)).toBe(true);
  expect(TimeRange_MAX.contains(Timestamp_MAX, false, true)).toBe(true);
  expect(TimeRange_MAX.contains(Timestamp_MAX, false, false)).toBe(false);
});

test("checks that getting duration() of TimeRange_MAX returns Duration of (Timestamp_MAX - Timestamp_MAX)", () => {
  expect(TimeRange_MAX.duration.seconds).toBe(Timestamp_MAX.seconds - Timestamp_MAX.seconds);
  expect(TimeRange_MAX.duration.nanoseconds).toBe(Timestamp_MAX.nanoseconds - Timestamp_MAX.nanoseconds);
  expect(TimeRange_MAX.duration.isEmpty).toBe(true);
  expect(TimeRange_MAX.isPointInTime).toBe(true);
});

test("checks that getting orderableKey() of TimeRange_MAX returns orderable composite key", () => {
  expect(TR.createOrderableKey(Timestamp_MAX, null) == TR.createOrderableKey(Timestamp_MAX, null)).toBe(true);
  expect(TimeRange_MAX.orderableKey).toBe(TR.createOrderableKey(Timestamp_MAX, null));
  expect(TimeRange_MAX.orderableKey).toBe(Timestamp_MAX.valueOf());
});

// INVALID TEST CASES (should fail in constructor):
//   MAX-MIN, MAX-Early, MAX-Middle, MAX-Late, MAX-MAX
//   Late-MIN, Late-Early, Late-Middle, Late-Late
//   Middle-MIN, Middle-Early, Middle-Middle
//   Early-MIN, Early-Early
//   MIN-MIN

test("checks that getting TimeRange_MAX_MIN throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_MAX, Timestamp_MIN)).toThrow();
});

test("checks that getting TimeRange_MAX_Early throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_MAX, Timestamp_Early)).toThrow();
});

test("checks that getting TimeRange_MAX_Middle throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_MAX, Timestamp_Middle)).toThrow();
});

test("checks that getting TimeRange_MAX_Late throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_MAX, Timestamp_Late)).toThrow();
});

test("checks that getting TimeRange_MAX_MAX throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_MAX, Timestamp_MAX)).toThrow();
});

test("checks that getting TimeRange_Late_MIN throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Late, Timestamp_MIN)).toThrow();
});

test("checks that getting TimeRange_Late_Early throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Late, Timestamp_Early)).toThrow();
});

test("checks that getting TimeRange_Late_Middle throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Late, Timestamp_Middle)).toThrow();
});

test("checks that getting TimeRange_Late_Late throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Late, Timestamp_Late)).toThrow();
});

test("checks that getting TimeRange_Middle_MIN throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Middle, Timestamp_MIN)).toThrow();
});

test("checks that getting TimeRange_Middle_Early throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Middle, Timestamp_Early)).toThrow();
});

test("checks that getting TimeRange_Middle_Middle throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Middle, Timestamp_Middle)).toThrow();
});

test("checks that getting TimeRange_Early_MIN throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Early, Timestamp_MIN)).toThrow();
});

test("checks that getting TimeRange_Early_Early throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_Early, Timestamp_Early)).toThrow();
});

test("checks that getting TimeRange_MIN_MIN throws error", () => {
  expect(() => new TR.TimeRange(Timestamp_MIN, Timestamp_MIN)).toThrow();
});
