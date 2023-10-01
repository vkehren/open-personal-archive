import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as FB from "./Firebase";
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
 * Returns the ID of the Document, or null if no Document was specified.
 * @param {T | null | undefined} document The Document.
 * @return {string | null}
 */
export function getDocumentId<T extends IDocument>(document: T | null | undefined): string | null { // eslint-disable-line max-len
  if (!isDocumentValid(document)) {
    return null;
  }

  const documentNonNull = TC.convertNonNullish(document);
  return documentNonNull.id;
}

/**
 * Asserts that the Document and its corresponding ID are valid, then returns the ID of the Document.
 * @param {T | null | undefined} document The Document.
 * @param {string} [invalidDocMessage=default] The message to display on failure of Document assertion.
 * @param {string} [invalidIdMessage=default] The message to display on failure of ID property assertion.
 * @return {string}
 */
export function getDocumentIdWithAssert<T extends IDocument>(document: T | null | undefined, invalidDocMessage = "A valid document must be provided.", invalidIdMessage = "A valid document ID must be provided."): string { // eslint-disable-line max-len
  assertDocumentIsValid(document, invalidDocMessage, invalidIdMessage);

  const documentNonNull = TC.convertNonNullish(document);
  return documentNonNull.id;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IDocument interface.
 * @param {IDocument} original The original object.
 * @param {IDocument} updated The updated object.
 * @param {Array<string>} [readOnlyPropertyNames=[]] The list of property names that are invalid to update.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForDocument(original: IDocument, updated: IDocument, readOnlyPropertyNames = ([] as Array<string>), throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  if (!BT.isIdentifierValid(original.id)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.id)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.id)) {
    const idsMatch = (updated.id == original.id);
    if (!idsMatch) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  const updatedPropertyNames = VC.getOwnPropertyKeys(updated);
  const readOnlyPropertyUpdates = readOnlyPropertyNames.filter((value) => (updatedPropertyNames.includes(value)));
  if (readOnlyPropertyUpdates.length > 0) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  return true;
}


// ICreatable
// For ANY updates: (Required = true, UnSetable = false, SetableBySelf = true, SetableByOther = false)
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
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForCreatable(original: ICreatable, updated: ICreatable, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  if (TC.isNullish(original.dateOfCreation)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.dateOfCreation)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.dateOfCreation)) {
    const datesMatch = VC.areDatesEqual(updated.dateOfCreation, original.dateOfCreation);
    if (!datesMatch) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the ICreatable_ByUser interface.
 * @param {ICreatable_ByUser} original The original object.
 * @param {ICreatable_ByUser} updated The updated object.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForCreatable_ByUser(original: ICreatable_ByUser, updated: ICreatable_ByUser, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForCreatable(original, updated)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  if (TC.isNullish(original.userIdOfCreator)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const existencesMatch = (TC.isNullish(updated.userIdOfCreator) == TC.isNullish(updated.dateOfCreation));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.userIdOfCreator)) {
    const userIdsMatch = (updated.userIdOfCreator == original.userIdOfCreator);
    if (!userIdsMatch) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the ICreatable_ByNullableUser interface.
 * @param {ICreatable_ByNullableUser} original The original object.
 * @param {ICreatable_ByNullableUser} updated The updated object.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForCreatable_ByNullableUser(original: ICreatable_ByNullableUser, updated: ICreatable_ByNullableUser, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForCreatable(original, updated)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: The original "userIdOfCreator" can be null
  if (!TC.isNullish(updated.userIdOfCreator)) {
    const existencesMatch = (!TC.isNullish(updated.dateOfCreation));
    if (!existencesMatch) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    const userIdsMatch = (updated.userIdOfCreator == original.userIdOfCreator);
    if (!userIdsMatch) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
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
// For ANY updates: (Required = false, UnSetable = false, SetableBySelf = true, SetableByOther = true)
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
export const IUpgradeHistoryProvider_UpgradeHistory_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeHistoryProvider<unknown>>("upgradeHistory"); // eslint-disable-line camelcase
export interface IUpgradeHistoryProvider<T> {
  readonly upgradeHistory: Array<T>;
}
export const IUpgradeable_WithHistory_UpgradeHistory_PropertyName = VC.getTypedPropertyKeyAsText<IUpgradeable_ByUser_WithHistory<unknown>>("upgradeHistory"); // eslint-disable-line camelcase
export interface IUpgradeable_WithHistory<T> extends IUpgradeable, IUpgradeHistoryProvider<T> { }
export interface IUpgradeable_ByUser_WithHistory<T> extends IUpgradeable_ByUser, IUpgradeable_WithHistory<T> { }
export interface IDocument_Upgradeable extends IDocument, IUpgradeable { }
export interface IDocument_Upgradeable_ByUser extends IDocument_Upgradeable, IUpgradeable_ByUser { }
export interface IDocument_Upgradeable_WithHistory<T> extends IDocument_Upgradeable, IUpgradeable_WithHistory<T> { }
export interface IDocument_Upgradeable_ByUser_WithHistory<T> extends IDocument_Upgradeable_ByUser, IDocument_Upgradeable_WithHistory<T> { }

/**
 * Returns whether the updates to the object are valid from the perspective of the IUpgradeable interface.
 * @param {IUpgradeable} original The original object.
 * @param {IUpgradeable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IUpgradeable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForUpgradeable(original: IUpgradeable, updated: IUpgradeable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values may both be false or both be true, but not one of each
  const priorExistencesValid = ((!original.hasBeenUpgraded) == TC.isNullish(original.dateOfLatestUpgrade));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.hasBeenUpgraded)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.hasBeenUpgraded) == TC.isNullish(updated.dateOfLatestUpgrade));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.hasBeenUpgraded)) {
    const stateValid = (updated.hasBeenUpgraded); // NOTE: This value must be "true" for updates
    if (!stateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfLatestUpgrade)) {
    const datesValid = (TC.isNullish(original.dateOfLatestUpgrade) || (TC.convertNonNullish(updated.dateOfLatestUpgrade) > TC.convertNonNullish(original.dateOfLatestUpgrade)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (TC.isOf<IUpgradeHistoryProvider<unknown>>(original, (value) => (!TC.isNullish(value.upgradeHistory)))) {
    if (VC.getOwnPropertyKeys(updated).includes(IUpgradeHistoryProvider_UpgradeHistory_PropertyName)) {
      // NOTE: The "updated" object MUST NOT erase the read-only history of changes, so it MUST use ArrayUnion to perform updates on this property
      const upgradeHistory = VC.getOwnPropertyValue(updated, IUpgradeHistoryProvider_UpgradeHistory_PropertyName);
      if (!FB.isOfFieldValue_ArrayUnion<firestore.FieldValue>(upgradeHistory)) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IUpgradeable_ByUser interface.
 * @param {IUpgradeable_ByUser} original The original object.
 * @param {IUpgradeable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IUpgradeable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForUpgradeable_ByUser(original: IUpgradeable_ByUser, updated: IUpgradeable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForUpgradeable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfLatestUpgrader) == TC.isNullish(original.dateOfLatestUpgrade));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfLatestUpgrader) == TC.isNullish(updated.dateOfLatestUpgrade));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// IUpdateable
// For ANY updates: (Required = true, UnSetable = false, SetableBySelf = true, SetableByOther = true)
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
export const IUpdateHistoryProvider_UpdateHistory_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateHistoryProvider<unknown>>("updateHistory"); // eslint-disable-line camelcase
export interface IUpdateHistoryProvider<T> {
  readonly updateHistory: Array<T>;
}
export const IUpdateable_WithHistory_UpdateHistory_PropertyName = VC.getTypedPropertyKeyAsText<IUpdateable_ByUser_WithHistory<unknown>>("updateHistory"); // eslint-disable-line camelcase
export interface IUpdateable_WithHistory<T> extends IUpdateable, IUpdateHistoryProvider<T> { }
export interface IUpdateable_ByUser_WithHistory<T> extends IUpdateable_ByUser, IUpdateable_WithHistory<T> { }
export interface IDocument_Updateable extends IDocument, IUpdateable { }
export interface IDocument_Updateable_ByUser extends IDocument_Updateable, IUpdateable_ByUser { }
export interface IDocument_Updateable_WithHistory<T> extends IDocument_Updateable, IUpdateable_WithHistory<T> { }
export interface IDocument_Updateable_ByUser_WithHistory<T> extends IDocument_Updateable_ByUser, IDocument_Updateable_WithHistory<T> { }

/**
 * Returns whether the updates to the object are valid from the perspective of the IUpdateable interface.
 * @param {IUpdateable} original The original object.
 * @param {IUpdateable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IUpdateable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForUpdateable(original: IUpdateable, updated: IUpdateable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values may both be false or both be true, but not one of each
  const priorExistencesValid = ((!original.hasBeenUpdated) == TC.isNullish(original.dateOfLatestUpdate));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.hasBeenUpdated)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values must exist on any update
  const existencesValid = (!TC.isNullish(updated.hasBeenUpdated) && !TC.isNullish(updated.dateOfLatestUpdate));
  if (!existencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.hasBeenUpdated)) {
    const stateValid = (updated.hasBeenUpdated); // NOTE: This value must be "true" for updates
    if (!stateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfLatestUpdate)) {
    const datesValid = (TC.isNullish(original.dateOfLatestUpdate) || (TC.convertNonNullish(updated.dateOfLatestUpdate) > TC.convertNonNullish(original.dateOfLatestUpdate)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (TC.isOf<IUpdateHistoryProvider<unknown>>(original, (value) => (!TC.isNullish(value.updateHistory)))) {
    if (VC.getOwnPropertyKeys(updated).includes(IUpdateHistoryProvider_UpdateHistory_PropertyName)) {
      // NOTE: The "updated" object MUST NOT erase the read-only history of changes, so it MUST use ArrayUnion to perform updates on this property
      const updateHistory = VC.getOwnPropertyValue(updated, IUpdateHistoryProvider_UpdateHistory_PropertyName);
      if (!FB.isOfFieldValue_ArrayUnion<firestore.FieldValue>(updateHistory)) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IUpdateable_ByUser interface.
 * @param {IUpdateable_ByUser} original The original object.
 * @param {IUpdateable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IUpdateable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForUpdateable_ByUser(original: IUpdateable_ByUser, updated: IUpdateable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForUpdateable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfLatestUpdater) == TC.isNullish(original.dateOfLatestUpdate));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values must exist on any update
  const existencesValid = (!TC.isNullish(updated.userIdOfLatestUpdater));
  if (!existencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// IAssignableToRole
// For Auth updates: (Required = false, UnSetable = false, SetableBySelf = false, SetableByOther = true)
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

/**
 * Returns whether the updates to the object are valid from the perspective of the IAssignableToRole interface.
 * @param {IAssignableToRole} original The original object.
 * @param {IAssignableToRole} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IAssignableToRole interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForAssignableToRole(original: IAssignableToRole, updated: IAssignableToRole, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values must exist on any original
  const priorExistencesValid = (!TC.isNullish(original.assignedRoleId) && !TC.isNullish(original.dateOfLatestRoleAssignment));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.assignedRoleId)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.assignedRoleId) == TC.isNullish(updated.dateOfLatestRoleAssignment));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.assignedRoleId)) {
    if (preventUpdates && (updated.assignedRoleId != original.assignedRoleId)) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfLatestRoleAssignment)) {
    const datesValid = (TC.convertNonNullish(updated.dateOfLatestRoleAssignment) > TC.convertNonNullish(original.dateOfLatestRoleAssignment));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IAssignableToRole_ByUser interface.
 * @param {IAssignableToRole_ByUser} original The original object.
 * @param {IAssignableToRole_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IAssignableToRole_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForAssignableToRole_ByUser(original: IAssignableToRole_ByUser, updated: IAssignableToRole_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForAssignableToRole(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: When the System assigns the Role at creation, the "userId..." should be null, so use conditional IF operator
  const priorExistencesValid = ((!(!TC.isNullish(original.userIdOfLatestRoleAssigner))) || (!TC.isNullish(original.dateOfLatestRoleAssignment)));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfLatestRoleAssigner) == TC.isNullish(updated.dateOfLatestRoleAssignment));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// ITaggable
// For Auth updates: (Required = false, UnSetable = true, SetableBySelf = false, SetableByOther = true)
// For Data updates: (Required = false, UnSetable = true, SetableBySelf = true, SetableByOther = true)
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

/**
 * Returns whether the updates to the object are valid from the perspective of the ITaggable interface.
 * @param {ITaggable} original The original object.
 * @param {ITaggable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the ITaggable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForTaggable(original: ITaggable, updated: ITaggable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values may both be false or both be true, but not one of each
  const priorExistencesValid = (VC.isEmpty(original.tags) == TC.isNullish(original.dateOfLatestTagging));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.tags)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.tags) == TC.isNullish(updated.dateOfLatestTagging));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.tags)) {
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfLatestTagging)) {
    const datesValid = (TC.isNullish(original.dateOfLatestTagging) || (TC.convertNonNullish(updated.dateOfLatestTagging) > TC.convertNonNullish(original.dateOfLatestTagging)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the ITaggable_ByUser interface.
 * @param {ITaggable_ByUser} original The original object.
 * @param {ITaggable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the ITaggable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForTaggable_ByUser(original: ITaggable_ByUser, updated: ITaggable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForTaggable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfLatestTagger) == TC.isNullish(original.dateOfLatestTagging));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfLatestTagger) == TC.isNullish(updated.dateOfLatestTagging));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// IArchivable
// For Auth updates: (Required = false, UnSetable = true, SetableBySelf = false, SetableByOther = true)
// For Data updates: (Required = false, UnSetable = true, SetableBySelf = true, SetableByOther = true)
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
// Not to be stored
export type ArchivalState = "archived" | "not_archived";
export const ArchivalStates = {
  _typeName: "ArchivalState",
  _all: (["archived", "not_archived"] as Array<ArchivalState>),
  archived: ("archived" as ArchivalState),
  not_archived: ("not_archived" as ArchivalState),
};

/**
 * Returns whether the updates to the object are valid from the perspective of the IArchivable interface.
 * @param {IArchivable} original The original object.
 * @param {IArchivable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IArchivable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForArchivable(original: IArchivable, updated: IArchivable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values represent conditional IF operator, as in IF(isSet, hasDate)
  const priorExistencesValid = ((!original.isArchived) || (!TC.isNullish(original.dateOfArchivalChange)));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.isArchived)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.isArchived) == TC.isNullish(updated.dateOfArchivalChange));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.isArchived)) {
    const stateValid = (updated.isArchived != original.isArchived); // NOTE: This value must change for updates
    if (!stateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfArchivalChange)) {
    const datesValid = (TC.isNullish(original.dateOfArchivalChange) || (TC.convertNonNullish(updated.dateOfArchivalChange) > TC.convertNonNullish(original.dateOfArchivalChange)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IArchivable_ByUser interface.
 * @param {IArchivable_ByUser} original The original object.
 * @param {IArchivable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IArchivable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForArchivable_ByUser(original: IArchivable_ByUser, updated: IArchivable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForArchivable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfArchivalChanger) == TC.isNullish(original.dateOfArchivalChange));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfArchivalChanger) == TC.isNullish(updated.dateOfArchivalChange));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// IViewable
// For Auth updates: (Required = false, UnSetable = false, SetableBySelf = false, SetableByOther = true)
// For Data updates: (Required = false, UnSetable = false, SetableBySelf = true, SetableByOther = true)
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

/**
 * Returns whether the updates to the object are valid from the perspective of the IViewable interface.
 * @param {IViewable} original The original object.
 * @param {IViewable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IViewable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForViewable(original: IViewable, updated: IViewable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values may both be false or both be true, but not one of each
  const priorExistencesValid = ((!original.hasBeenViewed) == TC.isNullish(original.dateOfLatestViewing));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.hasBeenViewed)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.hasBeenViewed) == TC.isNullish(updated.dateOfLatestViewing));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.hasBeenViewed)) {
    const stateValid = (updated.hasBeenViewed); // NOTE: This value must be "true" for updates
    if (!stateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfLatestViewing)) {
    const datesValid = (TC.isNullish(original.dateOfLatestViewing) || (TC.convertNonNullish(updated.dateOfLatestViewing) > TC.convertNonNullish(original.dateOfLatestViewing)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IViewable_ByUser interface.
 * @param {IViewable_ByUser} original The original object.
 * @param {IViewable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IViewable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForViewable_ByUser(original: IViewable_ByUser, updated: IViewable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForViewable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfLatestViewer) == TC.isNullish(original.dateOfLatestViewing));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfLatestViewer) == TC.isNullish(updated.dateOfLatestViewing));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// IApprovable
// For Auth updates: (Required = false, UnSetable = false, SetableBySelf = false, SetableByOther = true)
// For Data updates: (Required = false, UnSetable = false, SetableBySelf = true, SetableByOther = true)
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

/**
 * Returns whether the updates to the object are valid from the perspective of the IApprovable<BT.ApprovalState> interface.
 * @param {IApprovable<BT.ApprovalState>} original The original object.
 * @param {IApprovable<BT.ApprovalState>} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IApprovable<BT.ApprovalState> interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForApprovable(original: IApprovable<BT.ApprovalState>, updated: IApprovable<BT.ApprovalState>, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values may both be false or both be true, but not one of each
  const priorExistencesValid = (((!original.hasBeenDecided) == (original.approvalState == BT.ApprovalStates.pending)) && ((!original.hasBeenDecided) == TC.isNullish(original.dateOfDecision)));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.hasBeenDecided) || TC.isNull(updated.approvalState)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = ((TC.isNullish(updated.hasBeenDecided) == TC.isNullish(updated.approvalState)) && (TC.isNullish(updated.hasBeenDecided) == TC.isNullish(updated.dateOfDecision)));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.hasBeenDecided)) {
    const stateValid = (updated.hasBeenDecided); // NOTE: This value must be "true" for updates
    if (!stateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    const approvalStateValid = (BT.ApprovalStates._decided.includes(updated.approvalState));
    if (!approvalStateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  if (!TC.isNullish(updated.dateOfDecision)) {
    const datesValid = (TC.isNullish(original.dateOfDecision) || (TC.convertNonNullish(updated.dateOfDecision) > TC.convertNonNullish(original.dateOfDecision)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IApprovable_ByUser<BT.ApprovalState> interface.
 * @param {IApprovable_ByUser<BT.ApprovalState>} original The original object.
 * @param {IApprovable_ByUser<BT.ApprovalState>} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IApprovable_ByUser<BT.ApprovalState> interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForApprovable_ByUser(original: IApprovable_ByUser<BT.ApprovalState>, updated: IApprovable_ByUser<BT.ApprovalState>, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean { // eslint-disable-line max-len
  if (!areUpdatesValid_ForApprovable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfDecider) == TC.isNullish(original.dateOfDecision));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfDecider) == TC.isNullish(updated.dateOfDecision));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// ISuspendable
// For Auth updates: (Required = false, UnSetable = true, SetableBySelf = false, SetableByOther = true)
export const ISuspendable_IsSuspended_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("isSuspended"); // eslint-disable-line camelcase
export const ISuspendable_HasSuspensionStarted_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("hasSuspensionStarted"); // eslint-disable-line camelcase
export const ISuspendable_HasSuspensionEnded_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("hasSuspensionEnded"); // eslint-disable-line camelcase
export const ISuspendable_ReasonForSuspensionStart_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("reasonForSuspensionStart"); // eslint-disable-line camelcase
export const ISuspendable_ReasonForSuspensionEnd_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("reasonForSuspensionEnd"); // eslint-disable-line camelcase
export const ISuspendable_DateOfSuspensionStart_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("dateOfSuspensionStart"); // eslint-disable-line camelcase
export const ISuspendable_DateOfSuspensionEnd_PropertyName = VC.getTypedPropertyKeyAsText<ISuspendable>("dateOfSuspensionEnd"); // eslint-disable-line camelcase
export interface ISuspendable {
  readonly isSuspended: boolean; // NOTE: This property should be computed by calling isSuspended<T>(...)
  readonly numberOfTimesSuspended: number,
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
// Not to be stored
export type SuspensionState = "suspended" | "unsuspended";
export const SuspensionStates = {
  _typeName: "SuspensionState",
  _all: (["suspended", "unsuspended"] as Array<SuspensionState>),
  suspended: ("suspended" as SuspensionState),
  unsuspended: ("unsuspended" as SuspensionState),

};

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

/**
 * Returns whether the updates to the object are valid from the perspective of the ISuspendable interface.
 * @param {ISuspendable} original The original object.
 * @param {ISuspendable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the ISuspendable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForSuspendable(original: ISuspendable, updated: ISuspendable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values represent conditional IF operator, as in IF(isSet, hasDate)
  const priorExistencesValidStart = ((!original.hasSuspensionStarted) || (!TC.isNullish(original.dateOfSuspensionStart)));
  const priorExistencesValidEnd = ((!original.hasSuspensionEnded) || (!TC.isNullish(original.dateOfSuspensionEnd)));
  if (!(!TC.isNullish(original.isSuspended) && priorExistencesValidStart && priorExistencesValidEnd)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.isSuspended) || TC.isNull(updated.numberOfTimesSuspended) || TC.isNull(updated.hasSuspensionStarted) || TC.isNull(updated.hasSuspensionEnded)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: Since the updated values are complicated to validate, this code tries to break validation into more steps
  const existencesValidToCheck = (!TC.isNullish(updated.isSuspended) || !TC.isNullish(updated.numberOfTimesSuspended) || !TC.isNullish(updated.hasSuspensionStarted) || !TC.isNullish(updated.hasSuspensionEnded) || !TC.isNullish(updated.dateOfSuspensionStart) || !TC.isNullish(updated.dateOfSuspensionEnd)); // eslint-disable-line max-len
  if (existencesValidToCheck) {
    if (!original.isSuspended) {
      const logicValidStart = (updated.isSuspended && updated.hasSuspensionStarted && !updated.hasSuspensionEnded);
      if (!logicValidStart) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
      const datesValidStart = (!TC.isNullish(updated.dateOfSuspensionStart) && TC.isNullish(updated.dateOfSuspensionEnd));
      if (!datesValidStart) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
      const dateValuesValidStart = (TC.isNullish(original.dateOfSuspensionEnd) || (TC.convertNonNullish(updated.dateOfSuspensionStart) > TC.convertNonNullish(original.dateOfSuspensionEnd)));
      if (!dateValuesValidStart) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
    } else {
      // NOTE: If "hasSuspensionStarted" is provided, then it must not change the "original" value
      const logicValidEnd = (!updated.isSuspended && updated.hasSuspensionEnded && (TC.isNullish(updated.hasSuspensionStarted) || updated.hasSuspensionStarted));
      if (!logicValidEnd) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
      // NOTE: If "dateOfSuspensionStart" is provided, then it must not change the "original" value
      const datesValidEnd = (!TC.isNullish(updated.dateOfSuspensionEnd) && (TC.isNullish(updated.dateOfSuspensionStart) || (VC.areDatesEqual(updated.dateOfSuspensionStart, original.dateOfSuspensionStart)))); // eslint-disable-line max-len
      if (!datesValidEnd) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
      const dateValuesValidStart = (!TC.isNullish(original.dateOfSuspensionStart) && (TC.convertNonNullish(updated.dateOfSuspensionEnd) > TC.convertNonNullish(original.dateOfSuspensionStart)));
      if (!dateValuesValidStart) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the ISuspendable_ByUser interface.
 * @param {ISuspendable_ByUser} original The original object.
 * @param {ISuspendable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the ISuspendable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForSuspendable_ByUser(original: ISuspendable_ByUser, updated: ISuspendable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForSuspendable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesValidStart = (TC.isNullish(original.userIdOfSuspensionStarter) == TC.isNullish(original.dateOfSuspensionStart));
  const priorExistencesValidEnd = (TC.isNullish(original.userIdOfSuspensionEnder) == TC.isNullish(original.dateOfSuspensionEnd));
  if (!(priorExistencesValidStart && priorExistencesValidEnd)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatchStart = (TC.isNullish(updated.userIdOfSuspensionStarter) == TC.isNullish(updated.dateOfSuspensionStart));
  const existencesMatchEnd = (TC.isNullish(updated.userIdOfSuspensionEnder) == TC.isNullish(updated.dateOfSuspensionEnd));
  if (!(existencesMatchStart && existencesMatchEnd)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// IDeleteable
// For Auth updates: (Required = false, UnSetable = true but unset must be only changes, SetableBySelf = true, SetableByOther = false)
// For Data updates: (Required = false, UnSetable = true but unset must be only changes, SetableBySelf = true, SetableByOther = true)
export const IDeleteable_IsMarkedAsDeleted_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable>("isMarkedAsDeleted"); // eslint-disable-line camelcase
export const IDeleteable_DateOfDeletionChange_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable>("dateOfDeletionChange"); // eslint-disable-line camelcase
export const IDeleteable_UnDelete_ExactValidSet_PropertyNames: Array<string> = [ // eslint-disable-line camelcase
  IUpdateable_HasBeenUpdated_PropertyName,
  IUpdateable_DateOfLatestUpdate_PropertyName,
  IDeleteable_IsMarkedAsDeleted_PropertyName,
  IDeleteable_DateOfDeletionChange_PropertyName,
];
export interface IDeleteable {
  readonly isMarkedAsDeleted: boolean;
  readonly dateOfDeletionChange: BT.DateToUse | null;
}
export const IDeleteable_ByUser_UserIdOfDeletionChanger_PropertyName = VC.getTypedPropertyKeyAsText<IDeleteable_ByUser>("userIdOfDeletionChanger"); // eslint-disable-line camelcase
export const IDeleteable_ByUser_UnDelete_ExactValidSet_PropertyNames: Array<string> = [ // eslint-disable-line camelcase
  ...IDeleteable_UnDelete_ExactValidSet_PropertyNames,
  IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName,
  IDeleteable_ByUser_UserIdOfDeletionChanger_PropertyName,
];
export interface IDeleteable_ByUser extends IDeleteable {
  readonly userIdOfDeletionChanger: BT.Id | null;
}
export interface IDocument_Deleteable extends IDocument, IDeleteable { }
export interface IDocument_Deleteable_ByUser extends IDocument_Deleteable, IDeleteable_ByUser { }
// Not to be stored
export type DeletionState = "deleted" | "undeleted";
export const DeletionStates = {
  _typeName: "DeletionState",
  _all: (["deleted", "undeleted"] as Array<DeletionState>),
  deleted: ("deleted" as DeletionState),
  undeleted: ("undeleted" as DeletionState),

};

/**
 * Returns whether the updates to the object are valid from the perspective of the IDeleteable interface.
 * @param {IDeleteable} original The original object.
 * @param {IDeleteable} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IDeleteable interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForDeleteable(original: IDeleteable, updated: IDeleteable, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  TC.assertNonNullish(original, "The original object must not be null.");
  TC.assertNonNullish(updated, "The updated object must not be null.");

  // NOTE: These values represent conditional IF operator, as in IF(isSet, hasDate)
  const priorExistencesValid = ((!original.isMarkedAsDeleted) || (!TC.isNullish(original.dateOfDeletionChange)));
  if (!priorExistencesValid) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The value "undefined" is valid, but the value "null" is not
  if (TC.isNull(updated.isMarkedAsDeleted)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.isMarkedAsDeleted) == TC.isNullish(updated.dateOfDeletionChange));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!TC.isNullish(updated.isMarkedAsDeleted)) {
    const stateValid = (updated.isMarkedAsDeleted != original.isMarkedAsDeleted); // NOTE: This value must change for updates
    if (!stateValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    if (preventUpdates) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
    // NOTE: Un-deletion must be performed as a solitary action
    if (!updated.isMarkedAsDeleted) {
      const isDeleteable_ByUser = (TC.isOf<IDeleteable_ByUser>(updated, (value) => !TC.isNullish(value.userIdOfDeletionChanger)));
      const propertyNames_ValidSet = (isDeleteable_ByUser) ? IDeleteable_ByUser_UnDelete_ExactValidSet_PropertyNames : IDeleteable_UnDelete_ExactValidSet_PropertyNames;
      // NOTE: The "updateHistory" property should always be updated when other updates are made, so ignore it in the list of changes
      const propertyNames_ForUpdate = VC.getOwnPropertyKeys(updated).filter((value) => (value != IUpdateable_WithHistory_UpdateHistory_PropertyName));
      if (propertyNames_ValidSet.length != propertyNames_ForUpdate.length) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
      if (propertyNames_ForUpdate.filter((value) => propertyNames_ValidSet.includes(value)).length != propertyNames_ForUpdate.length) {
        return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
      }
    }
  }
  if (!TC.isNullish(updated.dateOfDeletionChange)) {
    const datesValid = (TC.isNullish(original.dateOfDeletionChange) || (TC.convertNonNullish(updated.dateOfDeletionChange) > TC.convertNonNullish(original.dateOfDeletionChange)));
    if (!datesValid) {
      return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Returns whether the updates to the object are valid from the perspective of the IDeleteable_ByUser interface.
 * @param {IDeleteable_ByUser} original The original object.
 * @param {IDeleteable_ByUser} updated The updated object.
 * @param {boolean} [preventUpdates=false] Whether updates to properties of the IDeleteable_ByUser interface should be prevented or not.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid_ForDeleteable_ByUser(original: IDeleteable_ByUser, updated: IDeleteable_ByUser, preventUpdates = false, throwErrorOnInvalidUpdate = false): boolean {
  if (!areUpdatesValid_ForDeleteable(original, updated, preventUpdates)) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  // NOTE: These values may both be null or both be non-null, but not one of each
  const priorExistencesMatch = (TC.isNullish(original.userIdOfDeletionChanger) == TC.isNullish(original.dateOfDeletionChange));
  if (!priorExistencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: These values may optionally exist on any update
  const existencesMatch = (TC.isNullish(updated.userIdOfDeletionChanger) == TC.isNullish(updated.dateOfDeletionChange));
  if (!existencesMatch) {
    return VC.falseUnlessThrowError(throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: The "userIdOf..." value must be validated via AuthorizationState, not here
  return true;
}


// General Functions
/**
 * Returns the first available status date from the contents of an object, or null if none exists.
 * @param {unknown} obj The object.
 * @param {Array<string> | string} [additionalPropertyNamesToCheck=[]] A list of property names for additional status dates to check.
 * @return {BT.DateToUse | null}
 */
export function getStatusDate(obj: unknown, additionalPropertyNamesToCheck = ([] as (Array<string> | string))): BT.DateToUse | null {
  if (TC.isNullish(obj)) {
    return null;
  }
  if (!TC.isNullish(additionalPropertyNamesToCheck)) {
    const objAsRecord = (obj as Record<string, unknown>);
    if (TC.isArray(additionalPropertyNamesToCheck)) {
      const propertyNames = (additionalPropertyNamesToCheck as Array<string>);
      for (let i = 0; i < propertyNames.length; i++) {
        const propertyName = propertyNames[i];
        if (!TC.isNullish(objAsRecord[propertyName])) {
          const date = objAsRecord[propertyName];
          return (date as BT.DateToUse);
        }
      }
    } else if (TC.isString(additionalPropertyNamesToCheck)) {
      const propertyName = (additionalPropertyNamesToCheck as string);
      if (!TC.isNullish(objAsRecord[propertyName])) {
        const date = objAsRecord[propertyName];
        return (date as BT.DateToUse);
      }
    } else {
      throw new Error("An invalid list of property names was specified.");
    }
  }
  if (!TC.isNullish((obj as IDeleteable).dateOfDeletionChange)) {
    return (obj as IDeleteable).dateOfDeletionChange;
  }
  if (!TC.isNullish((obj as ISuspendable).dateOfSuspensionEnd)) {
    return (obj as ISuspendable).dateOfSuspensionEnd;
  }
  if (!TC.isNullish((obj as IViewable).dateOfLatestViewing)) {
    return (obj as IViewable).dateOfLatestViewing;
  }
  if (!TC.isNullish((obj as IApprovable<unknown>).dateOfDecision)) {
    return (obj as IApprovable<unknown>).dateOfDecision;
  }
  if (!TC.isNullish((obj as IArchivable).dateOfArchivalChange)) {
    return (obj as IArchivable).dateOfArchivalChange;
  }
  if (!TC.isNullish((obj as ITaggable).dateOfLatestTagging)) {
    return (obj as ITaggable).dateOfLatestTagging;
  }
  if (!TC.isNullish((obj as IAssignableToRole).dateOfLatestRoleAssignment)) {
    return (obj as IAssignableToRole).dateOfLatestRoleAssignment;
  }
  if (!TC.isNullish((obj as IUpdateable).dateOfLatestUpdate)) {
    return (obj as IUpdateable).dateOfLatestUpdate;
  }
  if (!TC.isNullish((obj as IUpgradeable).dateOfLatestUpgrade)) {
    return (obj as IUpgradeable).dateOfLatestUpgrade;
  }
  if (!TC.isNullish((obj as ICreatable).dateOfCreation)) {
    return (obj as ICreatable).dateOfCreation;
  }
  return null;
}
