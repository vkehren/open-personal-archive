import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";

/**
 * Reads the Authorization State for the specified Firebase Auth User in the Open Personal Archive™ (OPA) system..
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OPA.IFirebaseAuthUserData} userData The Firebase Auth data for the User.
 * @param {OPA.AuthActionType} [autoInitializationType=OPA.DEFAULT_AUTH_AUTO_INITIALIZATION_TYPE] When to auto-initialize the User.
 * @param {OPA.AuthActionType} [autoApprovalType=OPA.DEFAULT_AUTH_AUTO_APPROVAL_TYPE] When to auto-approve the User.
 * @param {string} [userIdForAuthAutomation=OpaDm.User_OwnerId] When to auto-approve the User.
 * @return {Promise<OpaDm.IUser | null>} The User document, or null if none could be created for the current settings.
 */
export async function authenticationEventHandlerForFirebaseAuth(dataStorageState: OpaDm.IDataStorageState, userData: OPA.IFirebaseAuthUserData, autoInitializationType = OPA.DEFAULT_AUTH_AUTO_INITIALIZATION_TYPE, autoApprovalType = OPA.DEFAULT_AUTH_AUTO_APPROVAL_TYPE, userIdForAuthAutomation = OpaDm.User_OwnerId): Promise<OpaDm.IUser | null> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  if (!isSystemInstalled) {
    return null;
  }
  if (OPA.isNullish(userData)) {
    return null;
  }
  if (userData.authType != OPA.FirebaseAuthTypes.user) {
    return null;
  }
  if (userData.isAnonymous) {
    return null;
  }
  if (OPA.isNullishOrWhitespace(userData.email)) {
    return null;
  }

  const firebaseAuthUserId = userData.uid;
  const existingUser = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState, firebaseAuthUserId);
  if (!OPA.isNullish(existingUser)) {
    const existingUserNonNull = OPA.convertNonNullish(existingUser);
    if (existingUserNonNull.isSuspended != userData.disabled) {
      if (userData.disabled) {
        await OpaDb.Users.queries.setToSuspensionState(dataStorageState, existingUserNonNull.id, OPA.SuspensionStates.suspended, OPA.REQUIRED_AUTH_AUTO_SUSPEND_REASON, userIdForAuthAutomation);
      } else if (!userData.disabled && (existingUserNonNull.reasonForSuspensionStart == OPA.REQUIRED_AUTH_AUTO_SUSPEND_REASON)) {
        await OpaDb.Users.queries.setToSuspensionState(dataStorageState, existingUserNonNull.id, OPA.SuspensionStates.unsuspended, OPA.REQUIRED_AUTH_AUTO_UNSUSPEND_REASON, userIdForAuthAutomation);
      } else {
        return existingUserNonNull;
      }
    }
    const existingUserReRead = await OpaDb.Users.queries.getByIdWithAssert(dataStorageState, existingUserNonNull.id);
    return existingUserReRead;
  }

  if (OPA.isOfValue(autoInitializationType, OPA.AuthActionRequirement.Manual)) {
    return null;
  }
  if (!userData.emailVerified && OPA.isOfValue(autoInitializationType, OPA.AuthActionRequirement.EmailVerified)) {
    return null;
  }
  if (userData.disabled && OPA.isOfValue(autoInitializationType, OPA.AuthActionRequirement.NotDisabled)) {
    return null;
  }

  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  const configuration = await OpaDb.Configuration.queries.getByIdWithAssert(dataStorageState, OpaDm.ConfigurationId);
  const role = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState, OpaDm.DefaultRoleId);
  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getByIdWithAssert(dataStorageState, configuration.defaultTimeZoneGroupId);

  const authProviderId = userData.providerId;
  const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderIdWithAssert(dataStorageState, authProviderId);

  let locale = await OpaDb.Locales.queries.getByIdWithAssert(dataStorageState, configuration.defaultLocaleId);
  if (!OPA.isNullishOrWhitespace(userData.locale)) {
    const userLocaleName = OPA.convertNonNullish(userData.locale);
    const userLocale = await OpaDb.Locales.queries.getByOptionName(dataStorageState, userLocaleName);

    if (!OPA.isNullish(userLocale)) {
      locale = OPA.convertNonNullish(userLocale);
    }
  }

  let firstName = "";
  let lastName = "";
  if (!OPA.isNullishOrWhitespace(userData.displayName)) {
    const displayNameParts = OPA.convertNonNullish(userData.displayName).split(" ");
    firstName = displayNameParts[0];
    lastName = (displayNameParts.length > 1) ? displayNameParts[1] : lastName;
  } if (!OPA.isNullishOrWhitespace(userData.email)) {
    const emailAddressParts = OPA.convertNonNullish(userData.email).split("@");
    const emailAccountNameParts = emailAddressParts[0].split(".");
    firstName = emailAccountNameParts[0];
    lastName = (emailAccountNameParts.length > 1) ? emailAccountNameParts[1] : lastName;
  }

  const userId = await OpaDb.Users.queries.createWithRole(dataStorageState, firebaseAuthUserId, authProvider, userData.email, role, locale, timeZoneGroup, firstName, lastName);
  await dataStorageState.currentWriteBatch.commit();
  dataStorageState.currentWriteBatch = null;

  let userReRead = await OpaDb.Users.queries.getByIdWithAssert(dataStorageState, userId);

  if (OPA.isOfValue(autoApprovalType, OPA.AuthActionRequirement.Manual)) {
    return userReRead;
  }
  if (!userData.emailVerified && OPA.isOfValue(autoApprovalType, OPA.AuthActionRequirement.EmailVerified)) {
    return userReRead;
  }
  if (userData.disabled && OPA.isOfValue(autoApprovalType, OPA.AuthActionRequirement.NotDisabled)) {
    return userReRead;
  }

  await OpaDb.Users.queries.setToDecidedOption(dataStorageState, userId, OPA.ApprovalStates.approved, userIdForAuthAutomation);
  userReRead = await OpaDb.Users.queries.getByIdWithAssert(dataStorageState, userId);
  return userReRead;
}
