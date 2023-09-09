import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import {SingletonId} from "./Archive";
import {ILocale, DefaultLocale} from "./Locale";
import {IUser} from "./User";

const SingularName = "AccessRequest";
const PluralName = "AccessRequests";
const IsSingleton = false;

export interface IAccessRequestPartial {
  message?: OPA.ILocalizable<string>;
  response?: OPA.ILocalizable<string>;
}

type UpdateHistoryItem = IAccessRequestPartial | OPA.IUpdateable_ByUser | OPA.IViewable_ByUser | OPA.IApprovable_ByUser<BT.ApprovalState> | OPA.IDeleteable_ByUser;
interface IAccessRequestPartial_WithHistory extends IAccessRequestPartial, OPA.IUpdateable_ByUser {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

// NOTE: Use "IDocument_Creatable_ByUser" because we must record the User who created the AccessRequest (i.e. the owner of the AccessRequest)
// NOTE: Use "IDocument_Updateable_ByUser" because the User creating the AccessRequest updates the "message", but the Decider updates the "response"
export interface IAccessRequest extends OPA.IDocument_Creatable_ByUser, OPA.IDocument_Updateable_ByUser, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Approvable_ByUser<BT.ApprovalState>, OPA.IDocument_Deleteable_ByUser {
  readonly id: string;
  readonly archiveId: string; // NOTE: This field stores information necessary to extend the OPA system to manage multiple Archives
  readonly isSpecificToCitation: boolean;
  readonly citationId: string | null;
  message: OPA.ILocalizable<string>;
  response: OPA.ILocalizable<string>;
  readonly updateHistory: Array<UpdateHistoryItem>;
}

/**
 * Checks whether the specified updates to a AccessRequest document are valid.
 * @param {IAccessRequest} document The AccessRequest document being updated.
 * @param {IAccessRequestPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
function areUpdatesValid(document: IAccessRequest, updateObject: IAccessRequestPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: A deleted document should not be updateable
  if (document.isMarkedAsDeleted) {
    return false;
  }

  // NOTE: Only the Creator can update the message
  if (!OPA.isNullish(updateObject.message) && !OPA.areEqual(document.message, updateObject.message)) {
    const userIdOfUpdater = (updateObject as OPA.IUpdateable_ByUser).userIdOfLatestUpdater;
    return (userIdOfUpdater == document.userIdOfCreator);
  }

  // NOTE: Only the Viewer, Decider, or Deleter can update the response
  if (!OPA.isNullish(updateObject.response) && !OPA.areEqual(document.response, updateObject.response)) {
    const userIdOfUpdater = (updateObject as OPA.IUpdateable_ByUser).userIdOfLatestUpdater;
    return ((userIdOfUpdater == document.userIdOfLatestViewer) ||
      (userIdOfUpdater == document.userIdOfDecider) ||
      (userIdOfUpdater == document.userIdOfDeleter));
  }
  return true;
}

/**
 * Creates an instance of the IAccessRequest document type.
 * @param {string} id The ID for the AccessRequest within the OPA system.
 * @param {IUser} user The User creating the AccessRequest.
 * @param {ILocale} locale The Locale for that User.
 * @param {string} message A message containing information about the Access Request.
 * @param {string | null} [citationId=null] The ID of the Citation that the Access Request pertains to, if one exists.
 * @return {IAccessRequest} The new document instance.
 */
function createInstance(id: string, user: IUser, locale: ILocale, message: string, citationId: string | null = null): IAccessRequest { // eslint-disable-line max-len
  const now = OPA.nowToUse();
  const document: IAccessRequest = {
    id: id,
    archiveId: SingletonId,
    isSpecificToCitation: (!OPA.isNullishOrWhitespace(citationId)),
    citationId: citationId,
    message: BT.localizableStringConstructor(locale.optionName, message),
    response: BT.localizableStringConstructor(DefaultLocale, ""), // NOTE: The Decider sets the response (and determines its Locale)
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    userIdOfCreator: user.id,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    userIdOfLatestUpdater: null,
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
  document.updateHistory.push(OPA.copyObject(document));
  return document;
}

/** Class providing queries for AccessRequest collection. */
export class AccessRequestQuerySet extends OPA.QuerySet<IAccessRequest> {
  /**
   * Creates a AccessRequestQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IAccessRequest>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IAccessRequest>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Gets all of the AccessRequests for the relevant User's OPA User ID.
   * @param {Firestore} db The Firestore Database to read from.
   * @param {string} userId The ID for the relevant User within the OPA system.
   * @return {Promise<Array<IAccessRequest>>} The list of Access Requests that correspond to the relevant User.
   */
  async getAllForUserId(db: firestore.Firestore, userId: string): Promise<Array<IAccessRequest>> {
    OPA.assertFirestoreIsNotNullish(db);
    OPA.assertIdentifierIsValid(userId, "A valid OPA User ID must be provided.");

    const accessRequestsCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const getAccessRequestsForUserIdQuery = accessRequestsCollectionRef.where("userIdOfRequestor", "==", userId);
    const matchingAccessRequestsSnap = await getAccessRequestsForUserIdQuery.get();

    const matchingAccessRequests = matchingAccessRequestsSnap.docs.map((doc) => doc.data());
    return matchingAccessRequests;
  }

  /**
   * Creates an instance of the IAccessRequest document type stored on the server.
   * @param {Firestore} db The Firestore Database.
   * @param {IUser} user The User creating the AccessRequest.
   * @param {ILocale} locale The Locale for that User.
   * @param {string} message A message containing information about the Access Request.
   * @param {string | null} [citationId=null] The ID of the Citation that the Access Request pertains to, if one exists.
   * @return {Promise<string>} The new document ID.
   */
  async createAccessRequest(db: firestore.Firestore, user: IUser, locale: ILocale, message: string, citationId: string | null = null): Promise<string> { // eslint-disable-line max-len
    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, user, locale, message, citationId);

    OPA.assertNonNullish(document);
    OPA.assertNonNullish(document.updateHistory);
    OPA.assertIsTrue(document.id == documentId);
    OPA.assertIsTrue(document.updateHistory.length == 1);

    await documentRef.set(document, {merge: true});
    return documentId;
  }

  /**
   * Updates the AccessRequest stored on the server using an IAccessRequestPartial object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {IAccessRequestPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async updateAccessRequest(db: firestore.Firestore, documentId: string, updateObject: IAccessRequestPartial, userIdOfLatestUpdater: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject_Updateable, ...updateObject};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an IViewable_ByUser object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {string} userIdOfLatestViewer The ID for the Viewer within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async setAccessRequestToViewed(db: firestore.Firestore, documentId: string, userIdOfLatestViewer: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestViewer} as OPA.IUpdateable_ByUser);
    const updateObject_Viewable = ({hasBeenViewed: true, dateOfLatestViewing: now, userIdOfLatestViewer} as OPA.IViewable_ByUser);
    const updateObject = {...updateObject_Updateable, ...updateObject_Viewable, ...({} as IAccessRequestPartial)};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an IApprovable_ByUser<T> object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {BT.ApprovalState} approvalState The ApprovalState for the AccessRequest.
   * @param {string} userIdOfDecider The ID for the Decider within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async setAccessRequestToDecided(db: firestore.Firestore, documentId: string, approvalState: BT.ApprovalState, userIdOfDecider: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDecider} as OPA.IUpdateable_ByUser);
    const updateObject_Approvable = ({hasBeenDecided: true, approvalState, dateOfDecision: now, userIdOfDecider} as OPA.IApprovable_ByUser<BT.ApprovalState>);
    const updateObject = {...updateObject_Updateable, ...updateObject_Approvable, ...({} as IAccessRequestPartial)};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }

  /**
   * Marks the AccessRequest as deleted on the server by constructing an IDeleteable_ByUser object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {string} userIdOfDeleter The ID for the Deleter within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async markAccessRequestAsDeleted(db: firestore.Firestore, documentId: string, userIdOfDeleter: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDeleter} as OPA.IUpdateable_ByUser);
    const updateObject_Deleteable = ({isMarkedAsDeleted: true, dateOfDeletion: now, userIdOfDeleter} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Updateable, ...updateObject_Deleteable, ...({} as IAccessRequestPartial)};
    const updateHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

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
export const CollectionDescriptor = new OPA.CollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new AccessRequestQuerySet(cd));
