import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../base/src";
import * as UTL from "./Utilities";
import {IArchive} from "./doctypes/Archive";
import {ILocale} from "./doctypes/Locale";
import {IOpaSystem} from "./doctypes/OpaSystem";
import {IRole} from "./doctypes/Role";
import {ITimeZone} from "./doctypes/TimeZone";
import {ITimeZoneGroup} from "./doctypes/TimeZoneGroup";
import {IUser} from "./doctypes/User";

export interface IDataStorageState {
  appName: string;
  projectId: string;
  usesAdminAccess: boolean;
  usesEmulators: boolean;
  db: firestore.Firestore;
  // LATER: Add storage
}

export interface IAuthenticationState {
  readonly firebaseAuthUserId: string;
  readonly providerId: string;
  readonly email: string;
  readonly emailIsVerified: boolean;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly displayName?: string;
}

export interface IAuthorizationState {
  readonly user: IUser;
  readonly role: IRole;
  readonly locale: ILocale;
  readonly timeZoneGroup: ITimeZoneGroup;
  readonly timeZone: ITimeZone;
  isUserApproved(): boolean;
  assertUserApproved(): void;
  isRoleAllowed(allowedRoleIds: Array<string>): boolean;
  assertRoleAllowed(allowedRoleIds: Array<string>): void;
  isRoleDisallowed(disallowedRoleIds: Array<string>): boolean;
  assertRoleDisallowed(disallowedRoleIds: Array<string>): void;
}

export interface IArchiveState {
  readonly system: IOpaSystem;
  readonly archive: IArchive;
}

export interface ICallState {
  readonly dataStorageState: IDataStorageState;
  readonly authenticationState: IAuthenticationState;
  readonly hasAuthorizationState: boolean;
  readonly authorizationState?: IAuthorizationState;
  readonly hasArchiveState: boolean;
  readonly archiveState?: IArchiveState;
}

/** Class providing Authorization-related state and assertions. */
export class AuthorizationState implements IAuthorizationState {
  private _user: IUser;
  private _role: IRole;
  private _locale: ILocale;
  private _timeZoneGroup: ITimeZoneGroup;
  private _timeZone: ITimeZone;

  /**
    * Creates a AuthorizationState.
    * @param {IUser} user The current User.
    * @param {IRole} role The Role of the current User.
    * @param {ILocale} locale The Locale for the current User.
    * @param {ITimeZoneGroup} timeZoneGroup The Time Zone Group for the current User.
    * @param {ITimeZone} timeZone The Time Zone for the current User.
    */
  constructor(user: IUser, role: IRole, locale: ILocale, timeZoneGroup: ITimeZoneGroup, timeZone: ITimeZone) {
    this._user = user;
    this._role = role;
    this._locale = locale;
    this._timeZoneGroup = timeZoneGroup;
    this._timeZone = timeZone;
  }

  /**
    * The current User.
    * @type {IUser}
    */
  get user(): IUser {
    return this._user;
  }

  /**
    * The Role of the current User.
    * @type {IRole}
    */
  get role(): IRole {
    return this._role;
  }

  /**
    * The Locale for the current User.
    * @type {ILocale}
    */
  get locale(): ILocale {
    return this._locale;
  }

  /**
    * The Time Zone Group for the current User.
    * @type {ITimeZoneGroup}
    */
  get timeZoneGroup(): ITimeZoneGroup {
    return this._timeZoneGroup;
  }

  /**
    * The Time Zone for the current User.
    * @type {ITimeZone}
    */
  get timeZone(): ITimeZone {
    return this._timeZone;
  }

  /**
    * Returns true if the current User's account has been approved.
    * @return {boolean} Whether the current User's account has been approved.
    */
  isUserApproved(): boolean {
    return (this._user.approvalState == UTL.ApprovalStates.approved);
  }

  /**
    * Asserts that the current User's account has been approved.
    * @return {void}
    */
  assertUserApproved(): void {
    if (!this.isUserApproved()) {
      throw new Error("The current User's account has NOT been approved.");
    }
  }

  /**
    * Returns true if the current User's Role is in the list of allowed Roles.
    * @param {Array<string>} allowedRoleIds The list of allowed Roles.
    * @return {boolean} Whether the current User's Role is allowed.
    */
  isRoleAllowed(allowedRoleIds: Array<string>): boolean {
    OPA.assertNonNullish(allowedRoleIds, "A non-null array of allowed Role IDs must be specified.");
    return (allowedRoleIds.includes(this._role.id));
  }

  /**
    * Asserts that the current User's Role is in the list of allowed Roles.
    * @param {Array<string>} allowedRoleIds The list of allowed Roles.
    * @return {void}
    */
  assertRoleAllowed(allowedRoleIds: Array<string>): void {
    if (!this.isRoleAllowed(allowedRoleIds)) {
      throw new Error("The current User's Role is not allowed to perform this action.");
    }
  }

  /**
    * Returns true if the current User's Role is in the list of disallowed Roles.
    * @param {Array<string>} disallowedRoleIds The list of disallowed Roles.
    * @return {boolean} Whether the current User's Role is disallowed.
    */
  isRoleDisallowed(disallowedRoleIds: Array<string>): boolean {
    OPA.assertNonNullish(disallowedRoleIds, "A non-null array of disallowed Role IDs must be specified.");
    return (disallowedRoleIds.includes(this._role.id));
  }

  /**
    * Asserts that the current User's Role is in the list of disallowed Roles.
    * @param {Array<string>} disallowedRoleIds The list of disallowed Roles.
    * @return {void}
    */
  assertRoleDisallowed(disallowedRoleIds: Array<string>): void {
    if (!this.isRoleDisallowed(disallowedRoleIds)) {
      throw new Error("The current User's Role is allowed to perform this action.");
    }
  }
}
