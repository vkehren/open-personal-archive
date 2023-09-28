import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "../system/Application";

export interface IUserAccountDisplayModel {
  readonly isAnonymous: boolean;
  readonly isUserAccountInitialized: boolean;
  readonly isUserAccountApproved: boolean;
  readonly displayName: string;
  readonly firebaseAuthUserId: string | null;
  readonly opaUserId: string | null;
  readonly userAccount: IUserDisplayModel | null;
}

export interface IUserDisplayModel {
  readonly id: string;
  readonly firebaseAuthUserId: string;
  readonly accountName: string;
  readonly displayName: string;
  readonly assignedRole: IRoleDisplayModel;
  readonly dateOfCreation: OPA.DateToUse;
}

export interface IRoleDisplayModel {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

/**
 * Converts an array of IUsers to an array of IUserDisplayModels.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {Array<OpaDm.IUser>} users The array of IUsers.
 * @param {Array<OpaDm.IRole> | null} [roles=null] The array of IRoles necessary, if they have already been read.
 * @return {Promise<Array<IUserDisplayModel>>}
 */
export async function convertUsersToDisplayModels(callState: OpaDm.ICallState, users: Array<OpaDm.IUser>, roles: Array<OpaDm.IRole> | null = null): Promise<Array<IUserDisplayModel>> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);
  OPA.assertNonNullish(users);

  if (OPA.isNullish(roles) || OPA.isEmpty(OPA.convertNonNullish(roles))) {
    roles = await OpaDb.Roles.queries.getAll(callState.dataStorageState);
  }

  OPA.assertNonNullish(roles);
  const rolesMap = OPA.createMapFromArray(OPA.convertNonNullish(roles), (role) => (role.id));

  const userDisplayModels = users.map((user) => {
    const roleId = user.assignedRoleId;
    const role = OPA.convertNonNullish(rolesMap.get(roleId));
    OPA.assertDocumentIsValid(role);

    const defaultDisplayName = OPA.convertNonNullish(user.firstName, user.authAccountName);
    const actualDisplayName = OPA.convertNonNullish(user.preferredName, defaultDisplayName);
    return {
      id: user.id,
      firebaseAuthUserId: user.firebaseAuthUserId,
      accountName: user.authAccountName,
      displayName: actualDisplayName,
      assignedRole: {
        id: role.id,
        name: role.name,
        type: role.type,
      },
      dateOfCreation: user.dateOfCreation,
    };
  });
  return userDisplayModels;
}

/**
 * Converts an IUser to an IUserDisplayModel.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OpaDm.IUser} user The IUser.
 * @param {OpaDm.IRole | null} [role=null] The IRole for the IUser, if it has already been read.
 * @return {Promise<IUserDisplayModel>}
 */
export async function convertUserToDisplayModel(callState: OpaDm.ICallState, user: OpaDm.IUser, role: OpaDm.IRole | null = null): Promise<IUserDisplayModel> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const roleId = user.assignedRoleId;
  if (roleId == authorizationState.role.id) {
    role = authorizationState.role;
  } else {
    role = await OpaDb.Roles.queries.getById(callState.dataStorageState, roleId);
  }

  OPA.assertNonNullish(role);
  const userDisplayModels = await convertUsersToDisplayModels(callState, [user], [OPA.convertNonNullish(role)]);

  OPA.assertNonNullish(userDisplayModels);
  OPA.assertIsTrue(userDisplayModels.length == 1);

  const userDisplayModel = userDisplayModels[0];
  return userDisplayModel;
}

/**
 * Gets the list of Users in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OPA.ApprovalState | null} [approvalState=null] The ApprovalState desired for retrieval.
 * @return {Promise<Array<OpaDm.IUser>>}
 */
export async function getListOfUsers(callState: OpaDm.ICallState, approvalState: OPA.ApprovalState | null = null): Promise<Array<OpaDm.IUser>> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();

  if (!authorizationState.isRoleAllowed(authorizerIds)) {
    const isUserOwnResult = (OPA.isNullish(approvalState) || (approvalState == OPA.ApprovalStates.approved));
    if (!isUserOwnResult) {
      return [];
    }

    const user = authorizationState.user;
    return [user];
  } else {
    const users = await OpaDb.Users.queries.getAllForApprovalState(callState.dataStorageState, approvalState);
    return users;
  }
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
      isUserAccountInitialized: false,
      isUserAccountApproved: false,
      displayName: OPA.DEFAULT_ANONYMOUS_DISPLAY_NAME,
      firebaseAuthUserId: null,
      opaUserId: null,
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
    const authenticationState = OPA.convertNonNullish(callStateNonNull.authenticationState);
    const defaultDisplayName = OPA.convertNonNullish(authenticationState.firstName, authenticationState.email);
    const actualDisplayName = OPA.convertNonNullish(authenticationState.displayName, defaultDisplayName);
    const uninitializedAccountDisplayModel: IUserAccountDisplayModel = {
      isAnonymous: false,
      isUserAccountInitialized: false,
      isUserAccountApproved: false,
      displayName: actualDisplayName,
      firebaseAuthUserId: authenticationState.firebaseAuthUserId,
      opaUserId: null,
      userAccount: null,
    };
    return uninitializedAccountDisplayModel;
  }

  OpaDm.assertAuthorizationStateIsNotNullish(callStateNonNull.authorizationState);

  const authorizationState = OPA.convertNonNullish(callStateNonNull.authorizationState);
  const defaultDisplayName = OPA.convertNonNullish(authorizationState.user.firstName, authorizationState.user.authAccountName);
  const actualDisplayName = OPA.convertNonNullish(callStateNonNull.authenticationState.displayName, defaultDisplayName);
  const userAccountDisplayModel: IUserAccountDisplayModel = {
    isAnonymous: false,
    isUserAccountInitialized: true,
    isUserAccountApproved: authorizationState.isUserApproved(),
    displayName: actualDisplayName,
    firebaseAuthUserId: authorizationState.user.firebaseAuthUserId,
    opaUserId: authorizationState.user.id,
    userAccount: {
      id: authorizationState.user.id,
      firebaseAuthUserId: authorizationState.user.firebaseAuthUserId,
      accountName: authorizationState.user.authAccountName,
      displayName: actualDisplayName,
      assignedRole: {
        id: authorizationState.role.id,
        name: authorizationState.role.name,
        type: authorizationState.role.type,
      },
      dateOfCreation: authorizationState.user.dateOfCreation,
    },
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

  const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderIdWithAssert(callState.dataStorageState, authProviderId, "The required AuthProvider does not exist.");
  const assignedRole = await OpaDb.Roles.queries.getByIdWithAssert(callState.dataStorageState, OpaDm.DefaultRoleId, "The required Role does not exist.");
  const locale = await OpaDb.Locales.queries.getByIdWithAssert(callState.dataStorageState, systemState.archive.defaultLocaleId, "The required Locale does not exist.");
  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getByIdWithAssert(callState.dataStorageState, systemState.archive.defaultTimeZoneGroupId, "The required TimeZoneGroup does not exist.");

  const userId = await OpaDb.Users.queries.createWithRole(callState.dataStorageState, firebaseAuthUserId, authProvider, authAccountName, assignedRole, locale, timeZoneGroup, firstName, lastName);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userId, "The requested User does not exist.");
  return userReRead;
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
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  authorizationState.assertUserApproved();

  await OpaDb.Users.queries.update(callState.dataStorageState, authorizationState.user.id, updateObject, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, authorizationState.user.id, "The requested User does not exist.");
  return userReRead;
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
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const roleToAssign = await OpaDb.Roles.queries.getByIdWithAssert(callState.dataStorageState, roleIdToAssign);

  await OpaDb.Users.queries.assignToRole(callState.dataStorageState, userIdToAssign, roleToAssign, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToAssign, "The requested User does not exist.");
  return userReRead;
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
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  authorizationState.assertUserApproved();
  authorizationState.assertUserSameAs(userIdToUpdate);

  // LATER: Check the Citation acually exists

  await OpaDb.Users.queries.addRequestedCitation(callState.dataStorageState, userIdToUpdate, requestedCitationId, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToUpdate, "The requested User does not exist.");
  return userReRead;
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
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  // LATER: Check the Citation acually exists

  await OpaDb.Users.queries.addViewableCitation(callState.dataStorageState, userIdToUpdate, viewableCitationId, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToUpdate, "The requested User does not exist.");
  return userReRead;
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
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Users.queries.setToViewed(callState.dataStorageState, userIdToSet, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToSet, "The requested User does not exist.");
  return userReRead;
}

/**
 * Updates the Decided ApprovalState of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the ApprovalState of.
 * @param {OpaDm.ApprovalState} approvalState The ApprovalState to set to.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToApprovalState(callState: OpaDm.ICallState, userIdToSet: string, approvalState: OPA.ApprovalState): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Users.queries.setToDecidedOption(callState.dataStorageState, userIdToSet, approvalState, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToSet, "The requested User does not exist.");
  return userReRead;
}

/**
 * Set the ApprovalState to Approved for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the ApprovalState of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToApproved(callState: OpaDm.ICallState, userIdToSet: string): Promise<OpaDm.IUser> {
  return await setUserToApprovalState(callState, userIdToSet, OPA.ApprovalStates.approved);
}

/**
 * Set the ApprovalState to Denied for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the ApprovalState of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToDenied(callState: OpaDm.ICallState, userIdToSet: string): Promise<OpaDm.IUser> {
  return await setUserToApprovalState(callState, userIdToSet, OPA.ApprovalStates.denied);
}

/**
 * Updates the IsSuspended status of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @param {OPA.SuspensionState} suspensionState The SuspensionState to set to.
 * @param {string} reason The reason for the status.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToSuspensionState(callState: OpaDm.ICallState, userIdToSet: string, suspensionState: OPA.SuspensionState, reason: string): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Users.queries.setToSuspensionState(callState.dataStorageState, userIdToSet, suspensionState, reason, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToSet, "The requested User does not exist.");
  return userReRead;
}

/**
 * Updates the IsSuspended to true for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @param {string} reason The reason for the status.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToSuspended(callState: OpaDm.ICallState, userIdToSet: string, reason: string): Promise<OpaDm.IUser> {
  return await setUserToSuspensionState(callState, userIdToSet, OPA.SuspensionStates.suspended, reason);
}

/**
 * Updates the IsSuspended to false for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToSet The User to set the status of.
 * @param {string} reason The reason for the status.
 * @return {Promise<OpaDm.IUser>}
 */
export async function setUserToUnSuspended(callState: OpaDm.ICallState, userIdToSet: string, reason: string): Promise<OpaDm.IUser> {
  return await setUserToSuspensionState(callState, userIdToSet, OPA.SuspensionStates.unsuspended, reason);
}

/**
 * Updates the deletion status of the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToMark The User to mark the status of.
 * @param {OPA.DeletionState} deletionState The DeletionState to set to.
 * @return {Promise<OpaDm.IUser>}
 */
export async function markUserWithDeletionState(callState: OpaDm.ICallState, userIdToMark: string, deletionState: OPA.DeletionState): Promise<OpaDm.IUser> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  authorizationState.assertUserApproved();
  authorizationState.assertUserSameAs(userIdToMark);

  await OpaDb.Users.queries.markWithDeletionState(callState.dataStorageState, userIdToMark, deletionState, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const userReRead = await OpaDb.Users.queries.getByIdWithAssert(callState.dataStorageState, userIdToMark, "The requested User does not exist.");
  return userReRead;
}

/**
 * Sets the Deletion status to "true" for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToMark The User to mark the status of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function markUserAsDeleted(callState: OpaDm.ICallState, userIdToMark: string): Promise<OpaDm.IUser> {
  return await markUserWithDeletionState(callState, userIdToMark, OPA.DeletionStates.deleted);
}

/**
 * Sets the Deletion status to "false" for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} userIdToMark The User to mark the status of.
 * @return {Promise<OpaDm.IUser>}
 */
export async function markUserAsUnDeleted(callState: OpaDm.ICallState, userIdToMark: string): Promise<OpaDm.IUser> {
  return await markUserWithDeletionState(callState, userIdToMark, OPA.DeletionStates.undeleted);
}
