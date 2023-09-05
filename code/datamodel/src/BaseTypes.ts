import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../base/src";
import {ISystemState, IAuthorizationState, IDataStorageState} from "./CallStateTypes";
import {DefaultLocale} from "./doctypes/Locale";

export const DefaultIndexCollection = "Indices";
export const localizableStringConstructor = function (desiredValue: string | null, defaultValue: string, locale = DefaultLocale): OPA.ILocalizable<string> {
  OPA.assertNonNullishOrWhitespace(locale);
  const localizableString = ({} as any);
  localizableString[locale] = (!OPA.isNullishOrWhitespace(desiredValue) ? OPA.convertNonNullish(desiredValue) : defaultValue);
  localizableString[OPA.Default_Locale] = localizableString[locale]; // NOTE: The base library default locale is actually "en"
  return localizableString;
};

// NOTE: To overcome known issue with storing Firebase Firestore Timestamps, for now, just use JavaScript Dates (see https://github.com/jloosli/node-firestore-import-export/issues/46)
export type DateShim = Date;
export const now = (): DateShim => firestore.Timestamp.now().toDate();
// LATER: Submit bug to Firebase via GitHub specifically explaining that @google-cloud\firestore\build\src\serializer.js fails to recognize valid Timestamps at line 319

export type RoleType = "owner" | "administrator" | "editor" | "viewer" | "guest";
export const RoleTypes = {
  default: ("guest" as RoleType),
  owner: ("owner" as RoleType),
  administrator: ("administrator" as RoleType),
  editor: ("editor" as RoleType),
  viewer: ("viewer" as RoleType),
  guest: ("guest" as RoleType),
};

export type ApprovalState = "pending" | "approved" | "denied";
export const ApprovalStates = {
  default: ("pending" as ApprovalState),
  pending: ("pending" as ApprovalState),
  approved: ("approved" as ApprovalState),
  denied: ("denied" as ApprovalState),
};

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
  readonly type: RoleType;
}

export interface IAuthorizationData {
  readonly firebaseProjectId: string;
  readonly usesFirebaseEmulators: boolean;
  readonly isSystemInstalled: boolean;
  readonly userData: IUserAuthorizationData | null;
  readonly roleData: IRoleAuthorizationData | null;
}

/**
    * Gets the Authorization data for the specified Archive, User, and Role.
    * @param {IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
    * @param {ISystemState} systemState The state for the relevant Archive.
    * @param {IAuthorizationState} authorizationState The state for the current User.
    * @return {IAuthorizationData} The corresponding Authorization data.
    */
export function getAuthorizationData(dataStorageState: IDataStorageState, systemState: ISystemState, authorizationState: IAuthorizationState): IAuthorizationData {
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
