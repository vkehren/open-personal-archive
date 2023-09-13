import * as OpaDm from "../../datamodel/src";

const authProviderId = "google.com";

const firebaseAuthUserId_Owner = ("FB_" + OpaDm.User_OwnerId);
export const authenticationState_Owner: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: firebaseAuthUserId_Owner,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Owner + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Owner",
  displayName: "A.O.",
};

const firebaseAuthUserId_Admin = ("FB_" + "OPA_User_Admin");
export const authenticationState_Admin: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: firebaseAuthUserId_Admin,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Admin + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Admin",
  displayName: "A.A.",
};

const firebaseAuthUserId_Editor = ("FB_" + "OPA_User_Editor");
export const authenticationState_Editor: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: firebaseAuthUserId_Editor,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Editor + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Editor",
  displayName: "A.E.",
};

const firebaseAuthUserId_Viewer = ("FB_" + "OPA_User_Viewer");
export const authenticationState_Viewer: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: firebaseAuthUserId_Viewer,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Viewer + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Viewer",
  displayName: "A.V.",
};

const firebaseAuthUserId_Guest = ("FB_" + "OPA_User_Guest");
export const authenticationState_Guest: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: firebaseAuthUserId_Guest,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Guest + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Archive",
  lastName: "Guest",
  displayName: "A.G.",
};

const firebaseAuthUserId_TestUser = ("FB_" + "OPA_User_Test");
export const authenticationState_TestUser: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: firebaseAuthUserId_TestUser,
  providerId: authProviderId,
  email: (firebaseAuthUserId_Guest + "@gmail.com"),
  emailIsVerified: true,
  firstName: "Test",
  lastName: "User",
  displayName: "T.U.",
};
