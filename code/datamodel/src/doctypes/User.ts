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
export interface IUserPartial {
  assignedRoleId?: string;
  localeId?: string;
  timeZoneGroupId?: string;
  timeZoneId?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string | null;
  requestedCitationIds?: Array<string>;
  viewableCitationIds?: Array<string>;
  recentQueries?: Array<string>;
}

type UpdateHistoryItem = IUserPartial | OPA.IUpdateable | OPA.IViewable_ByUser | OPA.IApprovable_ByUser<BT.ApprovalState> | OPA.IDeleteable_ByUser;
interface IUserPartial_WithHistory extends IUserPartial, OPA.IUpdateable {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

export interface IUser extends OPA.IDocument_Creatable, OPA.IDocument_Updateable, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Approvable_ByUser<BT.ApprovalState>, OPA.IDocument_Deleteable_ByUser {
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
  readonly updateHistory: Array<UpdateHistoryItem>;
}

/**
 * Checks whether the specified updates to a User document are valid.
 * @param {IUser} document The User document being updated.
 * @param {IUserPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
function areUpdatesValid(document: IUser, updateObject: IUserPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: A deleted document should not be updateable
  if (document.isMarkedAsDeleted) {
    return false;
  }

  // NOTE: Only the Creator of the User (itself) can delete it
  if (!document.isMarkedAsDeleted && (updateObject as OPA.IDeleteable_ByUser).isMarkedAsDeleted) {
    // NOTE: The Owner cannot be deleted
    if (document.id == User_OwnerId) {
      return false;
    }

    const userIdOfDeleter = (updateObject as OPA.IDeleteable_ByUser).userIdOfDeleter;
    return (userIdOfDeleter == document.id);
  }

  if (document.assignedRoleId == Role_OwnerId) {
    // NOTE: The Owner starts as already approved and cannot be deleted, so the following properties are invalid to update
    if (updateObject.hasOwnProperty(OPA.IViewable_HasBeenViewed_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IViewable_DateOfLatestViewing_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IViewable_ByUser_UserIdOfLatestViewer_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IApprovable_HasBeenDecided_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IApprovable_ApprovalState_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IApprovable_DateOfDecision_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IApprovable_ByUser_UserIdOfDecider_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IDeleteable_IsMarkedAsDeleted_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IDeleteable_DateOfDeletion_PropertyName)) {
      return false;
    }
    if (updateObject.hasOwnProperty(OPA.IDeleteable_ByUser_UserIdOfDeleter_PropertyName)) {
      return false;
    }
  }
  return true;
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
  OPA.assertIsTrue(assignedRole.id != Role_OwnerId, "The Archive Owner cannot be constructed as a normal User.");

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
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    hasBeenViewed: false,
    dateOfLatestViewing: null,
    userIdOfLatestViewer: null,
    hasBeenDecided: false,
    approvalState: BT.ApprovalStates.pending,
    dateOfDecision: null,
    userIdOfDecider: null,
    isMarkedAsDeleted: false,
    dateOfDeletion: null,
    userIdOfDeleter: null,
  };

  const documentCopy = (OPA.copyObject(document) as any);
  delete documentCopy.updateHistory;
  document.updateHistory.push(documentCopy);
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
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    hasBeenViewed: true,
    dateOfLatestViewing: now,
    userIdOfLatestViewer: User_OwnerId,
    hasBeenDecided: true,
    approvalState: BT.ApprovalStates.approved,
    dateOfDecision: now,
    userIdOfDecider: User_OwnerId,
    isMarkedAsDeleted: false,
    dateOfDeletion: null,
    userIdOfDeleter: null,
  };

  const documentCopy = (OPA.copyObject(document) as any);
  delete documentCopy.updateHistory;
  document.updateHistory.push(documentCopy);
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

  /**
   * Creates the instance of the IUser document type that owns the Archive stored on the server.
   * @param {Firestore} db The Firestore Database.
   * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
   * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
   * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
   * @param {ILocale} locale The Locale selected by the User.
   * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
   * @param {string} firstName The User's first name.
   * @param {string} lastName The User's last name.
   * @param {string | null} preferredName The name by which the User wishes to be called.
   * @return {Promise<string>} The new document ID.
   */
  async createArchiveOwner(db: firestore.Firestore, firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): Promise<string> { // eslint-disable-line max-len
    const owner = createArchiveOwner(firebaseAuthUserId, authProvider, authAccountName, locale, timeZoneGroup, firstName, lastName, preferredName);
    const ownerId = owner.id;

    OPA.assertNonNullish(owner);
    OPA.assertNonNullish(owner.updateHistory);
    OPA.assertIsTrue(owner.id == User_OwnerId);
    OPA.assertIsTrue(ownerId == User_OwnerId);
    OPA.assertIsTrue(owner.updateHistory.length == 1);

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const ownerRef = collectionRef.doc(ownerId);

    // REPLACES: await ownerRef.set(owner, {merge: true});
    const batchUpdate = db.batch();
    batchUpdate.set(ownerRef, owner, {merge: true});
    const firebaseAuthUserIdIndexCollectionRef = db.collection(Index_User_FirebaseAuthUserId.indexCollectionName);
    const firebaseAuthUserIdIndexDocRef = firebaseAuthUserIdIndexCollectionRef.doc(Index_User_FirebaseAuthUserId.getDocumentId(owner.firebaseAuthUserId));
    batchUpdate.set(firebaseAuthUserIdIndexDocRef, {value: ownerId});
    const authAccountNameIndexCollectionRef = db.collection(Index_User_AuthAccountName.indexCollectionName);
    const authAccountNameIndexDocRef = authAccountNameIndexCollectionRef.doc(Index_User_AuthAccountName.getDocumentId(owner.authAccountName));
    batchUpdate.set(authAccountNameIndexDocRef, {value: ownerId});
    const authAccountNameLoweredIndexCollectionRef = db.collection(Index_User_AuthAccountNameLowered.indexCollectionName);
    const authAccountNameLoweredIndexDocRef = authAccountNameLoweredIndexCollectionRef.doc(Index_User_AuthAccountNameLowered.getDocumentId(owner.authAccountNameLowered));
    batchUpdate.set(authAccountNameLoweredIndexDocRef, {value: ownerId});
    await batchUpdate.commit();
    return ownerId;
  }

  /**
   * Creates an instance of the IUser document type stored on the server.
   * @param {Firestore} db The Firestore Database.
   * @param {string} firebaseAuthUserId The ID for the User within the Firebase Authentication system.
   * @param {IAuthenticationProvider} authProvider The AuthenticationProvider for the User's account.
   * @param {string} authAccountName The name of the User's account with the specified AuthenticationProvider.
   * @param {IRole} assignedRole The Role to which the User is initially assigned.
   * @param {ILocale} locale The Locale selected by the User.
   * @param {ITimeZoneGroup} timeZoneGroup The TimeZoneGroup selected by the User.
   * @param {string} firstName The User's first name.
   * @param {string} lastName The User's last name.
   * @param {string | null} preferredName The name by which the User wishes to be called.
   * @return {Promise<string>} The new document ID.
   */
  async createWithRole(db: firestore.Firestore, firebaseAuthUserId: string, authProvider: IAuthenticationProvider, authAccountName: string, assignedRole: IRole, locale: ILocale, timeZoneGroup: ITimeZoneGroup, firstName: string, lastName: string, preferredName: string | null = null): Promise<string> { // eslint-disable-line max-len
    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, firebaseAuthUserId, authProvider, authAccountName, assignedRole, locale, timeZoneGroup, firstName, lastName, preferredName);

    OPA.assertNonNullish(document);
    OPA.assertNonNullish(document.updateHistory);
    OPA.assertIsTrue(document.id == documentId);
    OPA.assertIsTrue(document.updateHistory.length == 1);

    // REPLACES: await userRef.set(user, {merge: true});
    const batchUpdate = db.batch();
    batchUpdate.set(documentRef, document, {merge: true});
    const firebaseAuthUserIdIndexCollectionRef = db.collection(Index_User_FirebaseAuthUserId.indexCollectionName);
    const firebaseAuthUserIdIndexDocRef = firebaseAuthUserIdIndexCollectionRef.doc(Index_User_FirebaseAuthUserId.getDocumentId(document.firebaseAuthUserId));
    batchUpdate.set(firebaseAuthUserIdIndexDocRef, {value: documentId});
    const authAccountNameIndexCollectionRef = db.collection(Index_User_AuthAccountName.indexCollectionName);
    const authAccountNameIndexDocRef = authAccountNameIndexCollectionRef.doc(Index_User_AuthAccountName.getDocumentId(document.authAccountName));
    batchUpdate.set(authAccountNameIndexDocRef, {value: documentId});
    const authAccountNameLoweredIndexCollectionRef = db.collection(Index_User_AuthAccountNameLowered.indexCollectionName);
    const authAccountNameLoweredIndexDocRef = authAccountNameLoweredIndexCollectionRef.doc(Index_User_AuthAccountNameLowered.getDocumentId(document.authAccountNameLowered));
    batchUpdate.set(authAccountNameLoweredIndexDocRef, {value: documentId});
    await batchUpdate.commit();
    return documentId;
  }

  /**
   * Updates the User stored on the server using an IUserPartial object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {IUserPartial} updateObject The object containing the updates.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async update(db: firestore.Firestore, documentId: string, updateObject: IUserPartial, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now} as OPA.IUpdateable);
    updateObject = {...updateObject_Updateable, ...updateObject};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }

  /**
   * Updates the User stored on the server by constructing an IViewable_ByUser object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} userIdOfLatestViewer The ID for the Viewer within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async setToViewed(db: firestore.Firestore, documentId: string, userIdOfLatestViewer: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now} as OPA.IUpdateable);
    const updateObject_Viewable = ({hasBeenViewed: true, dateOfLatestViewing: now, userIdOfLatestViewer} as OPA.IViewable_ByUser);
    const updateObject = {...updateObject_Updateable, ...updateObject_Viewable, ...({} as IUserPartial)};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }

  /**
   * Updates the User stored on the server by constructing an IApprovable_ByUser<T> object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {BT.ApprovalState} approvalState The ApprovalState for the User.
   * @param {string} userIdOfDecider The ID for the Decider within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async setToDecidedOption(db: firestore.Firestore, documentId: string, approvalState: BT.ApprovalState, userIdOfDecider: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now} as OPA.IUpdateable);
    const updateObject_Approvable = ({hasBeenDecided: true, approvalState, dateOfDecision: now, userIdOfDecider} as OPA.IApprovable_ByUser<BT.ApprovalState>);
    const updateObject = {...updateObject_Updateable, ...updateObject_Approvable, ...({} as IUserPartial)};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }

  /**
   * Marks the User as deleted on the server by constructing an IDeleteable_ByUser object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the User within the OPA system.
   * @param {string} userIdOfDeleter The ID for the Deleter within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async markAsDeleted(db: firestore.Firestore, documentId: string, userIdOfDeleter: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now} as OPA.IUpdateable);
    const updateObject_Deleteable = ({isMarkedAsDeleted: true, dateOfDeletion: now, userIdOfDeleter} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Updateable, ...updateObject_Deleteable, ...({} as IUserPartial)};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IUserPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
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
