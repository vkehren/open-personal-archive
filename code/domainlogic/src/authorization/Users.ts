import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "../system/Application";

export interface IAnonymousDisplayModel {
  readonly displayName: string;
}

export interface IUserDisplayModel {
  readonly id: string;
  readonly firebaseAuthUserId: string;
  readonly accountName: string;
  readonly displayName: string;
  readonly assignedRoleId: string;
  readonly dateOfCreation: OPA.DateToUse;
}

export interface IUserAccountDisplayModel {
  readonly isAnonymous: boolean;
  readonly firebaseAuthState: OpaDm.IAuthenticationState | null;
  readonly isUserAccountInitialized: boolean;
  readonly userAccount: OpaDm.IUser | null;
}

/**
 * Gets the account display model for the current User using the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState | null} callState The Call State for the current User, or null if no User has been authenticated or authorized.
 * @return {Promise<IUserAccountDisplayModel>}
 */
export async function getUserAccountDisplayModel(callState: OpaDm.ICallState | null): Promise<IUserAccountDisplayModel> {
  if (OPA.isNullish(callState)) {
    const anonymousAccountDisplayModel: IUserAccountDisplayModel = {
      isAnonymous: true,
      firebaseAuthState: null,
      isUserAccountInitialized: false,
      userAccount: null,
    };
    return anonymousAccountDisplayModel;
  }

  const callStateNonNull = OPA.convertNonNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callStateNonNull.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callStateNonNull.dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(callStateNonNull.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callStateNonNull.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callStateNonNull.systemState);

  if (!callStateNonNull.hasAuthorizationState) {
    const uninitializedAccountDisplayModel: IUserAccountDisplayModel = {
      isAnonymous: false,
      firebaseAuthState: callStateNonNull.authenticationState,
      isUserAccountInitialized: false,
      userAccount: null,
    };
    return uninitializedAccountDisplayModel;
  }

  OpaDm.assertAuthorizationStateIsNotNullish(callStateNonNull.authorizationState);
  const authorizationState = OPA.convertNonNullish(callStateNonNull.authorizationState);

  const userAccountDisplayModel: IUserAccountDisplayModel = {
    isAnonymous: false,
    firebaseAuthState: callStateNonNull.authenticationState,
    isUserAccountInitialized: true,
    userAccount: authorizationState.user,
  };
  return userAccountDisplayModel;
}

/**
 * Initializes the account data for the current User using the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} authProviderId The Firebase Auth id of the authentication provider used to authenticate the current Firebase Auth user account.
 * @param {string} authAccountName The Firebase Auth name of the authentication account used to authenticate the current Firebase Auth user account.
 * @return {Promise<OpaDm.IUser>}
 */
export async function initializeUserAccount(callState: OpaDm.ICallState, authProviderId: string, authAccountName: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsFalse(callState.hasAuthorizationState, "The User account has already been initialized.");

  const preExistingUser = await OpaDb.Users.queries.getByFirebaseAuthUserId(callState.dataStorageState, callState.authenticationState.firebaseAuthUserId);
  const hasPreExistingUser = (!OPA.isNullish(preExistingUser));
  OPA.assertIsFalse(hasPreExistingUser, "The User account has already been initialized, but possibly with errors.");

  const systemState = OPA.convertNonNullish(callState.systemState);
  const firebaseAuthUserId = callState.authenticationState.firebaseAuthUserId;
  const firstName = (!OPA.isNullishOrWhitespace(callState.authenticationState.firstName)) ? OPA.convertNonNullish(callState.authenticationState.firstName) : "";
  const lastName = (!OPA.isNullishOrWhitespace(callState.authenticationState.lastName)) ? OPA.convertNonNullish(callState.authenticationState.lastName) : "";

  const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(callState.dataStorageState, authProviderId);
  OPA.assertDocumentIsValid(authProvider, "The required AuthProvider does not exist.");
  const assignedRole = await OpaDb.Roles.queries.getById(callState.dataStorageState, OpaDm.DefaultRoleId);
  OPA.assertDocumentIsValid(assignedRole, "The required Role does not exist.");
  const locale = await OpaDb.Locales.queries.getById(callState.dataStorageState, systemState.archive.defaultLocaleId);
  OPA.assertDocumentIsValid(locale, "The required Locale does not exist.");
  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getById(callState.dataStorageState, systemState.archive.defaultTimeZoneGroupId);
  OPA.assertDocumentIsValid(timeZoneGroup, "The required TimeZoneGroup does not exist.");

  const userId = await OpaDb.Users.queries.createWithRole(callState.dataStorageState, firebaseAuthUserId, OPA.convertNonNullish(authProvider), authAccountName, OPA.convertNonNullish(assignedRole), OPA.convertNonNullish(locale), OPA.convertNonNullish(timeZoneGroup), firstName, lastName);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userId);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

// LATER: export async function updateUserSettings(...)

// LATER: export async function updateUserApprovalState(...)

// LATER: export async function assignUserToRole(...)

// LATER: export async function disableUser(...)
