import * as firestore from "@google-cloud/firestore";
import * as TC from "./TypeChecking";

export type Id = string;
export type IdNullable = Id | null | undefined;
/**
 * Use this Date type while issue with Firebase Firestore Timestamps is still unresolved (see https://github.com/jloosli/node-firestore-import-export/issues/46)
 * @type
 */
export type DateToUse = Date;
/**
 * Use this Date now() function while issue with Firebase Firestore Timestamps is still unresolved (see https://github.com/jloosli/node-firestore-import-export/issues/46)
 * @constant
 * @type {function}
 * @return {DateToUse} The current date and time.
 */
export const nowToUse = (): DateToUse => firestore.Timestamp.now().toDate();

export type KeyText = string; // NOTE: " | symbol" causes Firebase Firestore query errors
export type TypedKeyText<T> = (keyof T) & (KeyText);
export type ContainerOfTypedKeyText<T> = {
  [K in keyof T]: TypedKeyText<T>;
};

export type DefaultFunc<T> = () => T;
export type ProxyFunc<T> = (obj: T) => T;
export type GetterFunc<T, V> = (value: T, propName?: string | symbol) => V;
export type GuardFunc<T> = (value: T) => boolean;
export type FilterFunc<T> = (value: T) => boolean;
export type IdFunc<T> = (value: T) => IdNullable;
export type ComparisonFunc<T> = (item1: T, item2: T) => number; // NOTE: (item1 < item2) => -1, (item1 == item2) => 0, else 1
export type MappingFunc<T1, T2> = (item: T1) => T2;

export interface ICollection {
  [key: string | symbol]: unknown;
}

export interface IDictionary<T> {
  [key: string | symbol]: T;
}

export interface ILocalizable<T> {
  [locale: string]: T;
  en: T // NOTE: Require a value for generic, non-location-specific English (i.e. "en") so as to guarantee at least one consistent localized value exists as the default
}

export interface IGeoPoint {
  readonly latitude: number;
  readonly longitude: number;
  isEqual(other: IGeoPoint): boolean;
}

export interface ITimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  isEqual(other: ITimestamp): boolean;
  toDate(): Date;
  toMillis(): number;
  toString(): string;
  valueOf(): string;
}

export interface IDuration {
  readonly seconds: number;
  readonly nanoseconds: number;
  readonly isEmpty: boolean;
}

export interface ITimeRange {
  readonly start: ITimestamp;
  readonly end: ITimestamp;
  readonly duration: IDuration;
  readonly isPointInTime: boolean;
  readonly orderableKey: string;
  contains(timestamp: ITimestamp, includeStart?: boolean, includeEnd?: boolean): boolean;
}

export interface ITimeRangeSplitResult {
  readonly original: ITimeRange;
  readonly earlier: ITimeRange;
  readonly later: ITimeRange;
}

export interface ITimeRangeMergeResult {
  readonly earlier: ITimeRange;
  readonly later: ITimeRange;
  readonly merged: ITimeRange;
}

export interface ITimeRangeCollection {
  readonly count: number;
  readonly first: ITimeRange;
  readonly last: ITimeRange;
  readonly keys: Array<string>;
  get(index: number | string | ITimestamp): ITimeRange | undefined;
  split(timestamp: ITimestamp): ITimeRangeSplitResult;
  merge(timestamp: ITimestamp): ITimeRangeMergeResult;
}

/**
 * Returns whether the ID is valid.
 * @param {DefaultFunc<IdNullable> | IdNullable} id The ID to check.
 * @return {boolean}
 */
export function isIdentifierValid(id: DefaultFunc<IdNullable> | IdNullable): boolean {
  const idToCheck = (TC.isFunction(id)) ? (id as DefaultFunc<IdNullable>)() : id;
  const isValid = (!TC.isNullishOrWhitespace(idToCheck));
  return isValid;
}

/**
 * Asserts that the ID is valid.
 * @param {DefaultFunc<IdNullable> | IdNullable} id The ID to check.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIdentifierIsValid(id: DefaultFunc<IdNullable> | IdNullable, message = "A valid ID must be provided."): void {
  if (!isIdentifierValid(id)) {
    throw new Error(message);
  }
}

/**
 * Gets the valid ID values from the incoming objects using an ID getter function of type T.
 * @param {Array<unknown>} objs The objects to evaluate.
 * @param {IdFunc<T>} idGetterFunc The function that gets the ID value from an object of type T.
 * @return {Array<Id>} The resulting list of IDs.
 */
export function getIdentifiersFromObjects<T>(objs: Array<unknown>, idGetterFunc: IdFunc<T>): Array<Id> {
  TC.assertNonNullish(objs);
  const ids = ([] as Array<string>);

  for (let i = 0; i < objs.length; i++) {
    const obj = objs[i];
    const id = idGetterFunc(obj as T);

    if (!isIdentifierValid(id)) {
      continue;
    }

    const idNonNull = TC.convertNonNullish(id);
    ids.push(idNonNull);
  }
  return ids;
}
