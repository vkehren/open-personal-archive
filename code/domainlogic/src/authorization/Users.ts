import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
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
  OPA.assertNonNullish(callStateNonNull.dataStorageState, "The Data Storage State must not be null.");
  OPA.assertFirestoreIsNotNullish(callStateNonNull.dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(callStateNonNull.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertNonNullish(callStateNonNull.authenticationState, "The Authentication State must not be null.");
  OPA.assertNonNullish(callStateNonNull.systemState, "The System State must not be null.");

  if (!callStateNonNull.hasAuthorizationState) {
    const uninitializedAccountDisplayModel: IUserAccountDisplayModel = {
      isAnonymous: false,
      firebaseAuthState: callStateNonNull.authenticationState,
      isUserAccountInitialized: false,
      userAccount: null,
    };
    return uninitializedAccountDisplayModel;
  }

  OPA.assertNonNullish(callStateNonNull.authorizationState, "The Authorization State must not be null.");
  const authorizationStateNonNull = OPA.convertNonNullish(callStateNonNull.authorizationState);

  const userAccountDisplayModel: IUserAccountDisplayModel = {
    isAnonymous: false,
    firebaseAuthState: callStateNonNull.authenticationState,
    isUserAccountInitialized: true,
    userAccount: authorizationStateNonNull.user,
  };
  return userAccountDisplayModel;
}
