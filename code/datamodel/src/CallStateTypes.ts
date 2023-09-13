import * as OPA from "../../base/src";
import * as BT from "./BaseTypes";
import {IApplication} from "./doctypes/Application";
import {IArchive} from "./doctypes/Archive";
import {ILocale} from "./doctypes/Locale";
import {IRole} from "./doctypes/Role";
import {ITimeZone} from "./doctypes/TimeZone";
import {ITimeZoneGroup} from "./doctypes/TimeZoneGroup";
import {IUser} from "./doctypes/User";

export interface ICallState {
  readonly dataStorageState: IDataStorageState;
  readonly authenticationState: IAuthenticationState;
  readonly hasSystemState: boolean;
  readonly systemState?: ISystemState;
  readonly hasAuthorizationState: boolean;
  readonly authorizationState?: IAuthorizationState;
}

export type IDataStorageState = OPA.IDataStorageState;

export interface IAuthenticationState {
  readonly firebaseAuthUserId: string;
  readonly providerId: string;
  readonly email: string;
  readonly emailIsVerified: boolean;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly displayName?: string;
}

export interface ISystemState {
  readonly application: IApplication;
  readonly archive: IArchive;
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
    return (this._user.approvalState == BT.ApprovalStates.approved);
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

/**
 * Asserts that the state container for the call is NOT nullish.
 * @param {ICallState | null | undefined} callState The state container for the call.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertCallStateIsNotNullish(callState: ICallState | null | undefined, message = "The Call State must not be null."): void {
  if (OPA.isNullish(callState)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the state container for authentication is NOT nullish.
 * @param {IAuthenticationState | null | undefined} authenticationState The state container for authentication.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertAuthenticationStateIsNotNullish(authenticationState: IAuthenticationState | null | undefined, message = "The Authentication State must not be null."): void {
  if (OPA.isNullish(authenticationState)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the state container for the system is NOT nullish.
 * @param {ISystemState | null | undefined} systemState The state container for the system.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertSystemStateIsNotNullish(systemState: ISystemState | null | undefined, message = "The System State must not be null."): void {
  if (OPA.isNullish(systemState)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the state container for authorization is NOT nullish.
 * @param {IAuthorizationState | null | undefined} authorizationState The state container for authorization.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertAuthorizationStateIsNotNullish(authorizationState: IAuthorizationState | null | undefined, message = "The Authorization State must not be null."): void {
  if (OPA.isNullish(authorizationState)) {
    throw new Error(message);
  }
}
