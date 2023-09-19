import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import {IAuthenticationProvider} from "./AuthenticationProvider";
import {ILocale} from "./Locale";
import {IRole, Role_OwnerId} from "./Role"; // eslint-disable-line camelcase
import {ITimeZoneGroup} from "./TimeZoneGroup";

/* eslint-disable camelcase */

const SingularName = "User";
const PluralName = "Users";
const IsSingleton = false;
export const User_OwnerId = "OPA_User_Owner"; // eslint-disable-line camelcase

// NOTE: IViewable_ByUser and IApprovable_ByUser fields should be updated using the corresponding interface directly as a partial interface
export interface IUserPartial {
  localeId?: string;
  timeZoneGroupId?: string;
  timeZoneId?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string | null;
  recentQueries?: Array<string> | firestore.FieldValue;
}

interface ICitationAccessor {
  readonly requestedCitationIds: Array<string>;
  readonly viewableCitationIds: Array<string>;
  readonly dateOfLatestCitationChange: OPA.DateToUse | null;
  readonly userIdOfLatestCitationChanger: string | null;
}
interface IDocument_CitationAccessor extends OPA.IDocument, ICitationAccessor { }
interface ICitationAccessorPartial {
  requestedCitationIds?: Array<string> | firestore.FieldValue;
  viewableCitationIds?: Array<string> | firestore.FieldValue;
  dateOfLatestCitationChange: OPA.DateToUse | null;
  userIdOfLatestCitationChanger: string | null;
}

type UpdateHistoryItem = IUserPartial | OPA.IUpdateable_ByUser | OPA.IAssignableToRole_ByUser | OPA.IViewable_ByUser | OPA.IApprovable_ByUser<BT.ApprovalState> | OPA.ISuspendable_ByUser | OPA.IDeleteable_ByUser; // eslint-disable-line max-len
interface IUserPartial_WithHistory extends IUserPartial, OPA.IUpdateable {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

export interface IUser extends OPA.IDocument_Creatable, OPA.IDocument_Updateable_ByUser, OPA.IDocument_AssignableToRole_ByUser, IDocument_CitationAccessor, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Approvable_ByUser<BT.ApprovalState>, OPA.IDocument_Suspendable_ByUser, OPA.IDocument_Deleteable_ByUser { // eslint-disable-line max-len
  readonly id: string;
  readonly firebaseAuthUserId: string;
  readonly authProviderId: string;
  readonly authAccountName: string;
  readonly authAccountNameLowered: string;
  localeId: string;
  timeZoneGroupId: string;
  timeZoneId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  recentQueries: Array<string>;
  readonly updateHistory: Array<UpdateHistoryItem>;
}

/**
 * Checks whether the specified updates to the specified User document are valid.
 * @param {IUser} document The User document being updated.
 * @param {IUserPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IUser, updateObject: IUserPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  const docIsArchiveOwner = ((document.id == User_OwnerId) || (document.assignedRoleId == Role_OwnerId));

  // NOTE: updateObject MUST implement IUpdateable_ByUser, so check immediately and do NOT use "if (true) {...}"
  const updateObject_Updateable = (updateObject as OPA.IUpdateable_ByUser);

  if (!updateObject_Updateable.hasBeenUpdated || OPA.isNullish(updateObject_Updateable.dateOfLatestUpdate) || OPA.isNullish(updateObject_Updateable.userIdOfLatestUpdater)) {
    return false;
  }

  // NOTE: updateObject MUST NOT change read-only data
  const updateObject_AssignableToRole = (updateObject as OPA.IAssignableToRole_ByUser);
  const updateObject_CitationAccessor = (updateObject as ICitationAccessorPartial);

  const propertyNames_ForUpdate = OPA.getOwnPropertyKeys(updateObject);
  const id_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).id);
  const firebaseAuthUserId_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).firebaseAuthUserId);
  const authProviderId_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).authProviderId);
  const authAccountName_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).authAccountName);
  const authAccountNameLowered_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).authAccountNameLowered);
  const assignedRoleId_UpdateUsesInterface = (!OPA.isNullish(updateObject_AssignableToRole.dateOfLatestRoleAssignment));
  const assignedRoleId_IsUpdatedDirectly = (!assignedRoleId_UpdateUsesInterface && propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).assignedRoleId));
  const requestedCitationIds_UpdateUsesInterface = (!OPA.isNullish(updateObject_CitationAccessor.dateOfLatestCitationChange));
  const requestedCitationIds_IsUpdatedDirectly = (!requestedCitationIds_UpdateUsesInterface && propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).requestedCitationIds));
  const viewableCitationIds_UpdateUsesInterface = requestedCitationIds_UpdateUsesInterface;
  const viewableCitationIds_IsUpdatedDirectly = (!viewableCitationIds_UpdateUsesInterface && propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).viewableCitationIds));

  if (id_IsUpdated || firebaseAuthUserId_IsUpdated || authProviderId_IsUpdated || authAccountName_IsUpdated || authAccountNameLowered_IsUpdated || assignedRoleId_IsUpdatedDirectly || requestedCitationIds_IsUpdatedDirectly || viewableCitationIds_IsUpdatedDirectly) { // eslint-disable-line max-len
    return false;
  }

  // NOTE: updateObject MUST NOT erase read-only history of changes
  const updateHistory_KeyText = OPA.getTypedPropertyKeysAsText(document).updateHistory;
  const updateHistory_IsUpdated = propertyNames_ForUpdate.includes(updateHistory_KeyText);
  const updateHistory_Value = (updateObject as Record<string, unknown>)[updateHistory_KeyText];

  if (updateHistory_IsUpdated && !OPA.isOfFieldValue_ArrayUnion<firestore.FieldValue>(updateHistory_Value)) {
    return false;
  }

  // NOTE: updateObject MUST NOT change data of already deleted document BEYOND the minimum necessary to un-delete document
  if (document.isMarkedAsDeleted) {
    let propertyNames_ForUpdate = OPA.getOwnPropertyKeys(updateObject);
    propertyNames_ForUpdate = propertyNames_ForUpdate.filter((propertyName) => !OPA.IDeleteable_ByUser_UnDelete_ExactValidSet_PropertyNames.includes(propertyName));

    // NOTE: Any property updates beyond those necessary for un-delete are invalid
    if (propertyNames_ForUpdate.length > 0) {
      return false;
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    const updateObject_Creatable = (updateObject as OPA.ICreatable_ByUser);

    if (!OPA.isNullish(updateObject_Creatable.dateOfCreation) || !OPA.isNullish(updateObject_Creatable.userIdOfCreator)) {
      const dateMatchesDoc = (updateObject_Creatable.dateOfCreation == document.dateOfCreation);
      const userMatchesDoc = (updateObject_Creatable.userIdOfCreator == document.id);

      if (!dateMatchesDoc || !userMatchesDoc) {
        return false;
      }
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    if (OPA.isUndefined(updateObject_AssignableToRole.assignedRoleId)) {
      const dateIsSet = !OPA.isUndefined(updateObject_AssignableToRole.dateOfLatestRoleAssignment);
      const userIsSet = !OPA.isUndefined(updateObject_AssignableToRole.userIdOfLatestRoleAssigner);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_AssignableToRole.assignedRoleId)) {
      throw new Error("The \"assignedRoleId\" property must not be set to null.");
    } else {
      const dateNotSet = OPA.isNullish(updateObject_AssignableToRole.dateOfLatestRoleAssignment);
      const userNotSet = OPA.isNullish(updateObject_AssignableToRole.userIdOfLatestRoleAssigner);
      const dateNotCreation = (document.dateOfCreation != updateObject_AssignableToRole.dateOfLatestRoleAssignment);
      const isSelfAssigned = (updateObject_AssignableToRole.userIdOfLatestRoleAssigner == document.id);

      if (dateNotSet || (userNotSet && dateNotCreation) || isSelfAssigned || docIsArchiveOwner) {
        return false;
      }
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    // NOTE: Unlike most interfaces used in this fuction, ICitationAccessor only requires that one of the two array properties is updated
    if (OPA.isUndefined(updateObject_CitationAccessor.requestedCitationIds) && OPA.isUndefined(updateObject_CitationAccessor.viewableCitationIds)) {
      const dateIsSet = !OPA.isUndefined(updateObject_CitationAccessor.dateOfLatestCitationChange);
      const userIsSet = !OPA.isUndefined(updateObject_CitationAccessor.userIdOfLatestCitationChanger);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNull(updateObject_CitationAccessor.requestedCitationIds)) {
      throw new Error("The \"requestedCitationIds\" property must not be set to null.");
    } else if (OPA.isNull(updateObject_CitationAccessor.viewableCitationIds)) {
      throw new Error("The \"viewableCitationIds\" property must not be set to null.");
    } else {
      const dateNotSet = OPA.isNullish(updateObject_CitationAccessor.dateOfLatestCitationChange);
      const userNotSet = OPA.isNullish(updateObject_CitationAccessor.userIdOfLatestCitationChanger);
      const dateNotCreation = (document.dateOfCreation != updateObject_AssignableToRole.dateOfLatestRoleAssignment);
      const isRequestedNotSelfAssigned = (!OPA.isNullish(updateObject_CitationAccessor.requestedCitationIds) && (updateObject_CitationAccessor.userIdOfLatestCitationChanger != document.id));
      const isViewableSelfAssigned = (!OPA.isNullish(updateObject_CitationAccessor.viewableCitationIds) && (updateObject_CitationAccessor.userIdOfLatestCitationChanger == document.id));

      if ((dateNotSet && dateNotCreation) || (userNotSet && dateNotCreation) || isRequestedNotSelfAssigned || isViewableSelfAssigned) {
        return false;
      }
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    const updateObject_Viewable = (updateObject as OPA.IViewable_ByUser);

    if (OPA.isUndefined(updateObject_Viewable.hasBeenViewed)) {
      const dateIsSet = !OPA.isUndefined(updateObject_Viewable.dateOfLatestViewing);
      const userIsSet = !OPA.isUndefined(updateObject_Viewable.userIdOfLatestViewer);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Viewable.hasBeenViewed)) {
      throw new Error("The \"hasBeenViewed\" property must not be set to null.");
    } else if (updateObject_Viewable.hasBeenViewed) {
      const dateNotSet = OPA.isNullish(updateObject_Viewable.dateOfLatestViewing);
      const userNotSet = OPA.isNullish(updateObject_Viewable.userIdOfLatestViewer);

      if (dateNotSet || userNotSet || docIsArchiveOwner) {
        return false;
      }
    } else {
      const docIsViewed = document.hasBeenViewed;
      const dateIsSet = !OPA.isNullish(updateObject_Viewable.dateOfLatestViewing);
      const userIsSet = !OPA.isNullish(updateObject_Viewable.userIdOfLatestViewer);
      const userCanUnView = false;

      if ((docIsViewed && !userCanUnView) || dateIsSet || userIsSet || docIsArchiveOwner) {
        return false;
      }
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    const updateObject_Approvable = (updateObject as OPA.IApprovable_ByUser<BT.ApprovalState>);

    if (OPA.isUndefined(updateObject_Approvable.hasBeenDecided)) {
      const stateIsSet = !OPA.isUndefined(updateObject_Approvable.approvalState);
      const dateIsSet = !OPA.isUndefined(updateObject_Approvable.dateOfDecision);
      const userIsSet = !OPA.isUndefined(updateObject_Approvable.userIdOfDecider);

      if (stateIsSet || dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Approvable.hasBeenDecided)) {
      throw new Error("The \"hasBeenDecided\" property must not be set to null.");
    } else if (updateObject_Approvable.hasBeenDecided) {
      const stateNotSet = OPA.isNullish(updateObject_Approvable.approvalState);
      const dateNotSet = OPA.isNullish(updateObject_Approvable.dateOfDecision);
      const userNotSet = OPA.isNullish(updateObject_Approvable.userIdOfDecider);
      const stateNotDecided = !BT.ApprovalStates.decided.includes(updateObject_Approvable.approvalState);
      const isSelfApproved = (updateObject_Approvable.userIdOfDecider == document.id);

      if (stateNotSet || dateNotSet || userNotSet || stateNotDecided || isSelfApproved || docIsArchiveOwner) {
        return false;
      }
    } else {
      const docIsDecided = document.hasBeenDecided;
      const stateNotSet = OPA.isNullish(updateObject_Approvable.approvalState);
      const dateIsSet = !OPA.isNullish(updateObject_Approvable.dateOfDecision);
      const userIsSet = !OPA.isNullish(updateObject_Approvable.userIdOfDecider);
      const stateNotPending = (updateObject_Approvable.approvalState != BT.ApprovalStates.pending);
      const userCanUnDecide = false;

      if ((docIsDecided && !userCanUnDecide) || stateNotSet || stateNotPending || dateIsSet || userIsSet || docIsArchiveOwner) {
        return false;
      }
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    const updateObject_Suspendable = (updateObject as OPA.ISuspendable_ByUser);

    if (OPA.isUndefined(updateObject_Suspendable.isSuspended) || OPA.isUndefined(updateObject_Suspendable.hasSuspensionStarted) || OPA.isUndefined(updateObject_Suspendable.hasSuspensionEnded)) {
      const stateIsSet = !OPA.isUndefined(updateObject_Suspendable.isSuspended);
      const startedIsSet = !OPA.isUndefined(updateObject_Suspendable.hasSuspensionStarted);
      const endedIsSet = !OPA.isUndefined(updateObject_Suspendable.hasSuspensionEnded);
      const startReasonIsSet = !OPA.isUndefined(updateObject_Suspendable.reasonForSuspensionStart);
      const endReasonIsSet = !OPA.isUndefined(updateObject_Suspendable.reasonForSuspensionEnd);
      const startDateIsSet = !OPA.isUndefined(updateObject_Suspendable.dateOfSuspensionStart);
      const endDateIsSet = !OPA.isUndefined(updateObject_Suspendable.dateOfSuspensionEnd);
      const startUserIsSet = !OPA.isUndefined(updateObject_Suspendable.userIdOfSuspensionStarter);
      const endUserIsSet = !OPA.isUndefined(updateObject_Suspendable.userIdOfSuspensionEnder);

      if (stateIsSet || startedIsSet || endedIsSet || startReasonIsSet || endReasonIsSet || startDateIsSet || endDateIsSet || startUserIsSet || endUserIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Suspendable.hasSuspensionStarted)) {
      throw new Error("The \"hasSuspensionStarted\" property must not be set to null.");
    } else if (OPA.isNullish(updateObject_Suspendable.hasSuspensionEnded)) {
      throw new Error("The \"hasSuspensionEnded\" property must not be set to null.");
    } else if (OPA.isSuspended(updateObject_Suspendable) != updateObject_Suspendable.isSuspended) {
      throw new Error("The \"isSuspended\" property has been set to an incorrect value.");
    } else if (updateObject_Suspendable.hasSuspensionEnded) {
      const startedNotSet = OPA.isNullish(updateObject_Suspendable.hasSuspensionStarted);
      // NOTE: Allow both reasons to be value, null, or undefined
      const startDateNotSet = OPA.isNullish(updateObject_Suspendable.dateOfSuspensionStart);
      const endDateNotSet = OPA.isNullish(updateObject_Suspendable.dateOfSuspensionEnd);
      const startUserNotSet = OPA.isNullish(updateObject_Suspendable.userIdOfSuspensionStarter);
      const endUserNotSet = OPA.isNullish(updateObject_Suspendable.userIdOfSuspensionEnder);
      const isSelfEnded = (updateObject_Suspendable.userIdOfSuspensionEnder == document.id);

      if (startedNotSet || startDateNotSet || endDateNotSet || startUserNotSet || endUserNotSet || isSelfEnded || docIsArchiveOwner) {
        return false;
      }
    } else if (updateObject_Suspendable.hasSuspensionStarted) {
      const endedNotSet = OPA.isNullish(updateObject_Suspendable.hasSuspensionEnded);
      // NOTE: Allow start reason to be value, null, or undefined
      const endReasonIsSet = !OPA.isNullish(updateObject_Suspendable.reasonForSuspensionEnd);
      const startDateNotSet = OPA.isNullish(updateObject_Suspendable.dateOfSuspensionStart);
      const endDateIsSet = !OPA.isNullish(updateObject_Suspendable.dateOfSuspensionEnd);
      const startUserNotSet = OPA.isNullish(updateObject_Suspendable.userIdOfSuspensionStarter);
      const endUserIsSet = !OPA.isNullish(updateObject_Suspendable.userIdOfSuspensionEnder);
      const isSelfStarted = (updateObject_Suspendable.userIdOfSuspensionStarter == document.id);

      if (endedNotSet || endReasonIsSet || startDateNotSet || endDateIsSet || startUserNotSet || endUserIsSet || isSelfStarted || docIsArchiveOwner) {
        return false;
      }
    } else {
      const startReasonIsSet = !OPA.isNullish(updateObject_Suspendable.reasonForSuspensionStart);
      const endReasonIsSet = !OPA.isNullish(updateObject_Suspendable.reasonForSuspensionEnd);
      const startDateIsSet = !OPA.isNullish(updateObject_Suspendable.dateOfSuspensionStart);
      const endDateIsSet = !OPA.isNullish(updateObject_Suspendable.dateOfSuspensionEnd);
      const startUserIsSet = !OPA.isNullish(updateObject_Suspendable.userIdOfSuspensionStarter);
      const endUserIsSet = !OPA.isNullish(updateObject_Suspendable.userIdOfSuspensionEnder);

      if (startReasonIsSet || endReasonIsSet || startDateIsSet || endDateIsSet || startUserIsSet || endUserIsSet || docIsArchiveOwner) {
        return false;
      }
    }
  }

  if (true) { // eslint-disable-line no-constant-condition
    const updateObject_Deleteable = (updateObject as OPA.IDeleteable_ByUser);

    if (OPA.isUndefined(updateObject_Deleteable.isMarkedAsDeleted)) {
      const dateIsSet = !OPA.isUndefined(updateObject_Deleteable.dateOfDeletion);
      const userIsSet = !OPA.isUndefined(updateObject_Deleteable.userIdOfDeleter);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Deleteable.isMarkedAsDeleted)) {
      throw new Error("The \"isMarkedAsDeleted\" property must not be set to null.");
    } else if (updateObject_Deleteable.isMarkedAsDeleted) {
      const docIsDeleted = document.isMarkedAsDeleted;
      const dateNotSet = OPA.isNullish(updateObject_Deleteable.dateOfDeletion);
      const userNotSet = OPA.isNullish(updateObject_Deleteable.userIdOfDeleter);
      const userNotCreator = (updateObject_Deleteable.userIdOfDeleter != document.id);

      if (docIsDeleted || dateNotSet || userNotSet || userNotCreator || docIsArchiveOwner) {
        return false;
      }
    } else {
      const docIsDeleted = document.isMarkedAsDeleted;
      const dateIsSet = !OPA.isNullish(updateObject_Deleteable.dateOfDeletion);
      const userIsSet = !OPA.isNullish(updateObject_Deleteable.userIdOfDeleter);
      const userCanUnDelete = (updateObject_Updateable.userIdOfLatestUpdater == document.id);

      if ((docIsDeleted && !userCanUnDelete) || dateIsSet || userIsSet || docIsArchiveOwner) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Creates an instance of the IUser document type.
 * @param {string} id The ID for the User within the OPA system.
 * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
 * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
 * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
 * @param {IRole} assignedRole The Role to which the User is initially assigned.
 * @param {ILocale} locale The Locale selected by the User.
 * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
 * @param {string} firstName The User's first name.
 * @param {string} lastName The User's last name.
 * @param {string | null} preferredName The name by which the User wishes to be called.
 * @return {IUser} The new document instance.
 */
function createInstance(id: string, firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, assignedRole: IRole, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): IUser { // eslint-disable-line max-len
  OPA.assertIsTrue(assignedRole.id != Role_OwnerId, "The Archive Owner cannot be constructed as a normal User.");

  const now = OPA.nowToUse();
  const document: IUser = {
    id: id,
    firebaseAuthUserId: firebaseAuthUserId,
    authProviderId: authProvider.id,
    authAccountName: authAccountName,
    authAccountNameLowered: authAccountName.toLowerCase(), // NOTE: Here this is data property, but all QuerySet functions proxy this into a computed property
    assignedRoleId: assignedRole.id,
    localeId: locale.id,
    timeZoneGroupId: timeZoneGroup.id,
    timeZoneId: timeZoneGroup.primaryTimeZoneId,
    firstName: firstName,
    lastName: lastName,
    preferredName: preferredName,
    requestedCitationIds: ([] as Array<string>),
    viewableCitationIds: ([] as Array<string>),
    dateOfLatestCitationChange: null,
    userIdOfLatestCitationChanger: null,
    recentQueries: ([] as Array<string>),
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    userIdOfLatestUpdater: null,
    dateOfLatestRoleAssignment: now,
    userIdOfLatestRoleAssigner: null,
    hasBeenViewed: false,
    dateOfLatestViewing: null,
    userIdOfLatestViewer: null,
    hasBeenDecided: false,
    approvalState: BT.ApprovalStates.pending,
    dateOfDecision: null,
    userIdOfDecider: null,
    isSuspended: false, // NOTE: Here this is data property, but all QuerySet functions proxy this into a computed property
    hasSuspensionStarted: false,
    hasSuspensionEnded: false,
    reasonForSuspensionStart: null,
    reasonForSuspensionEnd: null,
    dateOfSuspensionStart: null,
    dateOfSuspensionEnd: null,
    userIdOfSuspensionStarter: null,
    userIdOfSuspensionEnder: null,
    isMarkedAsDeleted: false,
    dateOfDeletion: null,
    userIdOfDeleter: null,
  };

  const documentCopy = OPA.copyObject(document);
  delete ((documentCopy as unknown) as Record<string, unknown>).updateHistory;
  document.updateHistory.push(documentCopy);
  return document;
}

/**
 * Creates the instance of the IUser document type that owns the Archive.
 * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
 * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
 * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
 * @param {ILocale} locale The Locale selected by the User.
 * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
 * @param {string} firstName The User's first name.
 * @param {string} lastName The User's last name.
 * @param {string | null} preferredName The name by which the User wishes to be called.
 * @return {IUser} The new document instance.
 */
export function createArchiveOwner(firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): IUser { // eslint-disable-line max-len
  const now = OPA.nowToUse();
  const document: IUser = {
    id: User_OwnerId,
    firebaseAuthUserId: firebaseAuthUserId,
    authProviderId: authProvider.id,
    authAccountName: authAccountName,
    authAccountNameLowered: authAccountName.toLowerCase(), // NOTE: Here this is data property, but all QuerySet functions proxy this into a computed property
    assignedRoleId: Role_OwnerId,
    localeId: locale.id,
    timeZoneGroupId: timeZoneGroup.id,
    timeZoneId: timeZoneGroup.primaryTimeZoneId,
    firstName: firstName,
    lastName: lastName,
    preferredName: preferredName,
    requestedCitationIds: ([] as Array<string>),
    viewableCitationIds: ([] as Array<string>),
    dateOfLatestCitationChange: null,
    userIdOfLatestCitationChanger: null,
    recentQueries: ([] as Array<string>),
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    userIdOfLatestUpdater: null,
    dateOfLatestRoleAssignment: now,
    userIdOfLatestRoleAssigner: null,
    hasBeenViewed: true,
    dateOfLatestViewing: now,
    userIdOfLatestViewer: User_OwnerId,
    hasBeenDecided: true,
    approvalState: BT.ApprovalStates.approved,
    dateOfDecision: now,
    userIdOfDecider: User_OwnerId,
    isSuspended: false, // NOTE: Here this is data property, but all QuerySet functions proxy this into a computed property
    hasSuspensionStarted: false,
    hasSuspensionEnded: false,
    reasonForSuspensionStart: null,
    reasonForSuspensionEnd: null,
    dateOfSuspensionStart: null,
    dateOfSuspensionEnd: null,
    userIdOfSuspensionStarter: null,
    userIdOfSuspensionEnder: null,
    isMarkedAsDeleted: false,
    dateOfDeletion: null,
    userIdOfDeleter: null,
  };

  const documentCopy = OPA.copyObject(document);
  delete ((documentCopy as unknown) as Record<string, unknown>).updateHistory;
  document.updateHistory.push(documentCopy);
  return document;
}

/** Class providing queries for User collection. */
export class UserQuerySet extends OPA.QuerySet<IUser> {
  /**
   * Creates a UserQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IUser>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IUser>) {
    super(collectionDescriptor);
    this.documentProxyConstructor = (user: IUser): IUser => {
      return new Proxy(user, {
        get(target, propertyName, receiver) { // eslint-disable-line @typescript-eslint/no-unused-vars
          if (propertyName == OPA.getTypedPropertyKeyAsText<IUser>("authAccountNameLowered")) {
            return target.authAccountName.toLowerCase();
          } else if (propertyName == OPA.ISuspendable_IsSuspended_PropertyName) {
            return OPA.isSuspended(target);
          } else {
            return Reflect.get(arguments[0], arguments[1], arguments[2]); // eslint-disable-line prefer-rest-params
          }
        },
        set(target, propertyName, propertyValue, receiver) { // eslint-disable-line @typescript-eslint/no-unused-vars
          if (propertyName == OPA.getTypedPropertyKeyAsText<IUser>("authAccountNameLowered")) {
            throw new Error("The \"" + OPA.getTypedPropertyKeyAsText<IUser>("authAccountNameLowered") + "\" property is not settable.");
          } else if (propertyName == OPA.ISuspendable_IsSuspended_PropertyName) {
            throw new Error("The \"" + OPA.ISuspendable_IsSuspended_PropertyName + "\" property is not settable.");
          } else {
            return Reflect.set(arguments[0], arguments[1], arguments[2], arguments[3]); // eslint-disable-line prefer-rest-params
          }
        },
      });
    };
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IUser, UserQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IUser, UserQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IUser, UserQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Gets the User that is the Owner of the Archive managed by the OPA installation.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @return {Promise<IUser>} The User corresponding to the UUID, or null if none exists.
   */
  async getArchiveOwner(ds: OPA.IDataStorageState): Promise<IUser> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const owner = await this.getById(ds, User_OwnerId);
    OPA.assertDocumentIsValid(owner, "The Owner of the Archive must NOT be null.");

    const ownerNonNull = OPA.convertNonNullish(owner);
    const proxiedOwner = this.documentProxyConstructor(ownerNonNull);
    return proxiedOwner;
  }

  /**
   * Gets the User by that User's Firebase Authentication UUID, since that UUID is also a unique key.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
   * @return {Promise<IUser | null>} The User corresponding to the UUID, or null if none exists.
   */
  async getByFirebaseAuthUserId(ds: OPA.IDataStorageState, firebaseAuthUserId: string): Promise<IUser | null> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertIdentifierIsValid(firebaseAuthUserId, "A valid Firebase Auth User ID must be provided.");

    const usersCollectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const getUserForUuidQuery = usersCollectionRef.where("firebaseAuthUserId", "==", firebaseAuthUserId);
    const matchingUsersSnap = await getUserForUuidQuery.get();

    if (matchingUsersSnap.docs.length > 1) {
      throw new Error("The Firebase Authentication UUID corresponds to more than one OPA User.");
    }
    if (matchingUsersSnap.docs.length < 1) {
      return null;
    }

    const user = matchingUsersSnap.docs[0].data();
    const proxiedUser = this.documentProxyConstructor(user);
    return proxiedUser;
  }

  /**
   * Creates the instance of the IUser document type that owns the Archive stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
   * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
   * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
   * @param {ILocale} locale The Locale selected by the User.
   * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
   * @param {string} firstName The User's first name.
   * @param {string} lastName The User's last name.
   * @param {string | null} preferredName The name by which the User wishes to be called.
   * @return {Promise<IUser>} The Owner document.
   */
  async createArchiveOwner(ds: OPA.IDataStorageState, firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): Promise<IUser> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const owner = createArchiveOwner(firebaseAuthUserId, authProvider, authAccountName, locale, timeZoneGroup, firstName, lastName, preferredName);
    const proxiedOwner = this.documentProxyConstructor(owner);
    const ownerId = proxiedOwner.id;

    OPA.assertNonNullish(proxiedOwner);
    OPA.assertNonNullish(proxiedOwner.updateHistory);
    OPA.assertIsTrue(proxiedOwner.id == User_OwnerId);
    OPA.assertIsTrue(ownerId == User_OwnerId);
    OPA.assertIsTrue(proxiedOwner.updateHistory.length == 1);

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const ownerRef = collectionRef.doc(ownerId);

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    batchUpdate.set(ownerRef, proxiedOwner, {merge: true});
    const firebaseAuthUserIdIndexCollectionRef = ds.db.collection(Index_User_FirebaseAuthUserId.indexCollectionName);
    const firebaseAuthUserIdIndexDocRef = firebaseAuthUserIdIndexCollectionRef.doc(Index_User_FirebaseAuthUserId.getDocumentId(proxiedOwner.firebaseAuthUserId));
    batchUpdate.set(firebaseAuthUserIdIndexDocRef, {value: ownerId});
    const authAccountNameIndexCollectionRef = ds.db.collection(Index_User_AuthAccountName.indexCollectionName);
    const authAccountNameIndexDocRef = authAccountNameIndexCollectionRef.doc(Index_User_AuthAccountName.getDocumentId(proxiedOwner.authAccountName));
    batchUpdate.set(authAccountNameIndexDocRef, {value: ownerId});
    const authAccountNameLoweredIndexCollectionRef = ds.db.collection(Index_User_AuthAccountNameLowered.indexCollectionName);
    const authAccountNameLoweredIndexDocRef = authAccountNameLoweredIndexCollectionRef.doc(Index_User_AuthAccountNameLowered.getDocumentId(proxiedOwner.authAccountNameLowered));
    batchUpdate.set(authAccountNameLoweredIndexDocRef, {value: ownerId});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
    return proxiedOwner;
  }

  /**
   * Creates an instance of the IUser document type stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
   * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
   * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
   * @param {IRole} assignedRole The Role to which the User is initially assigned.
   * @param {ILocale} locale The Locale selected by the User.
   * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
   * @param {string} firstName The User's first name.
   * @param {string} lastName The User's last name.
   * @param {string | null} preferredName The name by which the User wishes to be called.
   * @return {Promise<string>} The new document ID.
   */
  async createWithRole(ds: OPA.IDataStorageState, firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, assignedRole: IRole, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): Promise<string> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, firebaseAuthUserId, authProvider, authAccountName, assignedRole, locale, timeZoneGroup, firstName, lastName, preferredName);
    const proxiedDocument = this.documentProxyConstructor(document);

    OPA.assertNonNullish(proxiedDocument);
    OPA.assertNonNullish(proxiedDocument.updateHistory);
    OPA.assertIsTrue(proxiedDocument.id == documentId);
    OPA.assertIsTrue(proxiedDocument.updateHistory.length == 1);

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    batchUpdate.set(documentRef, proxiedDocument, {merge: true});
    const firebaseAuthUserIdIndexCollectionRef = ds.db.collection(Index_User_FirebaseAuthUserId.indexCollectionName);
    const firebaseAuthUserIdIndexDocRef = firebaseAuthUserIdIndexCollectionRef.doc(Index_User_FirebaseAuthUserId.getDocumentId(proxiedDocument.firebaseAuthUserId));
    batchUpdate.set(firebaseAuthUserIdIndexDocRef, {value: documentId});
    const authAccountNameIndexCollectionRef = ds.db.collection(Index_User_AuthAccountName.indexCollectionName);
    const authAccountNameIndexDocRef = authAccountNameIndexCollectionRef.doc(Index_User_AuthAccountName.getDocumentId(proxiedDocument.authAccountName));
    batchUpdate.set(authAccountNameIndexDocRef, {value: documentId});
    const authAccountNameLoweredIndexCollectionRef = ds.db.collection(Index_User_AuthAccountNameLowered.indexCollectionName);
    const authAccountNameLoweredIndexDocRef = authAccountNameLoweredIndexCollectionRef.doc(Index_User_AuthAccountNameLowered.getDocumentId(proxiedDocument.authAccountNameLowered));
    batchUpdate.set(authAccountNameLoweredIndexDocRef, {value: documentId});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
    return documentId;
  }

  /**
   * Updates the User stored on the server using an IUserPartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {IUserPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async update(ds: OPA.IDataStorageState, documentId: string, updateObject: IUserPartial, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject, ...updateObject_Updateable};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the User stored on the server by constructing an IViewable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {IRole} role The Role to which to assign the User within the OPA system.
   * @param {string} userIdOfLatestRoleAssigner The ID for the Assigner within the OPA system.
   * @return {Promise<void>}
   */
  async assignToRole(ds: OPA.IDataStorageState, documentId: string, role: IRole, userIdOfLatestRoleAssigner: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(role);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestRoleAssigner} as OPA.IUpdateable_ByUser);
    const updateObject_AssignableToRole = ({assignedRoleId: role.id, dateOfLatestRoleAssignment: now, userIdOfLatestRoleAssigner} as OPA.IAssignableToRole_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_AssignableToRole};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Adds a requested Citation to the User stored on the server by constructing an ICitationAccessor_Updateable object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} requestedCitationId The Citation to which the User has requested access.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async addRequestedCitation(ds: OPA.IDataStorageState, documentId: string, requestedCitationId: string, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullishOrWhitespace(requestedCitationId);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    const updateObject_CitationAccessor = ({requestedCitationIds: ds.constructorProvider.arrayUnion(requestedCitationId), dateOfLatestCitationChange: now, userIdOfLatestCitationChanger: userIdOfLatestUpdater} as ICitationAccessorPartial); // eslint-disable-line max-len
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_CitationAccessor};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Adds a viewable Citation to the User stored on the server by constructing an ICitationAccessor_Updateable object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} viewableCitationId The Citation to which the User has been granted permission to view.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async addViewableCitation(ds: OPA.IDataStorageState, documentId: string, viewableCitationId: string, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullishOrWhitespace(viewableCitationId);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    const updateObject_CitationAccessor = ({viewableCitationIds: ds.constructorProvider.arrayUnion(viewableCitationId), dateOfLatestCitationChange: now, userIdOfLatestCitationChanger: userIdOfLatestUpdater} as ICitationAccessorPartial); // eslint-disable-line max-len
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_CitationAccessor};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the User stored on the server by constructing an IViewable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} userIdOfLatestViewer The ID for the Viewer within the OPA system.
   * @return {Promise<void>}
   */
  async setToViewed(ds: OPA.IDataStorageState, documentId: string, userIdOfLatestViewer: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestViewer} as OPA.IUpdateable_ByUser);
    const updateObject_Viewable = ({hasBeenViewed: true, dateOfLatestViewing: now, userIdOfLatestViewer} as OPA.IViewable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Viewable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the User stored on the server by constructing an IApprovable_ByUser<T> object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {BT.ApprovalState} approvalState The ApprovalState for the User.
   * @param {string} userIdOfDecider The ID for the Decider within the OPA system.
   * @return {Promise<void>}
   */
  async setToDecidedOption(ds: OPA.IDataStorageState, documentId: string, approvalState: BT.ApprovalState, userIdOfDecider: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDecider} as OPA.IUpdateable_ByUser);
    const updateObject_Approvable = ({hasBeenDecided: true, approvalState, dateOfDecision: now, userIdOfDecider} as OPA.IApprovable_ByUser<BT.ApprovalState>);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Approvable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the User stored on the server by constructing an ISuspendable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} reason The reason for the suspension.
   * @param {string} userIdOfSuspensionStarter The ID for the Starter within the OPA system.
   * @return {Promise<void>}
   */
  async setToSuspended(ds: OPA.IDataStorageState, documentId: string, reason: string, userIdOfSuspensionStarter: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    // NOTE: We need the document earlier in this function to get the existing values for ISuspendable_ByUser
    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const documentNonNull = OPA.convertNonNullish(document);

    OPA.assertIsFalse(OPA.isSuspended(documentNonNull), "The User must not be suspended before the User is suspended.");

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfSuspensionStarter} as OPA.IUpdateable_ByUser);
    const updateObject_Suspendable = ({isSuspended: true, hasSuspensionStarted: true, hasSuspensionEnded: false, reasonForSuspensionStart: reason, reasonForSuspensionEnd: null, dateOfSuspensionStart: now, dateOfSuspensionEnd: null, userIdOfSuspensionStarter, userIdOfSuspensionEnder: null} as OPA.ISuspendable_ByUser); // eslint-disable-line max-len
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Suspendable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const areValid = areUpdatesValid(documentNonNull, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the User stored on the server by constructing an ISuspendable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} reason The reason to end the suspension.
   * @param {string} userIdOfSuspensionEnder The ID for the Ender within the OPA system.
   * @return {Promise<void>}
   */
  async setToUnSuspended(ds: OPA.IDataStorageState, documentId: string, reason: string, userIdOfSuspensionEnder: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    // NOTE: We need the document earlier in this function to get the existing values for ISuspendable_ByUser
    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const documentNonNull = OPA.convertNonNullish(document);

    OPA.assertIsTrue(OPA.isSuspended(documentNonNull), "The User must be suspended before the User is un-suspended.");
    const reasonForSuspensionStart = documentNonNull.reasonForSuspensionStart;
    const dateOfSuspensionStart = documentNonNull.dateOfSuspensionStart;
    const userIdOfSuspensionStarter = documentNonNull.userIdOfSuspensionStarter;

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfSuspensionEnder} as OPA.IUpdateable_ByUser);
    const updateObject_Suspendable = ({isSuspended: false, hasSuspensionStarted: true, hasSuspensionEnded: true, reasonForSuspensionStart, reasonForSuspensionEnd: reason, dateOfSuspensionStart, dateOfSuspensionEnd: now, userIdOfSuspensionStarter, userIdOfSuspensionEnder} as OPA.ISuspendable_ByUser); // eslint-disable-line max-len
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Suspendable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const areValid = areUpdatesValid(documentNonNull, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Marks the User as deleted on the server by constructing an IDeleteable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} userIdOfDeleter The ID for the Deleter within the OPA system.
   * @return {Promise<void>}
   */
  async markAsDeleted(ds: OPA.IDataStorageState, documentId: string, userIdOfDeleter: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IUserPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDeleter} as OPA.IUpdateable_ByUser);
    const updateObject_Deleteable = ({isMarkedAsDeleted: true, dateOfDeletion: now, userIdOfDeleter} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Deleteable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IUser, UserQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new UserQuerySet(cd), null, [], createInstance);

export const Index_User_FirebaseAuthUserId = OPA.createPropertyIndexDescriptor(OPA.DEFAULT_UNIQUENESS_INDEX_COLLECTION, PluralName, "firebaseAuthUserId");
CollectionDescriptor.propertyIndices.push(Index_User_FirebaseAuthUserId);
export const Index_User_AuthAccountName = OPA.createPropertyIndexDescriptor(OPA.DEFAULT_UNIQUENESS_INDEX_COLLECTION, PluralName, "authAccountName");
CollectionDescriptor.propertyIndices.push(Index_User_AuthAccountName);
export const Index_User_AuthAccountNameLowered = OPA.createPropertyIndexDescriptor(OPA.DEFAULT_UNIQUENESS_INDEX_COLLECTION, PluralName, "authAccountNameLowered");
CollectionDescriptor.propertyIndices.push(Index_User_AuthAccountNameLowered);
