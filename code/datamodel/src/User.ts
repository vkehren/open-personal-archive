import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as UTL from "./Utilities";
import {Role_OwnerId} from "./Role"; // eslint-disable-line camelcase
import {IAuthenticationProvider, ILocale, IRole, ITimeZoneGroup} from ".";

const SingularName = "User";
const PluralName = "Users";
const IsSingleton = false;
export const User_OwnerId = "OPA_User_Owner"; // eslint-disable-line camelcase

export type FactoryFunc = (arg0: string, arg1: string, arg2: IAuthenticationProvider, arg3: string, arg4: IRole, arg5: ILocale, arg6: ITimeZoneGroup, arg7: string, arg8: string, arg9: string | null) => IUser; // eslint-disable-line max-len
export const CollectionDescriptor = new OPA.CollectionDescriptor<IUser, FactoryFunc>(SingularName, PluralName, IsSingleton, null, [], createInstance);

export interface IUser extends OPA.IDocument {
  readonly id: string;
  readonly firebaseAuthUserId: string;
  readonly authProviderId: string;
  readonly authAccountName: string;
  assignedRoleId: string;
  localeId: string;
  timeZoneGroupId: string;
  timeZoneId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  readonly requestedCitationIds: Array<string>,
  readonly viewableCitationIds: Array<string>;
  recentQueries: Array<string>;
  dateOfCreation: UTL.DateShim;
  dateOfLatestUpdate: UTL.DateShim;
  approvalState: UTL.ApprovalState;
  userIdOfApprover: string | null;
  dateOfApproval: UTL.DateShim | null;
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
  const now = UTL.now();
  const document: IUser = {
    id: id,
    firebaseAuthUserId: firebaseAuthUserId,
    authProviderId: authProvider.id,
    authAccountName: authAccountName,
    assignedRoleId: assignedRole.id,
    localeId: locale.id,
    timeZoneGroupId: timeZoneGroup.id,
    timeZoneId: timeZoneGroup.primaryTimeZoneId,
    firstName: firstName,
    lastName: lastName,
    preferredName: preferredName,
    requestedCitationIds: ([] as Array<string>),
    viewableCitationIds: ([] as Array<string>),
    recentQueries: ([] as Array<string>),
    dateOfCreation: now,
    dateOfLatestUpdate: now,
    approvalState: UTL.Default_ApprovalState,
    userIdOfApprover: null,
    dateOfApproval: null,
  };
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
  const now = UTL.now();
  const document: IUser = {
    id: User_OwnerId,
    firebaseAuthUserId: firebaseAuthUserId,
    authProviderId: authProvider.id,
    authAccountName: authAccountName,
    assignedRoleId: Role_OwnerId,
    localeId: locale.id,
    timeZoneGroupId: timeZoneGroup.id,
    timeZoneId: timeZoneGroup.primaryTimeZoneId,
    firstName: firstName,
    lastName: lastName,
    preferredName: preferredName,
    requestedCitationIds: ([] as Array<string>),
    viewableCitationIds: ([] as Array<string>),
    recentQueries: ([] as Array<string>),
    dateOfCreation: now,
    dateOfLatestUpdate: now,
    approvalState: UTL.Approved,
    userIdOfApprover: User_OwnerId,
    dateOfApproval: now,
  };
  return document;
}

/**
 * Gets the User by that User's Firebase Authentication UUID, since that UUID is also a unique key.
 * @param {Firestore} db The Firestore Database to read from.
 * @param {string | null | undefined} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
 * @return {Promise<IUser | null>} The User corresponding to the UUID, or null if none exists.
 */
export async function getUserByFirebaseAuthUserId(db: admin.firestore.Firestore, firebaseAuthUserId: string | null | undefined): Promise<IUser | null> {
  if (OPA.isNullish(db)) {
    throw new Error("The Firestore DB must NOT be null.");
  }
  if (OPA.isNullish(firebaseAuthUserId)) {
    return null;
  }

  const usersCollectionRef = CollectionDescriptor.getTypedCollection(db);
  const getUserForUuidQuery = usersCollectionRef.where("firebaseAuthUserId", "==", firebaseAuthUserId);
  const matchingUsersSnap = await getUserForUuidQuery.get();

  if (matchingUsersSnap.docs.length > 1) {
    throw new Error("The Firebase Authentication UUID corresponds to more than one OPA User.");
  }
  if (matchingUsersSnap.docs.length < 1) {
    return null;
  }
  return matchingUsersSnap.docs[0].data();
}
