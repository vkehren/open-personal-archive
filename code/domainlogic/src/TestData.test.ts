import * as OpaDm from "../../datamodel/src";

export interface IAuthenticationStateForTests extends OpaDm.IAuthenticationState {
  opaUserId: string;
}

const authProviderId = "google.com";
const opaUserId_Placeholder = "[SET_THIS_IN_TEST_CODE]";

const firebaseAuthUserId_Owner = ("FB_" + OpaDm.User_OwnerId);
export const authenticationState_Owner: IAuthenticationStateForTests = {
  opaUserId: OpaDm.User_OwnerId,
  firebaseAuthUserId: firebaseAuthUserId_Owner,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Owner + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Owner",
  displayName: "A.O.",
};

const firebaseAuthUserId_Admin = ("FB_" + "OPA_User_Admin");
export const authenticationState_Admin: IAuthenticationStateForTests = {
  opaUserId: opaUserId_Placeholder,
  firebaseAuthUserId: firebaseAuthUserId_Admin,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Admin + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Admin",
  displayName: "A.A.",
};

const firebaseAuthUserId_Editor = ("FB_" + "OPA_User_Editor");
export const authenticationState_Editor: IAuthenticationStateForTests = {
  opaUserId: opaUserId_Placeholder,
  firebaseAuthUserId: firebaseAuthUserId_Editor,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Editor + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Editor",
  displayName: "A.E.",
};

const firebaseAuthUserId_Viewer = ("FB_" + "OPA_User_Viewer");
export const authenticationState_Viewer: IAuthenticationStateForTests = {
  opaUserId: opaUserId_Placeholder,
  firebaseAuthUserId: firebaseAuthUserId_Viewer,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Viewer + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Viewer",
  displayName: "A.V.",
};

const firebaseAuthUserId_Guest = ("FB_" + "OPA_User_Guest");
export const authenticationState_Guest: IAuthenticationStateForTests = {
  opaUserId: opaUserId_Placeholder,
  firebaseAuthUserId: firebaseAuthUserId_Guest,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Guest + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Guest",
  displayName: "A.G.",
};

const firebaseAuthUserId_TestUser = ("FB_" + "OPA_User_Test");
export const authenticationState_TestUser: IAuthenticationStateForTests = {
  opaUserId: opaUserId_Placeholder,
  firebaseAuthUserId: firebaseAuthUserId_TestUser,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Guest + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Test",
  lastName: "User",
  displayName: "T.U.",
};
