import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import {SingletonId} from "./Archive";
import {ILocale, DefaultLocale} from "./Locale";
import {IUser} from "./User";

/* eslint-disable camelcase */

const SingularName = "AccessRequest";
const PluralName = "AccessRequests";
const IsSingleton = false;

export interface IAccessRequestPartial {
  message?: OPA.ILocalizable<string>;
  response?: OPA.ILocalizable<string>;
}

type UpdateHistoryItem = IAccessRequestPartial | OPA.IUpdateable_ByUser | OPA.ITaggable_ByUser | OPA.IArchivable_ByUser | OPA.IViewable_ByUser | OPA.IApprovable_ByUser<OPA.ApprovalState> | OPA.IDeleteable_ByUser; // eslint-disable-line max-len
interface IAccessRequestPartial_WithHistory extends IAccessRequestPartial, OPA.IUpdateable_ByUser {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

export interface IAccessRequest extends OPA.IDocument_Creatable_ByUser, OPA.IDocument_Updateable_ByUser_WithHistory<UpdateHistoryItem>, OPA.IDocument_Taggable_ByUser, OPA.IDocument_Archivable_ByUser, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Approvable_ByUser<OPA.ApprovalState>, OPA.IDocument_Deleteable_ByUser { // eslint-disable-line max-len
  readonly archiveId: string; // NOTE: This field stores information necessary to extend the OPA system to manage multiple Archives
  readonly isSpecificToCitation: boolean;
  readonly citationId: string | null;
  message: OPA.ILocalizable<string>;
  response: OPA.ILocalizable<string>;
}
const IAccessRequest_ReadOnlyPropertyNames = [
  OPA.getTypedPropertyKeyAsText<IAccessRequest>("archiveId"),
  OPA.getTypedPropertyKeyAsText<IAccessRequest>("isSpecificToCitation"),
  OPA.getTypedPropertyKeyAsText<IAccessRequest>("citationId"),
];

/**
 * Checks whether the specified updates to the specified AccessRequest document are valid.
 * @param {IAccessRequest} document The AccessRequest document being updated.
 * @param {IAccessRequestPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IAccessRequest, updateObject: IAccessRequestPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject as OPA.IDocument, IAccessRequest_ReadOnlyPropertyNames)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForCreatable_ByUser(document, updateObject as OPA.ICreatable_ByUser)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForUpdateable_ByUser(document, updateObject as OPA.IUpdateable_ByUser)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForTaggable_ByUser(document, updateObject as OPA.ITaggable_ByUser, ((updateObject as OPA.ITaggable_ByUser).userIdOfLatestTagger == document.userIdOfCreator))) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForArchivable_ByUser(document, updateObject as OPA.IArchivable_ByUser, ((updateObject as OPA.IArchivable_ByUser).userIdOfArchivalChanger == document.userIdOfCreator))) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForViewable_ByUser(document, updateObject as OPA.IViewable_ByUser, ((updateObject as OPA.IViewable_ByUser).userIdOfLatestViewer == document.userIdOfCreator))) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForApprovable_ByUser(document, updateObject as OPA.IApprovable_ByUser<OPA.ApprovalState>, ((updateObject as OPA.IApprovable_ByUser<OPA.ApprovalState>).userIdOfDecider == document.userIdOfCreator))) { // eslint-disable-line max-len
    return false;
  }
  if (!OPA.areUpdatesValid_ForDeleteable_ByUser(document, updateObject as OPA.IDeleteable_ByUser, ((updateObject as OPA.IDeleteable_ByUser).userIdOfDeletionChanger != document.userIdOfCreator))) {
    return false;
  }

  const userIdOfLatestUpdater = (updateObject as OPA.IUpdateable_ByUser).userIdOfLatestUpdater;

  // NOTE: Only the Creator can update the message
  if (!OPA.isUndefined(updateObject.message) && !OPA.areEqual(document.message, updateObject.message)) {
    const userNotCreator = (userIdOfLatestUpdater != document.userIdOfCreator);

    if (userNotCreator) {
      return false;
    }
  }

  // NOTE: Only the Viewers and Deciders can update the response
  if (!OPA.isUndefined(updateObject.response) && !OPA.areEqual(document.response, updateObject.response)) {
    let userIdsOfViewers = OPA.getIdentifiersFromObjects<OPA.IViewable_ByUser>(document.updateHistory, (doc) => doc.userIdOfLatestViewer);
    userIdsOfViewers = userIdsOfViewers.filter((userId) => (userId != document.userIdOfCreator));
    const userNotViewer = (!userIdsOfViewers.includes(OPA.convertNonNullish(userIdOfLatestUpdater)));

    let userIdsOfDeciders = OPA.getIdentifiersFromObjects<OPA.IApprovable_ByUser<OPA.ApprovalState>>(document.updateHistory, (doc) => doc.userIdOfDecider);
    userIdsOfDeciders = userIdsOfDeciders.filter((userId) => (userId != document.userIdOfCreator));
    const userNotDecider = (!userIdsOfDeciders.includes(OPA.convertNonNullish(userIdOfLatestUpdater)));

    if (userNotViewer && userNotDecider) {
      return false;
    }
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
    message: OPA.localizableStringConstructor(locale.optionName, message),
    response: OPA.localizableStringConstructor(DefaultLocale, ""), // NOTE: The Decider sets the response (and determines its Locale)
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    userIdOfCreator: user.id,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    userIdOfLatestUpdater: null,
    tags: ([] as Array<string>),
    dateOfLatestTagging: null,
    userIdOfLatestTagger: null,
    isArchived: false,
    dateOfArchivalChange: null,
    userIdOfArchivalChanger: null,
    hasBeenViewed: false,
    dateOfLatestViewing: null,
    userIdOfLatestViewer: null,
    hasBeenDecided: false,
    approvalState: OPA.ApprovalStates.pending,
    dateOfDecision: null,
    userIdOfDecider: null,
    isMarkedAsDeleted: false,
    dateOfDeletionChange: null,
    userIdOfDeletionChanger: null,
  };

  const documentCopy = OPA.copyObject(document);
  delete ((documentCopy as unknown) as Record<string, unknown>).updateHistory;
  document.updateHistory.push(documentCopy);
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
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} userId The ID for the relevant User within the OPA system.
   * @return {Promise<Array<IAccessRequest>>} The list of Access Requests that correspond to the relevant User.
   */
  async getAllForUserId(ds: OPA.IDataStorageState, userId: string): Promise<Array<IAccessRequest>> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertIdentifierIsValid(userId, "A valid OPA User ID must be provided.");

    const accessRequestsCollectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const getAccessRequestsForUserIdQuery = accessRequestsCollectionRef.where("userIdOfRequestor", "==", userId);
    const matchingAccessRequestsSnap = await getAccessRequestsForUserIdQuery.get();

    const matchingAccessRequests = matchingAccessRequestsSnap.docs.map((doc) => doc.data());
    const proxiedAccessRequests = matchingAccessRequests.map((document) => this.documentProxyConstructor(document));
    return proxiedAccessRequests;
  }

  /**
   * Creates an instance of the IAccessRequest document type stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {IUser} user The User creating the AccessRequest.
   * @param {ILocale} locale The Locale for that User.
   * @param {string} message A message containing information about the Access Request.
   * @param {string | null} [citationId=null] The ID of the Citation that the Access Request pertains to, if one exists.
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, user: IUser, locale: ILocale, message: string, citationId: string | null = null): Promise<string> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, user, locale, message, citationId);
    const proxiedDocument = this.documentProxyConstructor(document);

    OPA.assertNonNullish(proxiedDocument);
    OPA.assertNonNullish(proxiedDocument.updateHistory);
    OPA.assertIsTrue(proxiedDocument.id == documentId);
    OPA.assertIsTrue(proxiedDocument.updateHistory.length == 1);

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    batchUpdate.set(documentRef, proxiedDocument, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
    return documentId;
  }

  /**
   * Updates the AccessRequest stored on the server using an IAccessRequestPartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {IAccessRequestPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async update(ds: OPA.IDataStorageState, documentId: string, updateObject: IAccessRequestPartial, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    // NOTE: Get the document earlier to check validity before and after setting "updateHistory" to also make sure it was not set on the "updateObject" passed in
    const document = await this.getByIdWithAssert(ds, documentId);

    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject, ...updateObject_Updateable};
    let areValid = areUpdatesValid(document, updateObject);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);
    areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an ITaggable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {Array<string>} tags The tags that apply to the AccessRequest.
   * @param {string} userIdOfLatestTagger The ID for the latest Tagger within the OPA system.
   * @return {Promise<void>}
   */
  async setTags(ds: OPA.IDataStorageState, documentId: string, tags: Array<string>, userIdOfLatestTagger: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestTagger} as OPA.IUpdateable_ByUser);
    const updateObject_Taggable = ({tags, dateOfLatestTagging: now, userIdOfLatestTagger} as OPA.ITaggable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Taggable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an IArchivable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {boolean} isArchived Whether the AccessRequest should be marked as archived.
   * @param {string} userIdOfArchivalChanger The ID for the archival state Changer within the OPA system.
   * @return {Promise<void>}
   */
  async setToArchivalOption(ds: OPA.IDataStorageState, documentId: string, isArchived: boolean, userIdOfArchivalChanger: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfArchivalChanger} as OPA.IUpdateable_ByUser);
    const updateObject_Archivable = ({isArchived, dateOfArchivalChange: now, userIdOfArchivalChanger} as OPA.IArchivable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Archivable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an IViewable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {string} userIdOfLatestViewer The ID for the Viewer within the OPA system.
   * @return {Promise<void>}
   */
  async setToViewed(ds: OPA.IDataStorageState, documentId: string, userIdOfLatestViewer: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestViewer} as OPA.IUpdateable_ByUser);
    const updateObject_Viewable = ({hasBeenViewed: true, dateOfLatestViewing: now, userIdOfLatestViewer} as OPA.IViewable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Viewable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an IApprovable_ByUser<T> object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {OPA.ApprovalState} approvalState The ApprovalState for the AccessRequest.
   * @param {string} userIdOfDecider The ID for the Decider within the OPA system.
   * @return {Promise<void>}
   */
  async setToDecidedOption(ds: OPA.IDataStorageState, documentId: string, approvalState: OPA.ApprovalState, userIdOfDecider: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDecider} as OPA.IUpdateable_ByUser);
    const updateObject_Approvable = ({hasBeenDecided: true, approvalState, dateOfDecision: now, userIdOfDecider} as OPA.IApprovable_ByUser<OPA.ApprovalState>);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Approvable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Marks the AccessRequest as deleted on the server by constructing an IDeleteable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {string} userIdOfDeleter The ID for the Deleter within the OPA system.
   * @return {Promise<void>}
   */
  async markAsDeleted(ds: OPA.IDataStorageState, documentId: string, userIdOfDeleter: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDeleter} as OPA.IUpdateable_ByUser);
    const updateObject_Deleteable = ({isMarkedAsDeleted: true, dateOfDeletionChange: now, userIdOfDeletionChanger: userIdOfDeleter} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Deleteable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Marks the AccessRequest as un-deleted on the server by constructing an IDeleteable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {string} userIdOfUnDeleter The ID for the Deleter within the OPA system.
   * @return {Promise<void>}
   */
  async markAsUnDeleted(ds: OPA.IDataStorageState, documentId: string, userIdOfUnDeleter: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfUnDeleter} as OPA.IUpdateable_ByUser);
    const updateObject_Deleteable = ({isMarkedAsDeleted: false, dateOfDeletionChange: now, userIdOfDeletionChanger: userIdOfUnDeleter} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Deleteable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new AccessRequestQuerySet(cd));
