import * as OpaDm from "../../datamodel/src";
import * as TestConfig from "./TestConfiguration.test";

const authProviderId = "google.com";
const opaUserId_Placeholder = "[SET_THIS_IN_TEST_CODE]";

const firebaseAuthUserId_Owner = ("FB_" + OpaDm.User_OwnerId);
const authenticationState_Owner = (): TestConfig.IAuthenticationStateForTests => {
  const authState = {
    hasOpaUserId: () => (authState.opaUserId != opaUserId_Placeholder),
    opaUserId: OpaDm.User_OwnerId,
    firebaseAuthUserId: firebaseAuthUserId_Owner,
    providerId: authProviderId,
    email: (firebaseAuthUserId_Owner + "@gmail.com"),
    emailIsVerified: true,
    firstName: "Archive",
    lastName: "Owner",
    displayName: "A.O.",
  };
  return authState;
};

const firebaseAuthUserId_Admin = ("FB_" + "OPA_User_Admin");
const authenticationState_Admin = (): TestConfig.IAuthenticationStateForTests => {
  const authState = {
    hasOpaUserId: () => (authState.opaUserId != opaUserId_Placeholder),
    opaUserId: opaUserId_Placeholder,
    firebaseAuthUserId: firebaseAuthUserId_Admin,
    providerId: authProviderId,
    email: (firebaseAuthUserId_Admin + "@gmail.com"),
    emailIsVerified: true,
    firstName: "Archive",
    lastName: "Admin",
    displayName: "A.A.",
  };
  return authState;
};

const firebaseAuthUserId_Editor = ("FB_" + "OPA_User_Editor");
const authenticationState_Editor = (): TestConfig.IAuthenticationStateForTests => {
  const authState = {
    hasOpaUserId: () => (authState.opaUserId != opaUserId_Placeholder),
    opaUserId: opaUserId_Placeholder,
    firebaseAuthUserId: firebaseAuthUserId_Editor,
    providerId: authProviderId,
    email: (firebaseAuthUserId_Editor + "@gmail.com"),
    emailIsVerified: true,
    firstName: "Archive",
    lastName: "Editor",
    displayName: "A.E.",
  };
  return authState;
};

const firebaseAuthUserId_Viewer = ("FB_" + "OPA_User_Viewer");
const authenticationState_Viewer = (): TestConfig.IAuthenticationStateForTests => {
  const authState = {
    hasOpaUserId: () => (authState.opaUserId != opaUserId_Placeholder),
    opaUserId: opaUserId_Placeholder,
    firebaseAuthUserId: firebaseAuthUserId_Viewer,
    providerId: authProviderId,
    email: (firebaseAuthUserId_Viewer + "@gmail.com"),
    emailIsVerified: true,
    firstName: "Archive",
    lastName: "Viewer",
    displayName: "A.V.",
  };
  return authState;
};

const firebaseAuthUserId_Guest = ("FB_" + "OPA_User_Guest");
const authenticationState_Guest = (): TestConfig.IAuthenticationStateForTests => {
  const authState = {
    hasOpaUserId: () => (authState.opaUserId != opaUserId_Placeholder),
    opaUserId: opaUserId_Placeholder,
    firebaseAuthUserId: firebaseAuthUserId_Guest,
    providerId: authProviderId,
    email: (firebaseAuthUserId_Guest + "@gmail.com"),
    emailIsVerified: true,
    firstName: "Archive",
    lastName: "Guest",
    displayName: "A.G.",
  };
  return authState;
};

const firebaseAuthUserId_TestUser = ("FB_" + "OPA_User_Test");
const authenticationState_TestUser = (): TestConfig.IAuthenticationStateForTests => {
  const authState = {
    hasOpaUserId: () => (authState.opaUserId != opaUserId_Placeholder),
    opaUserId: opaUserId_Placeholder,
    firebaseAuthUserId: firebaseAuthUserId_TestUser,
    providerId: authProviderId,
    email: (firebaseAuthUserId_Guest + "@gmail.com"),
    emailIsVerified: true,
    firstName: "Test",
    lastName: "User",
    displayName: "T.U.",
  };
  return authState;
};

export const TestAuthData = {
  owner: authenticationState_Owner(),
  admin: authenticationState_Admin(),
  editor: authenticationState_Editor(),
  viewer: authenticationState_Viewer(),
  guest: authenticationState_Guest(),
  testUser: authenticationState_TestUser(),
  resetTestData: () => {
    TestAuthData.owner = authenticationState_Owner();
    TestAuthData.admin = authenticationState_Admin();
    TestAuthData.editor = authenticationState_Editor();
    TestAuthData.viewer = authenticationState_Viewer();
    TestAuthData.guest = authenticationState_Guest();
    TestAuthData.testUser = authenticationState_TestUser();
  },
};
