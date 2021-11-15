import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";
import * as CL from "./Collections";
import * as TR from "./TimeRange";

// export const name = "TimeRangeCollection";

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const Default_AllowEmptyTimeRanges = false; // eslint-disable-line camelcase

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const Default_ReturnEarlierSideOfBoundary = true; // eslint-disable-line camelcase

/**
 * Takes an array of TimeRanges and checks whether the set are continuous or disjoint.
 * @param {Array<BT.ITimeRange>} timeRanges The array of TimeRanges.
 * @param {boolean} [allowEmptyTimeRanges=Default_AllowEmptyTimeRanges] The array of TimeRanges.
 * @return {boolean} Whether the set of TimeRanges in the array is continuous or not.
 */
export function isContinuous(timeRanges: Array<BT.ITimeRange>, allowEmptyTimeRanges: boolean = Default_AllowEmptyTimeRanges): boolean {
  if (TC.isNullish(timeRanges)) {
    return false;
  }
  if (VC.isEmpty(timeRanges)) {
    return false;
  }

  const timeRangesSorted = timeRanges.slice().sort(TR.compareTimeRanges);
  if (!allowEmptyTimeRanges && timeRangesSorted[0].isPointInTime) {
    return false;
  }

  for (let i1 = 0; i1 < (timeRangesSorted.length - 1); i1++) {
    const i2 = (i1 + 1);
    const timeRange1 = timeRangesSorted[i1];
    const timeRange2 = timeRangesSorted[i2];

    if (!allowEmptyTimeRanges && timeRange2.isPointInTime) {
      return false;
    }
    if (timeRange1.end.valueOf() != timeRange2.start.valueOf()) {
      return false;
    }
  }
  return true;
}

/** Class representing a TimeRangeCollection that contain one (1) or more TimeRanges. */
export class TimeRangeCollection extends Object implements BT.ITimeRangeCollection {
  private _timeRanges: Map<string, BT.ITimeRange>;

  /**
    * Create a TimeRangeCollection from the values specified.
    * @param {BT.ITimeRange | Array<BT.ITimeRange>} initialRange The complete range of the of the TimeRangeCollection.
    */
  constructor(initialRange: BT.ITimeRange | Array<BT.ITimeRange>) {
    super();

    let initialRanges: Array<BT.ITimeRange> = [];
    if (TC.isArray(initialRange)) {
      initialRanges = (initialRange as Array<BT.ITimeRange>).slice().sort(TR.compareTimeRanges);
    } else {
      initialRanges = [initialRange as BT.ITimeRange];
    }

    if (!isContinuous(initialRanges)) {
      throw new Error("The initial TimeRange(s) provided for the TimeRangeCollection must be continuous and must not include empty TimeRanges.");
    }

    this._timeRanges = CL.createMapFromArray(initialRanges, (timeRange: BT.ITimeRange) => timeRange.orderableKey);
  }

  /**
    * The number of TimeRanges in the collection.
    * @type {number}
    */
  get count(): number {
    return this._timeRanges.size;
  }

  /**
    * The first TimeRange in the collection.
    * @type {BT.ITimeRange}
    */
  get first(): BT.ITimeRange {
    const timeRanges = Array.from(this._timeRanges.entries());
    const first = timeRanges[0];
    return first[1];
  }

  /**
    * The last TimeRange in the collection.
    * @type {BT.ITimeRange}
    */
  get last(): BT.ITimeRange {
    const timeRanges = Array.from(this._timeRanges.entries());
    const last = timeRanges[timeRanges.length - 1];
    return last[1];
  }

  /**
    * The keys in the collection.
    * @type {Array<string>}
    */
  get keys(): Array<string> {
    const timeRangeKeys = Array.from(this._timeRanges.keys());
    return timeRangeKeys;
  }

  /**
    * Gets a TimeRange from the collection.
    * @param {number | string | BT.ITimestamp} index The index of the TimeRange to get.
    * @param {boolean} [returnEarlierSideOfBoundary=Default_ReturnEarlierSideOfBoundary] Whether to return the earlier of a boundary between two (2) TimeRanges or not.
    * @return {BT.ITimeRange | null} The TimeRange requested, or null if none exists.
    */
  get(index: number | string | BT.ITimestamp, returnEarlierSideOfBoundary: boolean = Default_ReturnEarlierSideOfBoundary): BT.ITimeRange | undefined {
    if (TC.isNumber(index)) {
      const indexAsNumber = (index as number);
      const keys = this.keys;

      if ((indexAsNumber < 0) || (indexAsNumber >= keys.length)) {
        return undefined;
      }

      const key = keys[indexAsNumber];
      const value = this._timeRanges.get(key);
      return value;
    } else if (TC.isString(index)) {
      const key = (index as string);
      const value = this._timeRanges.get(key);
      return value;
    } else {
      const keys = this.keys;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = (this._timeRanges.get(key) as BT.ITimeRange);

        const indexAsTimestamp = (index as BT.ITimestamp);
        const isStart = value.start.isEqual(indexAsTimestamp);
        const isEnd = value.end.isEqual(indexAsTimestamp);

        if (isEnd && (returnEarlierSideOfBoundary || (i == keys.length - 1))) {
          return value;
        } else if (isStart && (!returnEarlierSideOfBoundary || (i == 0))) {
          return value;
        } else if (!isStart && !isEnd && value.contains(indexAsTimestamp)) {
          return value;
        }
      }
      return undefined;
    }
  }

  /**
    * Splits a TimeRange in the collection into two (2) separate TimeRanges at the Timestamp specified.
    * @param {BT.ITimestamp} timestamp The Timestamp to split at.
    * @return {BT.ITimeRangeSplitResult} The result of splitting.
    */
  split(timestamp: BT.ITimestamp): BT.ITimeRangeSplitResult {
    const original = this.get(timestamp);
    if (TC.isNullish(original)) {
      throw new Error("The Timestamp specified does not correspond to a TimeRange contained in the TimeRangeCollection.");
    }

    const originalNonNull = (original as BT.ITimeRange);
    if (originalNonNull.start.isEqual(timestamp)) {
      throw new Error("The Timestamp for splitting a TimeRange must NOT equal the start bound of the TimeRange.");
    }
    if (originalNonNull.end.isEqual(timestamp)) {
      throw new Error("The Timestamp for splitting a TimeRange must NOT equal the end bound of the TimeRange.");
    }

    const earlier = new TR.TimeRange(originalNonNull.start, timestamp);
    const later = new TR.TimeRange(timestamp, originalNonNull.end);

    this._timeRanges.delete(originalNonNull.orderableKey);
    const newTimeRanges = Array.from(this._timeRanges.values());
    newTimeRanges.push(earlier, later);
    newTimeRanges.sort(TR.compareTimeRanges);

    this._timeRanges = CL.createMapFromArray(newTimeRanges, (timeRange: BT.ITimeRange) => timeRange.orderableKey);
    return {original: originalNonNull, earlier: earlier, later: later};
  }

  /**
    * Merges two (2) TimeRanges in the collection into a single TimeRange at the Timestamp specified.
    * @param {BT.ITimestamp} timestamp The Timestamp to merge at.
    * @return {BT.ITimeRangeMergeResult} The result of merging.
    */
  merge(timestamp: BT.ITimestamp): BT.ITimeRangeMergeResult {
    const keys = this.keys;
    let earlier: BT.ITimeRange | null = null;
    let later: BT.ITimeRange | null = null;

    for (let i = 0; i < (keys.length - 1); i++) {
      const timeRangeKey = keys[i];
      const timeRange = (this._timeRanges.get(timeRangeKey) as BT.ITimeRange);

      const startMatches = (timeRange.start.isEqual(timestamp));
      const endMatches = (timeRange.end.isEqual(timestamp));
      const isFirst = (i == 0);
      const isLast = (i == (keys.length - 1));

      if (isFirst && startMatches) {
        throw new Error("The Timestamp for merging two (2) TimeRanges must NOT equal the start bound of the entire TimeRangeCollection.");
      } else if (isFirst && (timestamp.valueOf() < timeRange.start.valueOf())) {
        throw new Error("The Timestamp for merging two (2) TimeRanges must NOT precede the start bound of the entire TimeRangeCollection.");
      } else if (isLast && endMatches) {
        throw new Error("The Timestamp for merging two (2) TimeRanges must NOT equal the end bound of the entire TimeRangeCollection.");
      } else if (isLast && (timestamp.valueOf() > timeRange.end.valueOf())) {
        throw new Error("The Timestamp for merging two (2) TimeRanges must NOT subcede the end bound of the entire TimeRangeCollection.");
      } else {
        // NOTE: We assume Map is sorted, which it definitely should be, as it is ALWAYS created from a sorted Array
        if (endMatches) {
          earlier = timeRange;
          later = (this._timeRanges.get(keys[i + 1]) as BT.ITimeRange);
          break;
        }
      }
    }

    if (TC.isNullish(earlier) || TC.isNullish(later)) {
      throw new Error("The Timestamp for merging two (2) TimeRanges must occur at the start or end bound of an existing TimeRange.");
    }

    const earlierNonNull = (earlier as BT.ITimeRange);
    const laterNonNull = (later as BT.ITimeRange);
    const merged = new TR.TimeRange(earlierNonNull.start, laterNonNull.end);

    this._timeRanges.delete(earlierNonNull.orderableKey);
    this._timeRanges.delete(laterNonNull.orderableKey);
    const newTimeRanges = Array.from(this._timeRanges.values());
    newTimeRanges.push(merged);
    newTimeRanges.sort(TR.compareTimeRanges);

    this._timeRanges = CL.createMapFromArray(newTimeRanges, (timeRange: BT.ITimeRange) => timeRange.orderableKey);
    return {earlier: earlierNonNull, later: laterNonNull, merged: merged};
  }
}
