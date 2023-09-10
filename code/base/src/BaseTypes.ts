import * as firestore from "@google-cloud/firestore";
import * as TC from "./TypeChecking";

// export const name = "BaseTypes";

export type KeyText = string | symbol;
export type TypedKeyText<T> = (keyof T) & (KeyText);
export type ContainerOfTypedKeyText<T> = {
  [K in keyof T]: TypedKeyText<T>;
};

export type GetterFunc<T, V> = (value: T, propName?: KeyText) => V;
export type GuardFunc<T> = (value: T) => boolean;
export type FilterFunc<T> = (value: T) => boolean;
export type IdFunc<T> = (value: T) => string | null | undefined;
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

// IDocument
export const IDocument_DocumentId_PropertyName = "id"; // eslint-disable-line camelcase
export interface IDocument {
  id: string,
}

// ICreatable
export const ICreatable_DateOfCreation_PropertyName = "dateOfCreation"; // eslint-disable-line camelcase
export interface ICreatable {
  // NOTE: Do not include "hasBeenCreated" because any object that exists has been created
  readonly dateOfCreation: DateToUse;
}
export const ICreatable_ByUser_UserIdOfCreator_PropertyName = "userIdOfCreator"; // eslint-disable-line camelcase
export interface ICreatable_ByUser extends ICreatable {
  readonly userIdOfCreator: string;
}
export const ICreatable_ByNullableUser_UserIdOfCreator_PropertyName = "userIdOfCreator"; // eslint-disable-line camelcase
export interface ICreatable_ByNullableUser extends ICreatable {
  readonly userIdOfCreator: string | null;
}
export interface IDocument_Creatable extends IDocument, ICreatable { }
export interface IDocument_Creatable_ByUser extends IDocument_Creatable, ICreatable_ByUser { }
export interface IDocument_Creatable_ByNullableUser extends IDocument_Creatable, ICreatable_ByNullableUser { }

// IUpgradeable
export const IUpgradeable_HasBeenUpgraded_PropertyName = "hasBeenUpgraded"; // eslint-disable-line camelcase
export const IUpgradeable_DateOfLatestUpgrade_PropertyName = "dateOfLatestUpgrade"; // eslint-disable-line camelcase
export interface IUpgradeable {
  readonly hasBeenUpgraded: boolean;
  readonly dateOfLatestUpgrade: DateToUse | null;
}
export const IUpgradeable_ByUser_UserIdOfLatestUpgrader_PropertyName = "userIdOfLatestUpgrader"; // eslint-disable-line camelcase
export interface IUpgradeable_ByUser extends IUpgradeable {
  readonly userIdOfLatestUpgrader: string | null;
}
export interface IDocument_Upgradeable extends IDocument, IUpgradeable { }
export interface IDocument_Upgradeable_ByUser extends IDocument_Upgradeable, IUpgradeable_ByUser { }

// IUpdateable
export const IUpdateable_HasBeenUpdated_PropertyName = "hasBeenUpdated"; // eslint-disable-line camelcase
export const IUpdateable_DateOfLatestUpdate_PropertyName = "dateOfLatestUpdate"; // eslint-disable-line camelcase
export interface IUpdateable {
  hasBeenUpdated: boolean;
  dateOfLatestUpdate: DateToUse | null;
}
export const IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName = "userIdOfLatestUpdater"; // eslint-disable-line camelcase
export interface IUpdateable_ByUser extends IUpdateable {
  userIdOfLatestUpdater: string | null;
}
export interface IDocument_Updateable extends IDocument, IUpdateable { }
export interface IDocument_Updateable_ByUser extends IDocument_Updateable, IUpdateable_ByUser { }

// IArchivable
export const IArchivable_IsArchived_PropertyName = "isArchived"; // eslint-disable-line camelcase
export const IArchivable_DateOfArchival_PropertyName = "dateOfArchival"; // eslint-disable-line camelcase
export interface IArchivable {
  readonly isArchived: boolean;
  readonly dateOfArchival: DateToUse | null;
}
export const IArchivable_ByUser_UserIdOfArchiver_PropertyName = "userIdOfArchiver"; // eslint-disable-line camelcase
export interface IArchivable_ByUser extends IArchivable {
  readonly userIdOfArchiver: string | null;
}
export interface IDocument_Archivable extends IDocument, IArchivable { }
export interface IDocument_Archivable_ByUser extends IDocument_Archivable, IArchivable_ByUser { }

// IViewable
export const IViewable_HasBeenViewed_PropertyName = "hasBeenViewed"; // eslint-disable-line camelcase
export const IViewable_DateOfLatestViewing_PropertyName = "dateOfLatestViewing"; // eslint-disable-line camelcase
export interface IViewable {
  readonly hasBeenViewed: boolean;
  readonly dateOfLatestViewing: DateToUse | null;
}
export const IViewable_ByUser_UserIdOfLatestViewer_PropertyName = "userIdOfLatestViewer"; // eslint-disable-line camelcase
export interface IViewable_ByUser extends IViewable {
  readonly userIdOfLatestViewer: string | null;
}
export interface IDocument_Viewable extends IDocument, IViewable { }
export interface IDocument_Viewable_ByUser extends IDocument_Viewable, IViewable_ByUser { }

// IApprovable
export const IApprovable_HasBeenDecided_PropertyName = "hasBeenDecided"; // eslint-disable-line camelcase
export const IApprovable_ApprovalState_PropertyName = "approvalState"; // eslint-disable-line camelcase
export const IApprovable_DateOfDecision_PropertyName = "dateOfDecision"; // eslint-disable-line camelcase
export interface IApprovable<T> {
  readonly hasBeenDecided: boolean;
  readonly approvalState: T;
  readonly dateOfDecision: DateToUse | null;
}
export const IApprovable_ByUser_UserIdOfDecider_PropertyName = "userIdOfDecider"; // eslint-disable-line camelcase
export interface IApprovable_ByUser<T> extends IApprovable<T> {
  readonly userIdOfDecider: string | null;
}
export interface IDocument_Approvable<T> extends IDocument, IApprovable<T> { }
export interface IDocument_Approvable_ByUser<T> extends IDocument_Approvable<T>, IApprovable_ByUser<T> { }

// IDeleteable
export const IDeleteable_IsMarkedAsDeleted_PropertyName = "isMarkedAsDeleted"; // eslint-disable-line camelcase
export const IDeleteable_DateOfDeletion_PropertyName = "dateOfDeletion"; // eslint-disable-line camelcase
export interface IDeleteable {
  readonly isMarkedAsDeleted: boolean;
  readonly dateOfDeletion: DateToUse | null;
}
export const IDeleteable_ByUser_UserIdOfDeleter_PropertyName = "userIdOfDeleter"; // eslint-disable-line camelcase
export interface IDeleteable_ByUser extends IDeleteable {
  readonly userIdOfDeleter: string | null;
}
export interface IDocument_Deleteable extends IDocument, IDeleteable { }
export interface IDocument_Deleteable_ByUser extends IDocument_Deleteable, IDeleteable_ByUser { }

// ISuspendable
export const ISuspendable_IsSuspended_PropertyName = "isSuspended"; // eslint-disable-line camelcase
export const ISuspendable_DateOfSuspension_PropertyName = "dateOfSuspension"; // eslint-disable-line camelcase
export const ISuspendable_ReasonForSuspension_PropertyName = "reasonForSuspension"; // eslint-disable-line camelcase
export interface ISuspendable {
  readonly isSuspended: boolean;
  readonly dateOfSuspension: DateToUse | null;
  readonly reasonForSuspension: string | null;
}
export const ISuspendable_ByUser_UserIdOfSuspender_PropertyName = "userIdOfSuspender"; // eslint-disable-line camelcase
export interface ISuspendable_ByUser extends ISuspendable {
  readonly userIdOfSuspender: string | null;
}
export interface IDocument_Suspendable extends IDocument, ISuspendable { }
export interface IDocument_Suspendable_ByUser extends IDocument_Suspendable, ISuspendable_ByUser { }

/**
 * Sets the ICreatable properies on the incoming documents and returns the typed result.
 * @param {Array<IN>} documents The documents to promote to ICreatable.
 * @param {DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<OUT>} The result.
 */
export function promoteDocumentsToCreatable<IN extends IDocument, OUT extends IN & ICreatable>(documents: Array<IN>, dateOfCreation: DateToUse | null = null): Array<OUT> {
  TC.assertNonNullish(documents);

  if (TC.isNullish(dateOfCreation)) {
    dateOfCreation = nowToUse();
  }
  const dateOfCreationNonNull = TC.convertNonNullish(dateOfCreation);

  const promotedDocuments = documents.map(
    (document): OUT => {
      // NOTE: If "dateOfCreation" has already been set for the document, this should NOT change the incoming value
      const promotedDocument = {...document, ...({dateOfCreation: dateOfCreationNonNull} as ICreatable)};
      return (promotedDocument as OUT);
    }
  );
  return promotedDocuments;
}

/**
 * Gets the User ID values from the incoming objects using properties from type T.
 * @param {Array<any>} objs The objects to evaluate.
 * @param {IdFunc<T>} userIdFunc The function that gets the User ID value from an object of type T.
 * @return {Array<string>} The result.
 */
export function extractUserIdsFromObjects<T>(objs: Array<any>, userIdFunc: IdFunc<T>): Array<string> {
  TC.assertNonNullish(objs);
  const userIds = ([] as Array<string>);

  for (let i = 0; i < objs.length; i++) {
    const obj = objs[i];
    const guardFunc = (value: T): boolean => {
      const userId = userIdFunc(value);
      return !TC.isNullish(userId);
    };

    if (TC.isOf<T>(obj, guardFunc)) {
      const userId = userIdFunc(obj);
      const userIdNonNull = TC.convertNonNullish(userId);
      userIds.push(userIdNonNull);
    }
  }
  return userIds;
}
