import * as firestore from "@google-cloud/firestore";

// export const name = "BaseTypes";

export type GetterFunc<T, V> = (value: T, propName?: string | symbol) => V;
export type GuardFunc<T> = (value: T) => boolean;
export type FilterFunc<T> = (value: T) => boolean;
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

// NOTE: The types and interfaces below are useful for creating typed Firebase Firestore Documents

/**
 * Use this Date type while issue with Firebase Firestore Timestamps is still unresolved (see https://github.com/jloosli/node-firestore-import-export/issues/46)
 * @type
 */
export type DateToUse = Date;
/**
 * Use this Date now() function while issue with Firebase Firestore Timestamps is still unresolved (see https://github.com/jloosli/node-firestore-import-export/issues/46)
 * @constant
 * @type {function}
 */
export const nowToUse = (): DateToUse => firestore.Timestamp.now().toDate();

export const IDocument_DocumentId_PropertyName = "id"; // eslint-disable-line camelcase
export const IDocument_Creatable_DateOfCreation_PropertyName = "dateOfCreation"; // eslint-disable-line camelcase
export const IDocument_Creatable_ByUser_UserIdOfCreator_PropertyName = "userIdOfCreator"; // eslint-disable-line camelcase
export const IDocument_Creatable_ByNullableUser_UserIdOfCreator_PropertyName = "userIdOfCreator"; // eslint-disable-line camelcase
export const IDocument_Upgradeable_HasBeenUpgraded_PropertyName = "hasBeenUpgraded"; // eslint-disable-line camelcase
export const IDocument_Upgradeable_DateOfLatestUpgraded_PropertyName = "dateOfLatestUpgraded"; // eslint-disable-line camelcase
export const IDocument_Upgradeable_ByUser_UserIdOfLatestUpgrader_PropertyName = "userIdOfLatestUpgrader"; // eslint-disable-line camelcase
export const IDocument_Updateable_HasBeenUpdated_PropertyName = "hasBeenUpdated"; // eslint-disable-line camelcase
export const IDocument_Updateable_DateOfLatestUpdate_PropertyName = "dateOfLatestUpdate"; // eslint-disable-line camelcase
export const IDocument_Updateable_ByUser_UserIdOfLatestUpdater_PropertyName = "userIdOfLatestUpdater"; // eslint-disable-line camelcase
export const IDocument_Archivable_IsArchived_PropertyName = "isArchived"; // eslint-disable-line camelcase
export const IDocument_Archivable_DateOfArchival_PropertyName = "dateOfArchival"; // eslint-disable-line camelcase
export const IDocument_Archivable_ByUser_UserIdOfArchiver_PropertyName = "userIdOfArchiver"; // eslint-disable-line camelcase
export const IDocument_Viewable_HasBeenViewed_PropertyName = "hasBeenViewed"; // eslint-disable-line camelcase
export const IDocument_Viewable_DateOfViewing_PropertyName = "dateOfViewing"; // eslint-disable-line camelcase
export const IDocument_Viewable_ByUser_UserIdOfViewer_PropertyName = "userIdOfViewer"; // eslint-disable-line camelcase
export const IDocument_Approvable_ApprovalState_PropertyName = "approvalState"; // eslint-disable-line camelcase
export const IDocument_Approvable_DateOfApproval_PropertyName = "dateOfApproval"; // eslint-disable-line camelcase
export const IDocument_Approvable_ByUser_UserIdOfApprover_PropertyName = "userIdOfApprover"; // eslint-disable-line camelcase

export interface IDocument {
  id: string,
}
export interface IDocument_Creatable extends IDocument {
  readonly dateOfCreation: DateToUse;
}
export interface IDocument_Creatable_ByUser extends IDocument, IDocument_Creatable {
  readonly userIdOfCreator: string;
}
export interface IDocument_Creatable_ByNullableUser extends IDocument, IDocument_Creatable {
  readonly userIdOfCreator: string | null;
}
export interface IDocument_Upgradeable extends IDocument {
  readonly hasBeenUpgraded: boolean;
  readonly dateOfLatestUpgraded: DateToUse | null;
}
export interface IDocument_Upgradeable_ByUser extends IDocument, IDocument_Upgradeable {
  readonly userIdOfLatestUpgrader: string | null;
}
export interface IDocument_Updateable extends IDocument {
  readonly hasBeenUpdated: boolean;
  readonly dateOfLatestUpdate: DateToUse | null;
}
export interface IDocument_Updateable_ByUser extends IDocument, IDocument_Updateable {
  readonly userIdOfLatestUpdater: string | null;
}
export interface IDocument_Archivable extends IDocument {
  readonly isArchived: boolean;
  readonly dateOfArchival: DateToUse | null;
}
export interface IDocument_Archivable_ByUser extends IDocument, IDocument_Archivable {
  readonly userIdOfArchiver: string | null;
}
export interface IDocument_Viewable extends IDocument {
  readonly hasBeenViewed: boolean;
  readonly dateOfViewing: DateToUse | null;
}
export interface IDocument_Viewable_ByUser extends IDocument, IDocument_Viewable {
  readonly userIdOfViewer: string | null;
}
export interface IDocument_Approvable<T> extends IDocument {
  readonly approvalState: T;
  readonly dateOfApproval: DateToUse | null;
}
export interface IDocument_Approvable_ByUser<T> extends IDocument, IDocument_Approvable<T> {
  readonly userIdOfApprover: string | null;
}
