import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

/**
 * @constant
 * @type {number}
 */
export const MIN_TIMESTAMP_SECONDS = -62135596800; // eslint-disable-line camelcase

/**
 * @constant
 * @type {number}
 */
export const MIN_TIMESTAMP_NANOSECONDS = 0; // eslint-disable-line camelcase

/**
 * @constant
 * @type {number}
 */
export const MAX_TIMESTAMP_SECONDS = 253402300799; // eslint-disable-line camelcase

/**
 * @constant
 * @type {number}
 */
export const MAX_TIMESTAMP_NANOSECONDS = 999999999; // eslint-disable-line camelcase

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const DEFAULT_TIME_RANGE_INCLUDES_START = true; // eslint-disable-line camelcase

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const DEFAULT_TIME_RANGE_INCLUDES_END = true; // eslint-disable-line camelcase

/**
 * Gets the seconds value as a consistent-length, consistently-signed string.
 * @param {number} seconds The seconds value.
 * @return {string} The string representation of the seconds value.
 */
export function getSecondsAsPaddedString(seconds: number): string {
  const prefix = (seconds >= 0) ? "+" : "-";
  const secondsAsString = ("" + Math.abs(seconds));
  const secondsAsPaddedString = secondsAsString.padStart(12, "0");
  return (prefix + secondsAsPaddedString);
}

/**
 * Gets the nanoseconds value as a consistent-length string.
 * @param {number} nanoseconds The nanoseconds value.
 * @return {string} The string representation of the nanoseconds value.
 */
export function getNanosecondsAsPaddedString(nanoseconds: number): string {
  const nanosecondsAsString = ("" + nanoseconds);
  const nanosecondsAsPaddedString = nanosecondsAsString.padStart(9, "0");
  return nanosecondsAsPaddedString;
}

/**
 * Takes two (2) Timestamps and coverts them to an orderable key.
 * @param {BT.ITimestamp} timestamp1 The first Timestamp.
 * @param {BT.ITimestamp} timestamp2 The second Timestamp.
 * @return {string} The orderable key.
 */
export function createOrderableKey(timestamp1: BT.ITimestamp, timestamp2: BT.ITimestamp | null): string {
  const part1 = timestamp1.valueOf();
  if (TC.isNullish(timestamp2)) {
    // LATER: Do this more compactly space-wise, but still maintain the guarantee of orderability
    const orderableKeyTemplate = `${part1}`;
    return orderableKeyTemplate;
  }

  timestamp2 = (timestamp2 as BT.ITimestamp);
  const part2 = timestamp2.valueOf();
  // LATER: Do this more compactly space-wise, but still maintain the guarantee of orderability
  const orderableKeyTemplate = `${part1}_${part2}`;
  return orderableKeyTemplate;
}

/**
 * Compares two (2) Timestamps and returns the result.
 * @param {BT.ITimestamp} timestamp1 The first Timestamp.
 * @param {BT.ITimestamp} timestamp2 The second Timestamp.
 * @return {number} The comparison result.
 */
export function compareTimestamps(timestamp1: BT.ITimestamp, timestamp2: BT.ITimestamp): number {
  const value1 = timestamp1.valueOf();
  const value2 = timestamp2.valueOf();

  if (value1 < value2) {
    return -1;
  }
  if (value1 > value2) {
    return 1;
  }
  return 0;
}

/**
 * Compares two (2) TimeRanges and returns the result.
 * @param {BT.ITimeRange} timeRange1 The first TimeRange.
 * @param {BT.ITimeRange} timeRange2 The second TimeRange.
 * @return {number} The comparison result.
 */
export function compareTimeRanges(timeRange1: BT.ITimeRange, timeRange2: BT.ITimeRange): number {
  const startResult = compareTimestamps(timeRange1.start, timeRange2.start);
  const endResult = compareTimestamps(timeRange1.end, timeRange2.end);

  if (startResult != 0) {
    return startResult;
  }
  return endResult;
}

/** Class representing a TimeRange composed of two (2) ITimestamps. */
export class TimeRange extends Object implements BT.ITimeRange {
  private _start: BT.ITimestamp;
  private _end: BT.ITimestamp | null;

  /**
   * Create a TimeRange, where the start Timestamp must be strictly less than the end Timestamp (when Timestamps are the same, the second argument must be omitted).
   * @param {BT.ITimestamp} start The start of the TimeRange.
   * @param {BT.ITimestamp | null} [end=null] The end of the TimeRange.
   */
  constructor(start: BT.ITimestamp, end: BT.ITimestamp | null = null) {
    super();

    if (start.seconds < MIN_TIMESTAMP_SECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp seconds at the start of the TimeRange must not subceed " + MIN_TIMESTAMP_SECONDS + " seconds."); // eslint-disable-line camelcase
    }
    if (start.nanoseconds < MIN_TIMESTAMP_NANOSECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp nanoseconds at the start of the TimeRange must not subceed " + MIN_TIMESTAMP_NANOSECONDS + " nanoseconds."); // eslint-disable-line camelcase
    }
    if (start.seconds > MAX_TIMESTAMP_SECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp seconds at the start of the TimeRange must not exceed " + MAX_TIMESTAMP_SECONDS + " seconds."); // eslint-disable-line camelcase
    }
    if (start.nanoseconds > MAX_TIMESTAMP_NANOSECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp nanoseconds at the start of the TimeRange must not exceed " + MAX_TIMESTAMP_NANOSECONDS + " nanoseconds."); // eslint-disable-line camelcase
    }
    if (TC.isNullish(end)) {
      this._start = start;
      this._end = null;
      return;
    }

    // NOTE: If end is "null", then we already returned
    end = (end as BT.ITimestamp);

    if (end.seconds < MIN_TIMESTAMP_SECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp seconds at the end of the TimeRange must not subceed " + MIN_TIMESTAMP_SECONDS + " seconds."); // eslint-disable-line camelcase
    }
    if (end.nanoseconds < MIN_TIMESTAMP_NANOSECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp nanoseconds at the end of the TimeRange must not subceed " + MIN_TIMESTAMP_NANOSECONDS + " nanoseconds."); // eslint-disable-line camelcase
    }
    if (end.seconds > MAX_TIMESTAMP_SECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp seconds at the end of the TimeRange must not exceed " + MAX_TIMESTAMP_SECONDS + " seconds."); // eslint-disable-line camelcase
    }
    if (end.nanoseconds > MAX_TIMESTAMP_NANOSECONDS) { // eslint-disable-line camelcase
      throw new Error("The Timestamp nanoseconds at the end of the TimeRange must not exceed " + MAX_TIMESTAMP_NANOSECONDS + " nanoseconds."); // eslint-disable-line camelcase
    }

    if ((end.seconds < start.seconds) || ((end.seconds == start.seconds) && (end.nanoseconds <= start.nanoseconds))) {
      throw new Error("The start Timestamp (" + start.seconds + ", " + start.nanoseconds + ") must be strictly less than the end Timestamp (" + end.seconds + ", " + end.nanoseconds + ").");
    }

    this._start = start;
    this._end = end;
  }

  /**
   * The start of the TimeRange.
   * @type {BT.ITimestamp}
   */
  get start(): BT.ITimestamp {
    return this._start;
  }

  /**
   * The end of the TimeRange.
   * @type {BT.ITimestamp}
   */
  get end(): BT.ITimestamp {
    return (!TC.isNullish(this._end)) ? (this._end as BT.ITimestamp) : this._start;
  }

  /**
   * The duration of the TimeRange.
   * @type {BT.IDuration}
   */
  get duration(): BT.IDuration {
    const secondsDiff = (this.end.seconds - this.start.seconds);
    const nanosecondsDiff = (this.end.nanoseconds - this.start.nanoseconds);
    const isEmpty = ((secondsDiff == 0) && (nanosecondsDiff == 0));

    return {seconds: secondsDiff, nanoseconds: nanosecondsDiff, isEmpty: isEmpty};
  }

  /**
   * Whether the duration of the TimeRange is empty (aka zero).
   * @type {boolean}
   */
  get isPointInTime(): boolean {
    return this.duration.isEmpty;
  }

  /**
   * An orderable key for the TimeRange.
   * @type {string}
   */
  get orderableKey(): string {
    return createOrderableKey(this._start, this._end);
  }

  /**
   * Determines whether the TimeRange contains the Timestamp.
   * @param {BT.ITimestamp} timestamp The timestamp to check.
   * @param {boolean} [includeStartOfRange=Default_IncludeStartOfRange] The timestamp to check.
   * @param {boolean} [includeEndOfRange=Default_IncludeEndOfRange] The timestamp to check.
   * @return {string} The string representation of the nanoseconds value.
   */
  contains(timestamp: BT.ITimestamp, includeStartOfRange: boolean = DEFAULT_TIME_RANGE_INCLUDES_START, includeEndOfRange: boolean = DEFAULT_TIME_RANGE_INCLUDES_END): boolean {
    const startValue = this.start.valueOf();
    const endValue = this.end.valueOf();
    const testValue = timestamp.valueOf();

    if (includeStartOfRange && (testValue == startValue)) {
      return true;
    }
    if (includeEndOfRange && (testValue == endValue)) {
      return true;
    }

    if (testValue <= startValue) {
      return false;
    }
    if (endValue <= testValue) {
      return false;
    }
    return true;
  }
}
