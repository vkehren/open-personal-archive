import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";

export interface IUserAuthorizationData {
  readonly id: string;
  readonly username: string;
  readonly friendlyName: string;
  readonly locale: string;
  readonly timeZoneGroup: string;
  readonly timeZone: string;
}

export interface IRoleAuthorizationData {
  readonly id: string;
  readonly name: string;
  readonly type: OpaDm.RoleType;
}

export interface IAuthorizationData {
  readonly firebaseProjectId: string;
  readonly usesFirebaseEmulators: boolean;
  readonly isSystemInstalled: boolean;
  readonly userData: IUserAuthorizationData | null;
  readonly roleData: IRoleAuthorizationData | null;
}

/**
    * Gets an AuthorizationData instance for the Archive, User, and Role specified in the input state objects.
    * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
    * @param {OpaDm.ISystemState} systemState The System state for the relevant Archive.
    * @param {OpaDm.IAuthorizationState} authorizationState The Authorization state for the current User.
    * @return {IAuthorizationData} The corresponding Authorization data.
    */
export function getAuthorizationDataForDisplayModel(dataStorageState: OpaDm.IDataStorageState, systemState: OpaDm.ISystemState, authorizationState: OpaDm.IAuthorizationState): IAuthorizationData {
  if (OPA.isNullish(dataStorageState) || OPA.isNullish(systemState) || OPA.isNullish(authorizationState)) {
    throw new Error("The DataStorageState, SystemState, and AuthorizationState must not be null.");
  }

  if (OPA.isNullish(authorizationState.user)) {
    const authorizationData: IAuthorizationData = {
      firebaseProjectId: dataStorageState.projectId,
      usesFirebaseEmulators: dataStorageState.usesEmulators,
      isSystemInstalled: (!OPA.isNullish(systemState.archive)),
      userData: null,
      roleData: null,
    };
    return authorizationData;
  }

  if (OPA.isNullish(authorizationState.role) || OPA.isNullish(authorizationState.locale) || OPA.isNullish(authorizationState.timeZoneGroup) || OPA.isNullish(authorizationState.timeZone)) {
    throw new Error("Required User Authorization information is missing.");
  }

  const user = OPA.convertNonNullish(authorizationState.user);
  const role = OPA.convertNonNullish(authorizationState.role);
  const locale = OPA.convertNonNullish(authorizationState.locale);
  const timeZoneGroup = OPA.convertNonNullish(authorizationState.timeZoneGroup);
  const timeZone = OPA.convertNonNullish(authorizationState.timeZone);

  if (user.assignedRoleId != role.id) {
    throw new Error("The Role must match the User's assigned Role.");
  }
  if (user.localeId != locale.id) {
    throw new Error("The Locale must match the User's selected Locale.");
  }
  if (user.timeZoneGroupId != timeZoneGroup.id) {
    throw new Error("The TimeZoneGroup must match the User's selected TimeZoneGroup.");
  }
  if (user.timeZoneId != timeZone.id) {
    throw new Error("The TimeZone must match the User's selected TimeZone.");
  }

  let userData: IUserAuthorizationData | null = null;
  if (!OPA.isNullish(user)) {
    userData = {
      id: user.id,
      username: user.authAccountName,
      friendlyName: (!OPA.isNullish(user.preferredName)) ? OPA.convertNonNullish(user.preferredName) : user.firstName,
      locale: locale.optionName,
      timeZoneGroup: timeZoneGroup.name,
      timeZone: timeZone.name,
    };
  }

  let roleData: IRoleAuthorizationData | null = null;
  if (!OPA.isNullish(role)) {
    roleData = {
      id: role.id,
      name: role.name,
      type: role.type,
    };
  }

  const authorizationData: IAuthorizationData = {
    firebaseProjectId: dataStorageState.projectId,
    usesFirebaseEmulators: dataStorageState.usesEmulators,
    isSystemInstalled: (!OPA.isNullish(systemState.archive)),
    userData: userData,
    roleData: roleData,
  };
  return authorizationData;
}
