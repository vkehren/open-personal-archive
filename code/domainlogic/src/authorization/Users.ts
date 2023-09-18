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

  const userId = await OpaDb.Users.queries.createWithRole(callState.dataStorageState, firebaseAuthUserId, OPA.convertNonNullish(authProvider), authAccountName, OPA.convertNonNullish(assignedRole), OPA.convertNonNullish(locale), OPA.convertNonNullish(timeZoneGroup), firstName, lastName);// eslint-disable-line max-len
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userId);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the profile data for the current User using the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OpaDm.IUserPartial} updateObject The object containing the updated profile property values.
 * @return {Promise<OpaDm.IUser>}
 */
export async function updateUserProfile(callState: OpaDm.ICallState, updateObject: OpaDm.IUserPartial): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  authorizationState.assertUserApproved();

  await OpaDb.Users.queries.update(callState.dataStorageState, authorizationState.user.id, updateObject, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, authorizationState.user.id);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the Role that the specified User is assigned to in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToAssign The User to assign to the Role.
 * @param {string} roleIdToAssign The Role to assign the User to.
 * @return {Promise<OpaDm.IUser>}
 */
export async function assignUserToRole(callState: OpaDm.ICallState, userIdToAssign: string, roleIdToAssign: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const roleToAssign = await OpaDb.Roles.queries.getById(callState.dataStorageState, roleIdToAssign);
  OPA.assertNonNullish(roleToAssign);
  const roleToAssignNonNull = OPA.convertNonNullish(roleToAssign);

  await OpaDb.Users.queries.assignToRole(callState.dataStorageState, userIdToAssign, roleToAssignNonNull, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToAssign);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the Requested Citations for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToUpdate The User to update.
 * @param {string} requestedCitationId The Requested Citation to add.
 * @return {Promise<OpaDm.IUser>}
 */
export async function addRequestedCitationToUser(callState: OpaDm.ICallState, userIdToUpdate: string, requestedCitationId: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  // LATER: Check the Citation acually exists

  await OpaDb.Users.queries.addRequestedCitation(callState.dataStorageState, userIdToUpdate, requestedCitationId, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToUpdate);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the Viewable Citations for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToUpdate The User to update.
 * @param {string} viewableCitationId The Viewable Citation to add.
 * @return {Promise<OpaDm.IUser>}
 */
export async function addViewableCitationToUser(callState: OpaDm.ICallState, userIdToUpdate: string, viewableCitationId: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  // LATER: Check the Citation acually exists

  await OpaDb.Users.queries.addViewableCitation(callState.dataStorageState, userIdToUpdate, viewableCitationId, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToUpdate);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the Viewed status of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToViewed(callState: OpaDm.ICallState, userIdToSet: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Users.queries.setToViewed(callState.dataStorageState, userIdToSet, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToSet);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the Decided ApprovalState of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the ApprovalState of.
 * @param {OpaDm.ApprovalState} approvalState The ApprovalState to set to.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToApprovalState(callState: OpaDm.ICallState, userIdToSet: string, approvalState: OpaDm.ApprovalState): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Users.queries.setToDecidedOption(callState.dataStorageState, userIdToSet, approvalState, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToSet);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Set the ApprovalState to Approved for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the ApprovalState of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToApproved(callState: OpaDm.ICallState, userIdToSet: string): Promise<OpaDm.IUser> {
  return await setUserToApprovalState(callState, userIdToSet, OpaDm.ApprovalStates.approved);
}

/**
 * Set the ApprovalState to Denied for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the ApprovalState of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToDenied(callState: OpaDm.ICallState, userIdToSet: string): Promise<OpaDm.IUser> {
  return await setUserToApprovalState(callState, userIdToSet, OpaDm.ApprovalStates.denied);
}

/**
 * Updates the IsSuspended status of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @param {boolean} suspend The status to set to.
 * @param {string} reason The reason for the status.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToSuspensionState(callState: OpaDm.ICallState, userIdToSet: string, suspend: boolean, reason: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  if (suspend) {
    await OpaDb.Users.queries.setToSuspended(callState.dataStorageState, userIdToSet, reason, authorizationState.user.id);
  } else {
    await OpaDb.Users.queries.setToUnSuspended(callState.dataStorageState, userIdToSet, reason, authorizationState.user.id);
  }
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToSet);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}

/**
 * Updates the IsSuspended to true for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @param {string} reason The reason for the status.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToSuspended(callState: OpaDm.ICallState, userIdToSet: string, reason: string): Promise<OpaDm.IUser> {
  return await setUserToSuspensionState(callState, userIdToSet, true, reason);
}

/**
 * Updates the IsSuspended to false for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @param {string} reason The reason for the status.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToUnSuspended(callState: OpaDm.ICallState, userIdToSet: string, reason: string): Promise<OpaDm.IUser> {
  return await setUserToSuspensionState(callState, userIdToSet, false, reason);
}

/**
 * Updates the Deleted status of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function markUserAsDeleted(callState: OpaDm.ICallState, userIdToSet: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Users.queries.markAsDeleted(callState.dataStorageState, userIdToSet, authorizationState.user.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getById(callState.dataStorageState, userIdToSet);
  OPA.assertDocumentIsValid(userReRead, "The requested User does not exist.");
  const userReReadNonNull = OPA.convertNonNullish(userReRead);

  return userReReadNonNull;
}
