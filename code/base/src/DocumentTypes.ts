import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

/* eslint-disable camelcase */

// IDocument
export const IDocument_DocumentId_PropertyName = VC.getTypedPropertyKeyAsText<IDocument>("id"); // eslint-disable-line camelcase
export interface IDocument {
  readonly id: BT.Id,
}

/**
 * Returns whether the Document and its corresponding ID are valid.
 * @param {T | null | undefined} document The Document to check.
 * @return {boolean}
 */
export function isDocumentValid<T extends IDocument>(document: T | null | undefined): boolean { // eslint-disable-line max-len
  if (TC.isNullish(document)) {
    return false;
  }

  const documentNonNull = TC.convertNonNullish(document);
  return BT.isIdentifierValid(documentNonNull.id);
}

/**
 * Asserts that the Document and its corresponding ID are valid.
 * @param {T | null | undefined} document The Document.
 * @param {string} [invalidDocMessage=default] The message to display on failure of Document assertion.
 * @param {string} [invalidIdMessage=default] The message to display on failure of ID property assertion.
 * @return {void}
 */
export function assertDocumentIsValid<T extends IDocument>(document: T | null | undefined, invalidDocMessage = "A valid document must be provided.", invalidIdMessage = "A valid document ID must be provided."): void { // eslint-disable-line max-len
  if (TC.isNullish(document)) {
    throw new Error(invalidDocMessage);
  }

  const documentNonNull = TC.convertNonNullish(document);
  BT.assertIdentifierIsValid(documentNonNull.id, invalidIdMessage);
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IDocument interface.
 * @param {IDocument} original The original object.
 * @param {IDocument} updated The updated object.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForDocument(original: IDocument, updated: IDocument): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  if (!BT.isIdentifierValid(original.id)) {
    return false;
  }
  if (!TC.isNullish(updated.id)) {
    const idsMatch = (updated.id == original.id);
    if (!idsMatch) {
      return false;
    }
  }
  return true;
}


// ICreatable
export const ICreatable_DateOfCreation_PropertyName = VC.getTypedPropertyKeyAsText<ICreatable>("dateOfCreation"); // eslint-disable-line camelcase
export interface ICreatable {
  // NOTE: Do not include "hasBeenCreated" because any object that exists has been created
  readonly dateOfCreation: BT.DateToUse;
}
export const ICreatable_ByUser_UserIdOfCreator_PropertyName = VC.getTypedPropertyKeyAsText<ICreatable_ByUser>("userIdOfCreator"); // eslint-disable-line camelcase
export interface ICreatable_ByUser extends ICreatable {
  readonly userIdOfCreator: BT.Id;
}
export const ICreatable_ByNullableUser_UserIdOfCreator_PropertyName = VC.getTypedPropertyKeyAsText<ICreatable_ByNullableUser>("userIdOfCreator"); // eslint-disable-line camelcase
export interface ICreatable_ByNullableUser extends ICreatable {
  readonly userIdOfCreator: BT.Id | null;
}
export interface IDocument_Creatable extends IDocument, ICreatable { }
export interface IDocument_Creatable_ByUser extends IDocument_Creatable, ICreatable_ByUser { }
export interface IDocument_Creatable_ByNullableUser extends IDocument_Creatable, ICreatable_ByNullableUser { }

/**
 * Returns whether the updates to the object are valid from the perspective of the ICreatable interface.
 * @param {ICreatable} original The original object.
 * @param {ICreatable} updated The updated object.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForCreatable(original: ICreatable, updated: ICreatable): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  if (TC.isNullish(original.dateOfCreation)) {
    return false;
  }
  if (!TC.isNullish(updated.dateOfCreation)) {
    const datesMatch = (updated.dateOfCreation == original.dateOfCreation);
    if (!datesMatch) {
      return false;
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the ICreatable_ByUser interface.
 * @param {ICreatable_ByUser} original The original object.
 * @param {ICreatable_ByUser} updated The updated object.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForCreatable_ByUser(original: ICreatable_ByUser, updated: ICreatable_ByUser): boolean {
  if (!areUpdatesValid_ForCreatable(original, updated)) {
    return false;
  }

  if (TC.isNullish(original.userIdOfCreator)) {
    return false;
  }
  const existencesMatch = (TC.isNullish(updated.userIdOfCreator) == TC.isNullish(updated.dateOfCreation));
  if (!existencesMatch) {
    return false;
  }
  if (!TC.isNullish(updated.userIdOfCreator)) {
    const userIdsMatch = (updated.userIdOfCreator == original.userIdOfCreator);
    if (!userIdsMatch) {
      return false;
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the ICreatable_ByNullableUser interface.
 * @param {ICreatable_ByNullableUser} original The original object.
 * @param {ICreatable_ByNullableUser} updated The updated object.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForCreatable_ByNullableUser(original: ICreatable_ByNullableUser, updated: ICreatable_ByNullableUser): boolean {
  if (!areUpdatesValid_ForCreatable(original, updated)) {
    return false;
  }

  // NOTE: The original "userIdOfCreator" can be null
  if (!TC.isNullish(updated.userIdOfCreator)) {
    const existencesMatch = (!TC.isNullish(updated.dateOfCreation));
    if (!existencesMatch) {
      return false;
    }
    const userIdsMatch = (updated.userIdOfCreator == original.userIdOfCreator);
    if (!userIdsMatch) {
      return false;
    }
  }
  return true;
}

/**
 * Sets the ICreatable properies on the incoming documents and returns the typed result.
 * @param {Array<IN>} documents The documents to promote to ICreatable.
 * @param {DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<OUT>} The result.
 */
export function promoteDocumentsToCreatable<IN extends IDocument, OUT extends IN & ICreatable>(documents: Array<IN>, dateOfCreation: BT.DateToUse | null = null): Array<OUT> {
  TC.assertNonNullish(documents);

  const dateOfCreationNonNull = (!TC.isNullish(dateOfCreation)) ? TC.convertNonNullish(dateOfCreation) : BT.nowToUse();
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


// IUpgradeable
export const IUpgradeable_HasBeenUpgraded_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable>("hasBeenUpgraded"); // eslint-disable-line camelcase
export const IUpgradeable_DateOfLatestUpgrade_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable>("dateOfLatestUpgrade"); // eslint-disable-line camelcase
export interface IUpgradeable {
  readonly hasBeenUpgraded: boolean;
  readonly dateOfLatestUpgrade: BT.DateToUse | null;
}
export const IUpgradeable_ByUser_UserIdOfLatestUpgrader_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable_ByUser>("userIdOfLatestUpgrader"); // eslint-disable-line camelcase
export interface IUpgradeable_ByUser extends IUpgradeable {
  readonly userIdOfLatestUpgrader: BT.Id | null;
}
export interface IDocument_Upgradeable extends IDocument, IUpgradeable { }
export interface IDocument_Upgradeable_ByUser extends IDocument_Upgradeable, IUpgradeable_ByUser { }


// IUpdateable
export const IUpdateable_HasBeenUpdated_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable>("hasBeenUpdated"); // eslint-disable-line camelcase
export const IUpdateable_DateOfLatestUpdate_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable>("dateOfLatestUpdate"); // eslint-disable-line camelcase
export interface IUpdateable {
  readonly hasBeenUpdated: boolean;
  readonly dateOfLatestUpdate: BT.DateToUse | null;
}
export const IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable_ByUser>("userIdOfLatestUpdater"); // eslint-disable-line camelcase
export interface IUpdateable_ByUser extends IUpdateable {
  readonly userIdOfLatestUpdater: BT.Id | null;
}
export interface IDocument_Updateable extends IDocument, IUpdateable { }
export interface IDocument_Updateable_ByUser extends IDocument_Updateable, IUpdateable_ByUser { }


// IAssignableToRole
export const IAssignableToRole_AssignedRoleId_PropertyName = VC.getTypedPropertyKeyAsText<IAssignableToRole>("assignedRoleId"); // eslint-disable-line camelcase
export const IAssignableToRole_DateOfLatestRoleAssignment_PropertyName = VC.getTypedPropertyKeyAsText<IAssignableToRole>("dateOfLatestRoleAssignment"); // eslint-disable-line camelcase
export interface IAssignableToRole {
  readonly assignedRoleId: string;
  readonly dateOfLatestRoleAssignment: BT.DateToUse | null;
}
export const IAssignableToRole_ByUser_UserIdOfLatestRoleAssigner_PropertyName = VC.getTypedPropertyKeyAsText<IAssignableToRole_ByUser>("userIdOfLatestRoleAssigner"); // eslint-disable-line camelcase
export interface IAssignableToRole_ByUser extends IAssignableToRole {
  readonly userIdOfLatestRoleAssigner: BT.Id | null;
}
export interface IDocument_AssignableToRole extends IDocument, IAssignableToRole { }
export interface IDocument_AssignableToRole_ByUser extends IDocument_AssignableToRole, IAssignableToRole_ByUser { }


// ITaggable
export const ITaggable_Tags_PropertyName = VC.getTypedPropertyKeyAsText<ITaggable>("tags"); // eslint-disable-line camelcase
export const ITaggable_DateOfLatestTagging_PropertyName = VC.getTypedPropertyKeyAsText<ITaggable>("dateOfLatestTagging"); // eslint-disable-line camelcase
export interface ITaggable {
  readonly tags: Array<string>;
  readonly dateOfLatestTagging: BT.DateToUse | null;
}
export const ITaggable_ByUser_UserIdOfLatestTagger_PropertyName = VC.getTypedPropertyKeyAsText<ITaggable_ByUser>("userIdOfLatestTagger"); // eslint-disable-line camelcase
export interface ITaggable_ByUser extends ITaggable {
  readonly userIdOfLatestTagger: BT.Id | null;
}
export interface IDocument_Taggable extends IDocument, ITaggable { }
export interface IDocument_Taggable_ByUser extends IDocument_Taggable, ITaggable_ByUser { }


// IArchivable
export const IArchivable_IsArchived_PropertyName = VC.getTypedPropertyKeyAsText<IArchivable>("isArchived"); // eslint-disable-line camelcase
export const IArchivable_DateOfArchivalChange_PropertyName = VC.getTypedPropertyKeyAsText<IArchivable>("dateOfArchivalChange"); // eslint-disable-line camelcase
export interface IArchivable {
  readonly isArchived: boolean;
  readonly dateOfArchivalChange: BT.DateToUse | null;
}
export const IArchivable_ByUser_UserIdOfArchivalChanger_PropertyName = VC.getTypedPropertyKeyAsText<IArchivable_ByUser>("userIdOfArchivalChanger"); // eslint-disable-line camelcase
export interface IArchivable_ByUser extends IArchivable {
  readonly userIdOfArchivalChanger: BT.Id | null;
}
export interface IDocument_Archivable extends IDocument, IArchivable { }
export interface IDocument_Archivable_ByUser extends IDocument_Archivable, IArchivable_ByUser { }


// IViewable
export const IViewable_HasBeenViewed_PropertyName = VC.getTypedPropertyKeyAsText<IViewable>("hasBeenViewed"); // eslint-disable-line camelcase
export const IViewable_DateOfLatestViewing_PropertyName = VC.getTypedPropertyKeyAsText<IViewable>("dateOfLatestViewing"); // eslint-disable-line camelcase
export interface IViewable {
  readonly hasBeenViewed: boolean;
  readonly dateOfLatestViewing: BT.DateToUse | null;
}
export const IViewable_ByUser_UserIdOfLatestViewer_PropertyName = VC.getTypedPropertyKeyAsText<IViewable_ByUser>("userIdOfLatestViewer"); // eslint-disable-line camelcase
export interface IViewable_ByUser extends IViewable {
  readonly userIdOfLatestViewer: BT.Id | null;
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
  readonly dateOfDecision: BT.DateToUse | null;
}
export const IApprovable_ByUser_UserIdOfDecider_PropertyName = VC.getTypedPropertyKeyAsText<IApprovable_ByUser<string>>("userIdOfDecider"); // eslint-disable-line camelcase
export interface IApprovable_ByUser<T> extends IApprovable<T> {
  readonly userIdOfDecider: BT.Id | null;
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
  readonly dateOfSuspensionStart: BT.DateToUse | null;
  readonly dateOfSuspensionEnd: BT.DateToUse | null;
}
export const ISuspendable_ByUser_UserIdOfSuspensionStarter_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable_ByUser>("userIdOfSuspensionStarter"); // eslint-disable-line camelcase
export const ISuspendable_ByUser_UserIdOfSuspensionEnder_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable_ByUser>("userIdOfSuspensionEnder"); // eslint-disable-line camelcase
export interface ISuspendable_ByUser extends ISuspendable {
  readonly userIdOfSuspensionStarter: BT.Id | null;
  readonly userIdOfSuspensionEnder: BT.Id | null;
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
  readonly dateOfDeletion: BT.DateToUse | null;
}
export const IDeleteable_ByUser_UserIdOfDeleter_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable_ByUser>("userIdOfDeleter"); // eslint-disable-line camelcase
export const IDeleteable_ByUser_UnDelete_ExactValidSet_PropertyNames: Array<string> = [ // eslint-disable-line camelcase
  ...IDeleteable_UnDelete_ExactValidSet_PropertyNames,
  IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName,
  IDeleteable_ByUser_UserIdOfDeleter_PropertyName,
];
export interface IDeleteable_ByUser extends IDeleteable {
  readonly userIdOfDeleter: BT.Id | null;
}
export interface IDocument_Deleteable extends IDocument, IDeleteable { }
export interface IDocument_Deleteable_ByUser extends IDocument_Deleteable, IDeleteable_ByUser { }
