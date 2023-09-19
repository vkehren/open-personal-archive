import * as firestore from "@google-cloud/firestore";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

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


/* eslint-disable camelcase */
// NOTE: The types and interfaces below are useful for creating typed Firebase Firestore Documents

// IDocument
export const IDocument_DocumentId_PropertyName = VC.getTypedPropertyKeyAsText<IDocument>("id"); // eslint-disable-line camelcase
export interface IDocument {
  readonly id: Id,
}

// ICreatable
export const ICreatable_DateOfCreation_PropertyName = VC.getTypedPropertyKeyAsText<ICreatable>("dateOfCreation"); // eslint-disable-line camelcase
export interface ICreatable {
  // NOTE: Do not include "hasBeenCreated" because any object that exists has been created
  readonly dateOfCreation: DateToUse;
}
export const ICreatable_ByUser_UserIdOfCreator_PropertyName = VC.getTypedPropertyKeyAsText<ICreatable_ByUser>("userIdOfCreator"); // eslint-disable-line camelcase
export interface ICreatable_ByUser extends ICreatable {
  readonly userIdOfCreator: Id;
}
export const ICreatable_ByNullableUser_UserIdOfCreator_PropertyName = VC.getTypedPropertyKeyAsText<ICreatable_ByNullableUser>("userIdOfCreator"); // eslint-disable-line camelcase
export interface ICreatable_ByNullableUser extends ICreatable {
  readonly userIdOfCreator: Id | null;
}
export interface IDocument_Creatable extends IDocument, ICreatable { }
export interface IDocument_Creatable_ByUser extends IDocument_Creatable, ICreatable_ByUser { }
export interface IDocument_Creatable_ByNullableUser extends IDocument_Creatable, ICreatable_ByNullableUser { }

// IUpgradeable
export const IUpgradeable_HasBeenUpgraded_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable>("hasBeenUpgraded"); // eslint-disable-line camelcase
export const IUpgradeable_DateOfLatestUpgrade_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable>("dateOfLatestUpgrade"); // eslint-disable-line camelcase
export interface IUpgradeable {
  readonly hasBeenUpgraded: boolean;
  readonly dateOfLatestUpgrade: DateToUse | null;
}
export const IUpgradeable_ByUser_UserIdOfLatestUpgrader_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable_ByUser>("userIdOfLatestUpgrader"); // eslint-disable-line camelcase
export interface IUpgradeable_ByUser extends IUpgradeable {
  readonly userIdOfLatestUpgrader: Id | null;
}
export interface IDocument_Upgradeable extends IDocument, IUpgradeable { }
export interface IDocument_Upgradeable_ByUser extends IDocument_Upgradeable, IUpgradeable_ByUser { }

// IUpdateable
export const IUpdateable_HasBeenUpdated_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable>("hasBeenUpdated"); // eslint-disable-line camelcase
export const IUpdateable_DateOfLatestUpdate_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable>("dateOfLatestUpdate"); // eslint-disable-line camelcase
export interface IUpdateable {
  readonly hasBeenUpdated: boolean;
  readonly dateOfLatestUpdate: DateToUse | null;
}
export const IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable_ByUser>("userIdOfLatestUpdater"); // eslint-disable-line camelcase
export interface IUpdateable_ByUser extends IUpdateable {
  readonly userIdOfLatestUpdater: Id | null;
}
export interface IDocument_Updateable extends IDocument, IUpdateable { }
export interface IDocument_Updateable_ByUser extends IDocument_Updateable, IUpdateable_ByUser { }

// IAssignableToRole
export const IAssignableToRole_AssignedRoleId_PropertyName = VC.getTypedPropertyKeyAsText<IAssignableToRole>("assignedRoleId"); // eslint-disable-line camelcase
export const IAssignableToRole_DateOfLatestRoleAssignment_PropertyName = VC.getTypedPropertyKeyAsText<IAssignableToRole>("dateOfLatestRoleAssignment"); // eslint-disable-line camelcase
export interface IAssignableToRole {
  readonly assignedRoleId: string;
  readonly dateOfLatestRoleAssignment: DateToUse | null;
}
export const IAssignableToRole_ByUser_UserIdOfLatestRoleAssigner_PropertyName = VC.getTypedPropertyKeyAsText<IAssignableToRole_ByUser>("userIdOfLatestRoleAssigner"); // eslint-disable-line camelcase
export interface IAssignableToRole_ByUser extends IAssignableToRole {
  readonly userIdOfLatestRoleAssigner: Id | null;
}
export interface IDocument_AssignableToRole extends IDocument, IAssignableToRole { }
export interface IDocument_AssignableToRole_ByUser extends IDocument_AssignableToRole, IAssignableToRole_ByUser { }

// ITaggable
export const ITaggable_Tags_PropertyName = VC.getTypedPropertyKeyAsText<ITaggable>("tags"); // eslint-disable-line camelcase
export const ITaggable_DateOfLatestTagging_PropertyName = VC.getTypedPropertyKeyAsText<ITaggable>("dateOfLatestTagging"); // eslint-disable-line camelcase
export interface ITaggable {
  readonly tags: Array<string>;
  readonly dateOfLatestTagging: DateToUse | null;
}
export const ITaggable_ByUser_UserIdOfLatestTagger_PropertyName = VC.getTypedPropertyKeyAsText<ITaggable_ByUser>("userIdOfLatestTagger"); // eslint-disable-line camelcase
export interface ITaggable_ByUser extends ITaggable {
  readonly userIdOfLatestTagger: Id | null;
}
export interface IDocument_Taggable extends IDocument, ITaggable { }
export interface IDocument_Taggable_ByUser extends IDocument_Taggable, ITaggable_ByUser { }

// IArchivable
export const IArchivable_IsArchived_PropertyName = VC.getTypedPropertyKeyAsText<IArchivable>("isArchived"); // eslint-disable-line camelcase
export const IArchivable_DateOfArchivalChange_PropertyName = VC.getTypedPropertyKeyAsText<IArchivable>("dateOfArchivalChange"); // eslint-disable-line camelcase
export interface IArchivable {
  readonly isArchived: boolean;
  readonly dateOfArchivalChange: DateToUse | null;
}
export const IArchivable_ByUser_UserIdOfArchivalChanger_PropertyName = VC.getTypedPropertyKeyAsText<IArchivable_ByUser>("userIdOfArchivalChanger"); // eslint-disable-line camelcase
export interface IArchivable_ByUser extends IArchivable {
  readonly userIdOfArchivalChanger: Id | null;
}
export interface IDocument_Archivable extends IDocument, IArchivable { }
export interface IDocument_Archivable_ByUser extends IDocument_Archivable, IArchivable_ByUser { }

// IViewable
export const IViewable_HasBeenViewed_PropertyName = VC.getTypedPropertyKeyAsText<IViewable>("hasBeenViewed"); // eslint-disable-line camelcase
export const IViewable_DateOfLatestViewing_PropertyName = VC.getTypedPropertyKeyAsText<IViewable>("dateOfLatestViewing"); // eslint-disable-line camelcase
export interface IViewable {
  readonly hasBeenViewed: boolean;
  readonly dateOfLatestViewing: DateToUse | null;
}
export const IViewable_ByUser_UserIdOfLatestViewer_PropertyName = VC.getTypedPropertyKeyAsText<IViewable_ByUser>("userIdOfLatestViewer"); // eslint-disable-line camelcase
export interface IViewable_ByUser extends IViewable {
  readonly userIdOfLatestViewer: Id | null;
}
export interface IDocument_Viewable extends IDocument, IViewable { }
export interface IDocument_Viewable_ByUser extends IDocument_Viewable, IViewable_ByUser { }

// IApprovable
export const IApprovable_HasBeenDecided_PropertyName = VC.getTypedPropertyKeyAsText<IApprovable<string>>("hasBeenDecided"); // eslint-disable-line camelcase
export const IApprovable_ApprovalState_PropertyName = VC.getTypedPropertyKeyAsText<IApprovable<string>>("approvalState"); // eslint-disable-line camelcase
export const IApprovable_DateOfDecision_PropertyName = VC.getTypedPropertyKeyAsText<IApprovable<string>>("dateOfDecision"); // eslint-disable-line camelcase
export interface IApprovable<T> {
  readonly hasBeenDecided: boolean;
  readonly approvalState: T;
  readonly dateOfDecision: DateToUse | null;
}
export const IApprovable_ByUser_UserIdOfDecider_PropertyName = VC.getTypedPropertyKeyAsText<IApprovable_ByUser<string>>("userIdOfDecider"); // eslint-disable-line camelcase
export interface IApprovable_ByUser<T> extends IApprovable<T> {
  readonly userIdOfDecider: Id | null;
}
export interface IDocument_Approvable<T> extends IDocument, IApprovable<T> { }
export interface IDocument_Approvable_ByUser<T> extends IDocument_Approvable<T>, IApprovable_ByUser<T> { }

// ISuspendable
export const ISuspendable_IsSuspended_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("isSuspended"); // eslint-disable-line camelcase
export const ISuspendable_HasSuspensionStarted_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("hasSuspensionStarted"); // eslint-disable-line camelcase
export const ISuspendable_HasSuspensionEnded_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("hasSuspensionEnded"); // eslint-disable-line camelcase
export const ISuspendable_ReasonForSuspensionStart_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("reasonForSuspensionStart"); // eslint-disable-line camelcase
export const ISuspendable_ReasonForSuspensionEnd_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("reasonForSuspensionEnd"); // eslint-disable-line camelcase
export const ISuspendable_DateOfSuspensionStart_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("dateOfSuspensionStart"); // eslint-disable-line camelcase
export const ISuspendable_DateOfSuspensionEnd_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("dateOfSuspensionEnd"); // eslint-disable-line camelcase
export interface ISuspendable {
  readonly isSuspended: boolean; // NOTE: This property should be computed by calling isSuspended<T>(...)
  readonly hasSuspensionStarted: boolean;
  readonly hasSuspensionEnded: boolean;
  readonly reasonForSuspensionStart: string | null;
  readonly reasonForSuspensionEnd: string | null;
  readonly dateOfSuspensionStart: DateToUse | null;
  readonly dateOfSuspensionEnd: DateToUse | null;
}
export const ISuspendable_ByUser_UserIdOfSuspensionStarter_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable_ByUser>("userIdOfSuspensionStarter"); // eslint-disable-line camelcase
export const ISuspendable_ByUser_UserIdOfSuspensionEnder_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable_ByUser>("userIdOfSuspensionEnder"); // eslint-disable-line camelcase
export interface ISuspendable_ByUser extends ISuspendable {
  readonly userIdOfSuspensionStarter: Id | null;
  readonly userIdOfSuspensionEnder: Id | null;
}
export interface IDocument_Suspendable extends IDocument, ISuspendable { }
export interface IDocument_Suspendable_ByUser extends IDocument_Suspendable, ISuspendable_ByUser { }

/**
 * Gets whether the ISuspendable document is currently suspended.
 * @param {T} document The document to check.
 * @return {boolean} The result.
 */
export function isSuspended<T extends ISuspendable>(document: T): boolean {
  TC.assertNonNullish(document);
  const isSuspended = (document.hasSuspensionStarted && !document.hasSuspensionEnded);
  return isSuspended;
}

// IDeleteable
export const IDeleteable_IsMarkedAsDeleted_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable>("isMarkedAsDeleted"); // eslint-disable-line camelcase
export const IDeleteable_DateOfDeletion_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable>("dateOfDeletion"); // eslint-disable-line camelcase
export const IDeleteable_UnDelete_ExactValidSet_PropertyNames: Array<string> = [ // eslint-disable-line camelcase
  IUpdateable_HasBeenUpdated_PropertyName,
  IUpdateable_DateOfLatestUpdate_PropertyName,
  IDeleteable_IsMarkedAsDeleted_PropertyName,
  IDeleteable_DateOfDeletion_PropertyName,
];
export interface IDeleteable {
  readonly isMarkedAsDeleted: boolean;
  readonly dateOfDeletion: DateToUse | null;
}
export const IDeleteable_ByUser_UserIdOfDeleter_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable_ByUser>("userIdOfDeleter"); // eslint-disable-line camelcase
export const IDeleteable_ByUser_UnDelete_ExactValidSet_PropertyNames: Array<string> = [ // eslint-disable-line camelcase
  ...IDeleteable_UnDelete_ExactValidSet_PropertyNames,
  IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName,
  IDeleteable_ByUser_UserIdOfDeleter_PropertyName,
];
export interface IDeleteable_ByUser extends IDeleteable {
  readonly userIdOfDeleter: Id | null;
}
export interface IDocument_Deleteable extends IDocument, IDeleteable { }
export interface IDocument_Deleteable_ByUser extends IDocument_Deleteable, IDeleteable_ByUser { }

/**
 * Sets the ICreatable properies on the incoming documents and returns the typed result.
 * @param {Array<IN>} documents The documents to promote to ICreatable.
 * @param {DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<OUT>} The result.
 */
export function promoteDocumentsToCreatable<IN extends IDocument, OUT extends IN & ICreatable>(documents: Array<IN>, dateOfCreation: DateToUse | null = null): Array<OUT> {
  TC.assertNonNullish(documents);

  const dateOfCreationNonNull = (!TC.isNullish(dateOfCreation)) ? TC.convertNonNullish(dateOfCreation) : nowToUse();
  const creatable_Default = ({dateOfCreation: dateOfCreationNonNull} as ICreatable);

  const promotedDocuments = documents.map(
    (document): OUT => {
      // NOTE: If "dateOfCreation" has already been set for the document, this should NOT change the incoming value
      const promotedDocument = {...creatable_Default, ...document};
      return (promotedDocument as OUT);
    }
  );
  return promotedDocuments;
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
