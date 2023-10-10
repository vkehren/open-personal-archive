import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";

/**
 * Gets the Call State for the current User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @param {OPA.DefaultFunc<string>} [moduleNameGetter=(() => "")] Gets the module name.
 * @param {OPA.DefaultFunc<string>} [functionNameGetter=(() => "")] Gets the function name.
 * @return {Promise<OpaDm.ICallState>}
 */
export async function getCallStateForCurrentUser(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState, moduleNameGetter: OPA.DefaultFunc<string> = (() => ""), functionNameGetter: OPA.DefaultFunc<string> = (() => "")): Promise<OpaDm.ICallState> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertAuthenticationStateIsNotNullish(authenticationState);
  OPA.assertIdentifierIsValid(authenticationState.firebaseAuthUserId);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);

  // LATER: Consider checking if AuthenticationState is Anonymous and returning ICallState with NULL AuthorizationState

  let hasSystemState = false;
  let systemState: OpaDm.ISystemState | undefined = undefined;

  // NOTE: Create System State
  const application = await OpaDb.Application.queries.getById(dataStorageState, OpaDm.ApplicationId);
  const configuration = await OpaDb.Configuration.queries.getById(dataStorageState, OpaDm.ConfigurationId);
  let applicationNonNull = ((null as unknown) as OpaDm.IApplication);
  let configurationNonNull = ((null as unknown) as OpaDm.IConfiguration);

  if (!OPA.isNullish(application)) {
    OPA.assertDocumentIsValid(configuration, "The Configuration object must exist when the Application object exists.");

    applicationNonNull = OPA.convertNonNullish(application);
    configurationNonNull = OPA.convertNonNullish(configuration);

    systemState = {application: applicationNonNull, configuration: configurationNonNull};
    hasSystemState = true;
  }

  if (!hasSystemState) {
    const callState: OpaDm.ICallState = {
      dataStorageState: dataStorageState,
      authenticationState: authenticationState,
      hasSystemState: false,
      systemState: undefined,
      hasAuthorizationState: false,
      authorizationState: undefined,
      entryModuleName: moduleNameGetter(),
      entryFunctionName: functionNameGetter(),
    };
    return callState;
  }

  const systemStateNonNull = OPA.convertNonNullish(systemState);
  const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState, authenticationState.firebaseAuthUserId);
  const hasUser = (!OPA.isNullish(user));

  if (!hasUser) {
    const callState: OpaDm.ICallState = {
      dataStorageState: dataStorageState,
      authenticationState: authenticationState,
      hasSystemState: true,
      systemState: systemStateNonNull,
      hasAuthorizationState: false,
      authorizationState: undefined,
      entryModuleName: moduleNameGetter(),
      entryFunctionName: functionNameGetter(),
    };
    return callState;
  }

  const authorizationState = await readAuthorizationStateForFirebaseAuthUser(dataStorageState, authenticationState.firebaseAuthUserId);

  const callState: OpaDm.ICallState = {
    dataStorageState: dataStorageState,
    authenticationState: authenticationState,
    hasSystemState: true,
    systemState: systemStateNonNull,
    hasAuthorizationState: true,
    authorizationState: authorizationState,
    entryModuleName: moduleNameGetter(),
    entryFunctionName: functionNameGetter(),
  };
  return callState;
}

/**
 * Reads the Authorization State for the specified Firebase Auth User in the Open Personal Archive™ (OPA) system..
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {string} firebaseAuthUserId The Firebase Auth UUID for the User.
 * @return {Promise<OpaDm.IAuthorizationState>}
 */
export async function readAuthorizationStateForFirebaseAuthUser(dataStorageState: OpaDm.IDataStorageState, firebaseAuthUserId: string): Promise<OpaDm.IAuthorizationState> {
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertIdentifierIsValid(firebaseAuthUserId);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);

  const user = await OpaDb.Users.queries.getByFirebaseAuthUserIdWithAssert(dataStorageState, firebaseAuthUserId, "The current User must be properly authenticated.");
  const role = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState, user.assignedRoleId, "The current User's Role must be properly assigned.");
  const locale = await OpaDb.Locales.queries.getByIdWithAssert(dataStorageState, user.localeId, "The current User must have a valid Locale.");
  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getByIdWithAssert(dataStorageState, user.timeZoneGroupId, "The current User must have a valid Time Zone Group.");
  const timeZone = await OpaDb.TimeZones.queries.getByIdWithAssert(dataStorageState, user.timeZoneId, "The current User must have a valid Time Zone.");

  const result = new OpaDm.AuthorizationState(user, role, locale, timeZoneGroup, timeZone);
  return result;
}
