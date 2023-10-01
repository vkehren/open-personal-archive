import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../../base/src";
import * as BT from "../../BaseTypes";
import {IUser} from "./User";

/* eslint-disable camelcase */
// NOTE: Eventually, Contacts will provide the mechanism by which the Archive Owner and Administrators can invite unauthenticated users to create User accounts

const SingularName = "Contact";
const PluralName = "Contacts";
const IsSingleton = false;

export interface IContactPartial extends OPA.IUpdateable_ByUser {
  organizationName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  message?: string | null;
  otherInfo?: Record<string, unknown>;
}

interface IContactForUsersPartial {
  correspondingUserIds: Array<string>;
  dateOfLatestCorrespondingUsersChange: OPA.DateToUse | null;
  userIdOfLatestCorrespondingUsersChanger: string | null;
}

type UpdateHistoryItem = IContactPartial | IContactForUsersPartial | OPA.IUpdateable_ByUser | OPA.ITaggable_ByUser | OPA.IArchivable_ByUser | OPA.IViewable_ByUser | OPA.IDeleteable_ByUser; // eslint-disable-line max-len
interface IContactPartial_WithHistory extends IContactPartial, OPA.IUpdateable {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

interface IContactForUsers extends OPA.IUpdateable_ByUser {
  readonly correspondingUserIds: Array<string>;
  readonly dateOfLatestCorrespondingUsersChange: OPA.DateToUse | null;
  readonly userIdOfLatestCorrespondingUsersChanger: string | null;
}
interface IDocument_ContactForUsers extends OPA.IDocument, IContactForUsers { }

export interface IContact extends IDocument_ContactForUsers, OPA.IDocument_Creatable_ByNullableUser, OPA.IDocument_Updateable_ByUser_WithHistory<UpdateHistoryItem>, OPA.IDocument_Taggable_ByUser, OPA.IDocument_Archivable_ByUser, OPA.IDocument_Viewable_ByUser, OPA.IDocument_Deleteable_ByUser { // eslint-disable-line max-len
  organizationName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  message: string | null;
  otherInfo: Record<string, unknown>;
}
const IContact_ReadOnlyPropertyNames = ([ // eslint-disable-line camelcase
  // LATER: Add readonly property names of IContact here
] as Array<string>);

/**
 * Checks whether the specified updates to the specified Contact document are valid.
 * @param {IContact} document The Contact document being updated.
 * @param {IContactPartial} updateObject The updates specified.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IContact, updateObject: IContactPartial, throwErrorOnInvalidUpdate = false): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  const updateObject_AsUnknown = (updateObject as unknown);
  const updateObject_AsContactForUsers = (updateObject_AsUnknown as IContactForUsersPartial);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject_AsUnknown as OPA.IDocument, IContact_ReadOnlyPropertyNames, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!OPA.areUpdatesValid_ForCreatable_ByNullableUser(document, updateObject_AsUnknown as OPA.ICreatable_ByNullableUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForUpdateable_ByUser = false;
  if (!OPA.areUpdatesValid_ForUpdateable_ByUser(document, updateObject_AsUnknown as OPA.IUpdateable_ByUser, preventUpdates_ForUpdateable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForTaggable_ByUser = false;
  if (!OPA.areUpdatesValid_ForTaggable_ByUser(document, updateObject_AsUnknown as OPA.ITaggable_ByUser, preventUpdates_ForTaggable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForArchivable_ByUser = false;
  if (!OPA.areUpdatesValid_ForArchivable_ByUser(document, updateObject_AsUnknown as OPA.IArchivable_ByUser, preventUpdates_ForArchivable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForViewable_ByUser = false;
  if (!OPA.areUpdatesValid_ForViewable_ByUser(document, updateObject_AsUnknown as OPA.IViewable_ByUser, preventUpdates_ForViewable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForDeleteable_ByUser = false;
  if (!OPA.areUpdatesValid_ForDeleteable_ByUser(document, updateObject_AsUnknown as OPA.IDeleteable_ByUser, preventUpdates_ForDeleteable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  if (OPA.isUndefined(updateObject_AsContactForUsers.correspondingUserIds)) {
    const dateIsSet = !OPA.isUndefined(updateObject_AsContactForUsers.dateOfLatestCorrespondingUsersChange);
    const userIsSet = !OPA.isUndefined(updateObject_AsContactForUsers.userIdOfLatestCorrespondingUsersChanger);

    if (dateIsSet || userIsSet) {
      return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  } else if (OPA.isNull(updateObject_AsContactForUsers.correspondingUserIds)) {
    throw new Error("The \"correspondingUserIds\" property must not be set to null.");
  } else {
    const dateNotSet = OPA.isNullish(updateObject_AsContactForUsers.dateOfLatestCorrespondingUsersChange);
    const userNotSet = OPA.isNullish(updateObject_AsContactForUsers.userIdOfLatestCorrespondingUsersChanger);

    if (dateNotSet || userNotSet) {
      return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
    }
  }
  return true;
}

/**
 * Creates an instance of the IContact document type.
 * @param {string} id The ID for the Contact within the OPA system.
 * @param {IUser | null} creator The User creating the Contact, if created by an authenticated user.
 * @param {string | null} organizationName The Contact's organization name.
 * @param {string | null} firstName The Contact's first name.
 * @param {string | null} lastName The Contact's last name.
 * @param {string | null} email The Contact's email address.
 * @param {string | null} phoneNumber The Contact's phone number.
 * @param {string | null} address The Contact's street address.
 * @param {string | null} message The Contact's message to the System.
 * @param {Record<string, unknown> | null} [otherInfo=null] Other information about the Contact.
 * @return {IContact} The new document instance.
 */
function createInstance(id: string, creator: IUser | null, organizationName: string | null, firstName: string | null, lastName: string | null, email: string | null, phoneNumber: string | null, address: string | null, message: string | null, otherInfo: Record<string, unknown> | null = null): IContact { // eslint-disable-line max-len
  const otherInfoNonNull = (!OPA.isNullish(otherInfo)) ? OPA.convertNonNullish(otherInfo) : {};
  const now = OPA.nowToUse();
  const document: IContact = {
    id: id,
    organizationName: organizationName,
    firstName: firstName,
    lastName: lastName,
    email: email,
    phoneNumber: phoneNumber,
    address: address,
    message: message,
    otherInfo: otherInfoNonNull,
    correspondingUserIds: [],
    dateOfLatestCorrespondingUsersChange: null,
    userIdOfLatestCorrespondingUsersChanger: null,
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    userIdOfCreator: OPA.getDocumentId(creator),
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
    isMarkedAsDeleted: false,
    dateOfDeletionChange: null,
    userIdOfDeletionChanger: null,
  };

  const documentCopy = OPA.copyObject(document);
  delete ((documentCopy as unknown) as Record<string, unknown>).updateHistory;
  document.updateHistory.push(documentCopy);
  return document;
}

/** Class providing queries for Contact collection. */
export class ContactQuerySet extends OPA.QuerySet<IContact> {
  /**
   * Creates a ContactQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IContact>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IContact>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IContact, ContactQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IContact, ContactQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IContact, ContactQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Creates an instance of the IContact document type stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {IUser | null} creator The User creating the Contact, if created by an authenticated user.
   * @param {string | null} organizationName The Contact's organization name.
   * @param {string | null} firstName The Contact's first name.
   * @param {string | null} lastName The Contact's last name.
   * @param {string | null} email The Contact's email address.
   * @param {string | null} phoneNumber The Contact's phone number.
   * @param {string | null} address The Contact's street address.
   * @param {string | null} message The Contact's message to the System.
   * @param {Record<string, unknown> | null} [otherInfo=null] Other information about the Contact.
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, creator: IUser | null, organizationName: string | null, firstName: string | null, lastName: string | null, email: string | null, phoneNumber: string | null, address: string | null, message: string | null, otherInfo: Record<string, unknown> | null = null): Promise<string> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, creator, organizationName, firstName, lastName, email, phoneNumber, address, message, otherInfo);
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
   * Updates the Contact stored on the server using an IContactPartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the Contact within the OPA system.
   * @param {IContactPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async update(ds: OPA.IDataStorageState, documentId: string, updateObject: IContactPartial, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(updateObject, "The incoming Update Object must not be null.");

    // NOTE: Get the document earlier to check validity before and after setting "updateHistory" to also make sure it was not set on the "updateObject" passed in
    const document = await this.getByIdWithAssert(ds, documentId);

    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject, ...updateObject_Updateable};
    let areValid = areUpdatesValid(document, updateObject, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IContactPartial_WithHistory);
    areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Sets the corresponding Users of the Contact stored on the server by constructing an IContactForUsersPartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the Contact within the OPA system.
   * @param {Array<IUser>} correspondingUsers The corresponding Users of the Contact.
   * @param {OPA.ArrayContentType} contentType The type of updates that the array represents.
   * @param {string} userIdOfLatestCorrespondingUsersChanger The ID for the latest Changer within the OPA system.
   * @return {Promise<void>}
   */
  async setCorrespondingUsers(ds: OPA.IDataStorageState, documentId: string, correspondingUsers: Array<IUser>, contentType: OPA.ArrayContentType, userIdOfLatestCorrespondingUsersChanger: string): Promise<void> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(correspondingUsers, "The array of corresponding Users must not be null.");
    correspondingUsers.forEach((value) => OPA.assertDocumentIsValid(value));
    OPA.assertNonNullish(contentType);
    OPA.assertIsOfLiteral<OPA.ArrayContentType>(contentType, OPA.ArrayContentTypes._all, OPA.ArrayContentTypes._typeName);

    const correspondingUserIds = correspondingUsers.map((value) => OPA.getDocumentIdWithAssert(value));
    let correspondingUserIdsValue: Array<string> | firestore.FieldValue = correspondingUserIds;
    if (contentType == OPA.ArrayContentTypes.only_added) {
      correspondingUserIdsValue = ds.constructorProvider.arrayUnion(...correspondingUserIds);
    } else if (contentType == OPA.ArrayContentTypes.only_removed) {
      correspondingUserIdsValue = ds.constructorProvider.arrayRemove(...correspondingUserIds);
    }
    const correspondingUserIdsValueAsArray = ((correspondingUserIdsValue as unknown) as Array<string>);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IContactPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestCorrespondingUsersChanger} as OPA.IUpdateable_ByUser);
    const updateObject_ContactForUsersPartial = ({correspondingUserIds: correspondingUserIdsValueAsArray, dateOfLatestCorrespondingUsersChange: now, userIdOfLatestCorrespondingUsersChanger} as IContactForUsersPartial); // eslint-disable-line max-len
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_ContactForUsersPartial};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IContactPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the Contact stored on the server by constructing an ITaggable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the Contact within the OPA system.
   * @param {Array<string>} tags The tags that apply to the Contact.
   * @param {OPA.ArrayContentType} contentType The type of updates that the array represents.
   * @param {string} userIdOfLatestTagger The ID for the latest Tagger within the OPA system.
   * @return {Promise<void>}
   */
  async setTags(ds: OPA.IDataStorageState, documentId: string, tags: Array<string>, contentType: OPA.ArrayContentType, userIdOfLatestTagger: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(tags, "The array of Tags must not be null.");
    OPA.assertNonNullish(contentType);
    OPA.assertIsOfLiteral<OPA.ArrayContentType>(contentType, OPA.ArrayContentTypes._all, OPA.ArrayContentTypes._typeName);

    let tagsValue: Array<string> | firestore.FieldValue = tags;
    if (contentType == OPA.ArrayContentTypes.only_added) {
      tagsValue = ds.constructorProvider.arrayUnion(...tags);
    } else if (contentType == OPA.ArrayContentTypes.only_removed) {
      tagsValue = ds.constructorProvider.arrayRemove(...tags);
    }
    const tagsValueAsArray = ((tagsValue as unknown) as Array<string>);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IContactPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestTagger} as OPA.IUpdateable_ByUser);
    const updateObject_Taggable = ({tags: tagsValueAsArray, dateOfLatestTagging: now, userIdOfLatestTagger} as OPA.ITaggable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Taggable};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IContactPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the Contact stored on the server by constructing an IArchivable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the Contact within the OPA system.
   * @param {boolean} isArchived Whether the Contact should be marked as archived.
   * @param {string} userIdOfArchivalChanger The ID for the archival state Changer within the OPA system.
   * @return {Promise<void>}
   */
  async setToArchivalOption(ds: OPA.IDataStorageState, documentId: string, isArchived: boolean, userIdOfArchivalChanger: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IContactPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfArchivalChanger} as OPA.IUpdateable_ByUser);
    const updateObject_Archivable = ({isArchived, dateOfArchivalChange: now, userIdOfArchivalChanger} as OPA.IArchivable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Archivable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IContactPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Updates the Contact stored on the server by constructing an IViewable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the Contact within the OPA system.
   * @param {string} userIdOfLatestViewer The ID for the Viewer within the OPA system.
   * @return {Promise<void>}
   */
  async setToViewed(ds: OPA.IDataStorageState, documentId: string, userIdOfLatestViewer: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IContactPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestViewer} as OPA.IUpdateable_ByUser);
    const updateObject_Viewable = ({hasBeenViewed: true, dateOfLatestViewing: now, userIdOfLatestViewer} as OPA.IViewable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Viewable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IContactPartial_WithHistory);

    const document = await this.getByIdWithAssert(ds, documentId);
    const areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }

  /**
   * Marks the Contact's deletion state stored on the server by constructing an IDeleteable_ByUser object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} documentId The ID for the Contact within the OPA system.
   * @param {OPA.DeletionState} deletionState The deletion state with which to mark the Contact.
   * @param {string} userIdOfDeletionChanger The ID for the deletion state Changer within the OPA system.
   * @return {Promise<void>}
   */
  async markWithDeletionState(ds: OPA.IDataStorageState, documentId: string, deletionState: OPA.DeletionState, userIdOfDeletionChanger: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(deletionState);
    OPA.assertIsOfLiteral<OPA.DeletionState>(deletionState, OPA.DeletionStates._all, OPA.DeletionStates._typeName);

    // NOTE: We need the document earlier in this function to get the existing values for IDeleteable_ByUser
    const document = await this.getByIdWithAssert(ds, documentId);
    const toBeMarkedAsDeleted = (deletionState == OPA.DeletionStates.deleted);
    OPA.assertIsTrue((toBeMarkedAsDeleted != document.isMarkedAsDeleted), "The AccessRequest's deletion status is already of the desired value.");

    const now = OPA.nowToUse();
    const updateObject_Partial = ({} as IContactPartial);
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfDeletionChanger} as OPA.IUpdateable_ByUser);
    const updateObject_Deleteable = ({isMarkedAsDeleted: toBeMarkedAsDeleted, dateOfDeletionChange: now, userIdOfDeletionChanger} as OPA.IDeleteable_ByUser);
    const updateObject = {...updateObject_Partial, ...updateObject_Updateable, ...updateObject_Deleteable};
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IContactPartial_WithHistory);

    const areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IContact, ContactQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ContactQuerySet(cd));
