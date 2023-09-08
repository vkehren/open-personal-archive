import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import {IAuthenticationProvider} from "./AuthenticationProvider";
import {ILocale} from "./Locale";
import {IRole, Role_OwnerId} from "./Role"; // eslint-disable-line camelcase
import {ITimeZoneGroup} from "./TimeZoneGroup";

const SingularName = "User";
const PluralName = "Users";
const IsSingleton = false;
export const User_OwnerId = "OPA_User_Owner"; // eslint-disable-line camelcase

// NOTE: IViewable_ByUser and IApprovable_ByUser fields should be updated using the corresponding interface directly as a partial interface
export interface IUserPartial extends OPA.IUpdateable {
  assignedRoleId?: string;
  localeId?: string;
  timeZoneGroupId?: string;
  timeZoneId?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string | null;
  recentQueries?: Array<string>;
}

export interface IUser extends OPA.IDocument_Creatable, OPA.IDocument_Updateable, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Approvable_ByUser<BT.ApprovalState> {
  readonly id: string;
  readonly firebaseAuthUserId: string;
  readonly authProviderId: string;
  readonly authAccountName: string;
  readonly authAccountNameLowered: string;
  assignedRoleId: string;
  localeId: string;
  timeZoneGroupId: string;
  timeZoneId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  readonly requestedCitationIds: Array<string>,
  readonly viewableCitationIds: Array<string>;
  recentQueries: Array<string>;
}

/**
 * Creates an instance of the IUser document type.
 * @param {string} id The ID for the User within the OPA system.
 * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
 * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
 * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
 * @param {IRole} assignedRole The Role to which the User is initially assigned.
 * @param {ILocale} locale The Locale selected by the User.
 * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
 * @param {string} firstName The User's first name.
 * @param {string} lastName The User's last name.
 * @param {string | null} preferredName The name by which the User wishes to be called.
 * @return {IUser} The new document instance.
 */
function createInstance(id: string, firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, assignedRole: IRole, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): IUser { // eslint-disable-line max-len
  const now = OPA.nowToUse();
  const document: IUser = {
    id: id,
    firebaseAuthUserId: firebaseAuthUserId,
    authProviderId: authProvider.id,
    authAccountName: authAccountName,
    authAccountNameLowered: authAccountName.toLowerCase(),
    assignedRoleId: assignedRole.id,
    localeId: locale.id,
    timeZoneGroupId: timeZoneGroup.id,
    timeZoneId: timeZoneGroup.primaryTimeZoneId,
    firstName: firstName,
    lastName: lastName,
    preferredName: preferredName,
    requestedCitationIds: ([] as Array<string>),
    viewableCitationIds: ([] as Array<string>),
    recentQueries: ([] as Array<string>),
    dateOfCreation: now,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    hasBeenViewed: false,
    dateOfLatestViewing: null,
    userIdOfLatestViewer: null,
    approvalState: BT.ApprovalStates.pending,
    hasBeenDecided: false,
    dateOfDecision: null,
    userIdOfDecider: null,
  };
  return document;
}

/**
 * Creates the instance of the IUser document type that owns the Archive.
 * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
 * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
 * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
 * @param {ILocale} locale The Locale selected by the User.
 * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
 * @param {string} firstName The User's first name.
 * @param {string} lastName The User's last name.
 * @param {string | null} preferredName The name by which the User wishes to be called.
 * @return {IUser} The new document instance.
 */
export function createArchiveOwner(firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): IUser { // eslint-disable-line max-len
  const now = OPA.nowToUse();
  const document: IUser = {
    id: User_OwnerId,
    firebaseAuthUserId: firebaseAuthUserId,
    authProviderId: authProvider.id,
    authAccountName: authAccountName,
    authAccountNameLowered: authAccountName.toLowerCase(),
    assignedRoleId: Role_OwnerId,
    localeId: locale.id,
    timeZoneGroupId: timeZoneGroup.id,
    timeZoneId: timeZoneGroup.primaryTimeZoneId,
    firstName: firstName,
    lastName: lastName,
    preferredName: preferredName,
    requestedCitationIds: ([] as Array<string>),
    viewableCitationIds: ([] as Array<string>),
    recentQueries: ([] as Array<string>),
    dateOfCreation: now,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    hasBeenViewed: true,
    dateOfLatestViewing: now,
    userIdOfLatestViewer: User_OwnerId,
    approvalState: BT.ApprovalStates.approved,
    hasBeenDecided: true,
    dateOfDecision: now,
    userIdOfDecider: User_OwnerId,
  };
  return document;
}

/** Class providing queries for User collection. */
export class UserQuerySet extends OPA.QuerySet<IUser> {
  /**
   * Creates a UserQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IUser>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IUser>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IUser, UserQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IUser, UserQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IUser, UserQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Gets the User that is the Owner of the Archive managed by the OPA installation.
   * @param {Firestore} db The Firestore Database to read from.
   * @return {Promise<IUser>} The User corresponding to the UUID, or null if none exists.
   */
  async getArchiveOwner(db: firestore.Firestore): Promise<IUser> {
    OPA.assertFirestoreIsNotNullish(db);

    const owner = await this.getById(db, User_OwnerId);
    OPA.assertDocumentIsValid(owner, "The Owner of the Archive must NOT be null.");

    const ownerNonNull = OPA.convertNonNullish(owner);
    return ownerNonNull;
  }

  /**
   * Gets the User by that User's Firebase Authentication UUID, since that UUID is also a unique key.
   * @param {Firestore} db The Firestore Database to read from.
   * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
   * @return {Promise<IUser | null>} The User corresponding to the UUID, or null if none exists.
   */
  async getByFirebaseAuthUserId(db: firestore.Firestore, firebaseAuthUserId: string): Promise<IUser | null> {
    OPA.assertFirestoreIsNotNullish(db);
    OPA.assertIdentifierIsValid(firebaseAuthUserId, "A valid Firebase Auth User ID must be provided.");

    const usersCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const getUserForUuidQuery = usersCollectionRef.where("firebaseAuthUserId", "==", firebaseAuthUserId);
    const matchingUsersSnap = await getUserForUuidQuery.get();

    if (matchingUsersSnap.docs.length > 1) {
      throw new Error("The Firebase Authentication UUID corresponds to more than one OPA User.");
    }
    if (matchingUsersSnap.docs.length < 1) {
      return null;
    }
    return matchingUsersSnap.docs[0].data();
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IUser, UserQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new UserQuerySet(cd), null, [], createInstance);

export const Index_User_FirebaseAuthUserId = OPA.createPropertyIndexDescriptor(BT.DefaultIndexCollection, PluralName, "firebaseAuthUserId");
CollectionDescriptor.propertyIndices.push(Index_User_FirebaseAuthUserId);
export const Index_User_AuthAccountName = OPA.createPropertyIndexDescriptor(BT.DefaultIndexCollection, PluralName, "authAccountName");
CollectionDescriptor.propertyIndices.push(Index_User_AuthAccountName);
export const Index_User_AuthAccountNameLowered = OPA.createPropertyIndexDescriptor(BT.DefaultIndexCollection, PluralName, "authAccountNameLowered");
CollectionDescriptor.propertyIndices.push(Index_User_AuthAccountNameLowered);
