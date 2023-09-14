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

type UpdateHistoryItem = IAccessRequestPartial | OPA.IUpdateable_ByUser | OPA.ITaggable_ByUser | OPA.IArchivable_ByUser | OPA.IViewable_ByUser | OPA.IApprovable_ByUser<BT.ApprovalState> | OPA.IDeleteable_ByUser;
interface IAccessRequestPartial_WithHistory extends IAccessRequestPartial, OPA.IUpdateable_ByUser {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

// NOTE: Use "IDocument_Creatable_ByUser" because we must record the User who created the AccessRequest (i.e. the owner of the AccessRequest)
// NOTE: Use "IDocument_Updateable_ByUser" because the User creating the AccessRequest updates the "message", but the Decider updates the "response"
export interface IAccessRequest extends OPA.IDocument_Creatable_ByUser, OPA.IDocument_Updateable_ByUser, OPA.IDocument_Taggable_ByUser, OPA.IDocument_Archivable_ByUser, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Approvable_ByUser<BT.ApprovalState>, OPA.IDocument_Deleteable_ByUser {
  readonly id: string;
  readonly archiveId: string; // NOTE: This field stores information necessary to extend the OPA system to manage multiple Archives
  readonly isSpecificToCitation: boolean;
  readonly citationId: string | null;
  message: OPA.ILocalizable<string>;
  response: OPA.ILocalizable<string>;
  readonly updateHistory: Array<UpdateHistoryItem>;
}

/**
 * Checks whether the specified updates to the specified AccessRequest document are valid.
 * @param {IAccessRequest} document The AccessRequest document being updated.
 * @param {IAccessRequestPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IAccessRequest, updateObject: IAccessRequestPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: updateObject MUST implement IUpdateable_ByUser, so check immediately and do NOT use "if (true) {...}"
  const updateObject_Updateable = (updateObject as OPA.IUpdateable_ByUser);

  if (!updateObject_Updateable.hasBeenUpdated || OPA.isNullish(updateObject_Updateable.dateOfLatestUpdate) || OPA.isNullish(updateObject_Updateable.userIdOfLatestUpdater)) {
    return false;
  }

  // NOTE: updateObject MUST NOT change read-only data
  const propertyNames_ForUpdate = OPA.getOwnPropertyKeys(updateObject);
  const id_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).id);
  const archiveId_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).archiveId);
  const isSpecificToCitation_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).isSpecificToCitation);
  const citationId_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).citationId);

  if (id_IsUpdated || archiveId_IsUpdated || isSpecificToCitation_IsUpdated || citationId_IsUpdated) {
    return false;
  }

  // NOTE: updateObject MUST NOT erase read-only history of changes
  const updateHistory_KeyText = OPA.getTypedPropertyKeysAsText(document).updateHistory;
  const updateHistory_IsUpdated = propertyNames_ForUpdate.includes(updateHistory_KeyText);
  const updateHistory_Value = (updateObject as any)[updateHistory_KeyText];

  if (updateHistory_IsUpdated && !OPA.isOfFieldValue_ArrayUnion<firestore.FieldValue>(updateHistory_Value)) {
    return false;
  }

  // NOTE: updateObject MUST NOT change data of already deleted document BEYOND the minimum necessary to un-delete document
  if (document.isMarkedAsDeleted) {
    const propertyNames_NotForUnDelete = propertyNames_ForUpdate.filter((propertyName) => !BT.PropertyNames_ForUnDelete_ByUser.includes(propertyName));

    if (propertyNames_NotForUnDelete.length > 0) {
      return false;
    }
  }

  if (true) {
    const updateObject_Creatable = (updateObject as OPA.ICreatable_ByUser);

    if (!OPA.isNullish(updateObject_Creatable.dateOfCreation) || !OPA.isNullish(updateObject_Creatable.userIdOfCreator)) {
      const dateMatchesDoc = (updateObject_Creatable.dateOfCreation == document.dateOfCreation);
      const userMatchesDoc = (updateObject_Creatable.userIdOfCreator == document.userIdOfCreator);

      if (!dateMatchesDoc || !userMatchesDoc) {
        return false;
      }
    }
  }

  if (true) {
    const updateObject_Taggable = (updateObject as OPA.ITaggable_ByUser);

    if (OPA.isUndefined(updateObject_Taggable.tags)) {
      const dateIsSet = !OPA.isUndefined(updateObject_Taggable.dateOfLatestTagging);
      const userIsSet = !OPA.isUndefined(updateObject_Taggable.userIdOfLatestTagger);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Taggable.tags)) {
      throw new Error("The \"tags\" property must not be set to null.");
    } else if (!OPA.isOf<Array<string>>(updateObject_Taggable.tags, (value) => !OPA.isUndefined(value.splice))) {
      throw new Error("The \"tags\" property can only be set to a value of type \"Array<string>\".");
    } else {
      const dateNotSet = OPA.isNullish(updateObject_Taggable.dateOfLatestTagging);
      const userNotSet = OPA.isNullish(updateObject_Taggable.userIdOfLatestTagger);
      const isSelfTagged = (updateObject_Taggable.userIdOfLatestTagger == document.userIdOfCreator);

      if (dateNotSet || userNotSet || isSelfTagged) {
        return false;
      }
    }
  }

  if (true) {
    const updateObject_Archivable = (updateObject as OPA.IArchivable_ByUser);

    if (OPA.isUndefined(updateObject_Archivable.isArchived)) {
      const dateIsSet = !OPA.isUndefined(updateObject_Archivable.dateOfArchivalChange);
      const userIsSet = !OPA.isUndefined(updateObject_Archivable.userIdOfArchivalChanger);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Archivable.isArchived)) {
      throw new Error("The \"isArchived\" property must not be set to null.");
    } else if (updateObject_Archivable.isArchived) {
      const dateNotSet = OPA.isNullish(updateObject_Archivable.dateOfArchivalChange);
      const userNotSet = OPA.isNullish(updateObject_Archivable.userIdOfArchivalChanger);

      if (dateNotSet || userNotSet) {
        return false;
      }
    } else {
      const docIsArchived = document.isArchived;
      const dateNotSet = OPA.isNullish(updateObject_Archivable.dateOfArchivalChange);
      const userNotSet = OPA.isNullish(updateObject_Archivable.userIdOfArchivalChanger);
      const userCanUnArchive = true;

      if ((docIsArchived && !userCanUnArchive) || dateNotSet || userNotSet) {
        return false;
      }
    }
  }

  if (true) {
    const updateObject_Viewable = (updateObject as OPA.IViewable_ByUser);

    if (OPA.isUndefined(updateObject_Viewable.hasBeenViewed)) {
      const dateIsSet = !OPA.isUndefined(updateObject_Viewable.dateOfLatestViewing);
      const userIsSet = !OPA.isUndefined(updateObject_Viewable.userIdOfLatestViewer);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Viewable.hasBeenViewed)) {
      throw new Error("The \"hasBeenViewed\" property must not be set to null.");
    } else if (updateObject_Viewable.hasBeenViewed) {
      const dateNotSet = OPA.isNullish(updateObject_Viewable.dateOfLatestViewing);
      const userNotSet = OPA.isNullish(updateObject_Viewable.userIdOfLatestViewer);

      if (dateNotSet || userNotSet) {
        return false;
      }
    } else {
      const docIsViewed = document.hasBeenViewed;
      const dateIsSet = !OPA.isNullish(updateObject_Viewable.dateOfLatestViewing);
      const userIsSet = !OPA.isNullish(updateObject_Viewable.userIdOfLatestViewer);
      const userCanUnView = false;

      if ((docIsViewed && !userCanUnView) || dateIsSet || userIsSet) {
        return false;
      }
    }
  }

  if (true) {
    const updateObject_Approvable = (updateObject as OPA.IApprovable_ByUser<BT.ApprovalState>);

    if (OPA.isUndefined(updateObject_Approvable.hasBeenDecided)) {
      const stateIsSet = !OPA.isUndefined(updateObject_Approvable.approvalState);
      const dateIsSet = !OPA.isUndefined(updateObject_Approvable.dateOfDecision);
      const userIsSet = !OPA.isUndefined(updateObject_Approvable.userIdOfDecider);

      if (stateIsSet || dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Approvable.hasBeenDecided)) {
      throw new Error("The \"hasBeenDecided\" property must not be set to null.");
    } else if (updateObject_Approvable.hasBeenDecided) {
      const stateNotSet = OPA.isNullish(updateObject_Approvable.approvalState);
      const dateNotSet = OPA.isNullish(updateObject_Approvable.dateOfDecision);
      const userNotSet = OPA.isNullish(updateObject_Approvable.userIdOfDecider);
      const stateNotDecided = !BT.ApprovalStates.decided.includes(updateObject_Approvable.approvalState);
      const isSelfApproved = (updateObject_Approvable.userIdOfDecider == document.userIdOfCreator);

      if (stateNotSet || dateNotSet || userNotSet || stateNotDecided || isSelfApproved) {
        return false;
      }
    } else {
      const docIsDecided = document.hasBeenDecided;
      const stateNotSet = OPA.isNullish(updateObject_Approvable.approvalState);
      const dateIsSet = !OPA.isNullish(updateObject_Approvable.dateOfDecision);
      const userIsSet = !OPA.isNullish(updateObject_Approvable.userIdOfDecider);
      const stateNotPending = (updateObject_Approvable.approvalState != BT.ApprovalStates.pending);
      const userCanUnDecide = false;

      if ((docIsDecided && !userCanUnDecide) || stateNotSet || stateNotPending || dateIsSet || userIsSet) {
        return false;
      }
    }
  }

  if (true) {
    const updateObject_Deleteable = (updateObject as OPA.IDeleteable_ByUser);

    if (OPA.isUndefined(updateObject_Deleteable.isMarkedAsDeleted)) {
      const dateIsSet = !OPA.isUndefined(updateObject_Deleteable.dateOfDeletion);
      const userIsSet = !OPA.isUndefined(updateObject_Deleteable.userIdOfDeleter);

      if (dateIsSet || userIsSet) {
        return false;
      }
    } else if (OPA.isNullish(updateObject_Deleteable.isMarkedAsDeleted)) {
      throw new Error("The \"isMarkedAsDeleted\" property must not be set to null.");
    } else if (updateObject_Deleteable.isMarkedAsDeleted) {
      const docIsDeleted = document.isMarkedAsDeleted;
      const dateNotSet = OPA.isNullish(updateObject_Deleteable.dateOfDeletion);
      const userNotSet = OPA.isNullish(updateObject_Deleteable.userIdOfDeleter);
      const userNotCreator = (updateObject_Deleteable.userIdOfDeleter != document.userIdOfCreator);

      if (docIsDeleted || dateNotSet || userNotSet || userNotCreator) {
        return false;
      }
    } else {
      const docIsDeleted = document.isMarkedAsDeleted;
      const dateIsSet = !OPA.isNullish(updateObject_Deleteable.dateOfDeletion);
      const userIsSet = !OPA.isNullish(updateObject_Deleteable.userIdOfDeleter);
      const userCanUnDelete = (updateObject_Updateable.userIdOfLatestUpdater == document.userIdOfCreator);

      if ((docIsDeleted && !userCanUnDelete) || dateIsSet || userIsSet) {
        return false;
      }
    }
  }

  // NOTE: Only the Creator can update the message
  if (!OPA.isUndefined(updateObject.message) && !OPA.areEqual(document.message, updateObject.message)) {
    const userNotCreator = (updateObject_Updateable.userIdOfLatestUpdater != document.userIdOfCreator);

    if (userNotCreator) {
      return false;
    }
  }

  // NOTE: Only the Viewers and Deciders can update the response
  if (!OPA.isUndefined(updateObject.response) && !OPA.areEqual(document.response, updateObject.response)) {
    let userIdsOfViewers = OPA.extractUserIdsFromObjects<OPA.IViewable_ByUser>(document.updateHistory, (doc) => doc.userIdOfLatestViewer);
    userIdsOfViewers = userIdsOfViewers.filter((userId) => (userId != document.userIdOfCreator));
    const userNotViewer = (!userIdsOfViewers.includes(OPA.convertNonNullish(updateObject_Updateable.userIdOfLatestUpdater)));

    let userIdsOfDeciders = OPA.extractUserIdsFromObjects<OPA.IApprovable_ByUser<BT.ApprovalState>>(document.updateHistory, (doc) => doc.userIdOfDecider);
    userIdsOfDeciders = userIdsOfDeciders.filter((userId) => (userId != document.userIdOfCreator));
    const userNotDecider = (!userIdsOfDeciders.includes(OPA.convertNonNullish(updateObject_Updateable.userIdOfLatestUpdater)));

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
    message: BT.localizableStringConstructor(locale.optionName, message),
    response: BT.localizableStringConstructor(DefaultLocale, ""), // NOTE: The Decider sets the response (and determines its Locale)
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
    return proxiedAccessRequests
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
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
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

    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject, ...updateObject_Updateable};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
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

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
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

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
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

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
  }

  /**
   * Updates the AccessRequest stored on the server by constructing an IApprovable_ByUser<T> object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the AccessRequest within the OPA system.
   * @param {BT.ApprovalState} approvalState The ApprovalState for the AccessRequest.
   * @param {string} userIdOfDecider The ID for the Decider within the OPA system.
   * @return {Promise<void>}
   */
  async setToDecidedOption(ds: OPA.IDataStorageState, documentId: string, approvalState: BT.ApprovalState, userIdOfDecider: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IAccessRequestPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDecider} as OPA.IUpdateable_ByUser);
    const updateObject_Approvable = ({hasBeenDecided: true, approvalState, dateOfDecision: now, userIdOfDecider} as OPA.IApprovable_ByUser<BT.ApprovalState>);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Approvable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
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
    const updateObject_Deleteable = ({isMarkedAsDeleted: true, dateOfDeletion: now, userIdOfDeleter} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Deleteable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IAccessRequestPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new AccessRequestQuerySet(cd));
