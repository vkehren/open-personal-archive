import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "../system/Application";

export interface IContactDisplayModel {
  readonly id: string;
  readonly organizationName: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly email: string | null;
  readonly phoneNumber: string | null;
  readonly address: string | null;
  readonly message: string | null;
  readonly otherInfo: Record<string, unknown>;
  // LATER: Add other properties
}

/**
 * Converts an array of IContacts to an array of IContacts.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {Array<OpaDm.IContact>} contacts The array of IContacts.
 * @return {Promise<Array<IContactDisplayModel>>}
 */
export async function convertContactsToDisplayModels(callState: OpaDm.ICallState, contacts: Array<OpaDm.IContact>): Promise<Array<IContactDisplayModel>> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertNonNullish(contacts);

  const contactDisplayModels = contacts.map((contact) => ({
    id: contact.id,
    organizationName: contact.organizationName,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phoneNumber: contact.phoneNumber,
    address: contact.address,
    message: contact.message,
    otherInfo: contact.otherInfo,
    // LATER: Consider iterating over contents of "otherInfo" and using "locale" to convert "ILocalizable<string>" properties to "string"
  } as IContactDisplayModel));
  return contactDisplayModels;
}

/**
 * Converts an IContact to an IContactDisplayModel.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OpaDm.IContact} contact The IContact.
 * @return {Promise<IContactDisplayModel>}
 */
export async function convertContactToDisplayModel(callState: OpaDm.ICallState, contact: OpaDm.IContact): Promise<IContactDisplayModel> {
  const contactDisplayModels = await convertContactsToDisplayModels(callState, [contact]);

  OPA.assertNonNullish(contactDisplayModels);
  OPA.assertIsTrue(contactDisplayModels.length == 1);

  const contactDisplayModel = contactDisplayModels[0];
  return contactDisplayModel;
}

/**
 * Gets the list of Contacts in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @return {Promise<Array<OpaDm.IContact>>}
 */
export async function getListOfContacts(callState: OpaDm.ICallState): Promise<Array<OpaDm.IContact>> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authViewersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authViewers);
  const authViewersIds = [...authViewersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authViewersIds);

  const contacts = await OpaDb.Contacts.queries.getAll(callState.dataStorageState);
  return contacts;
}

/**
 * Creates a Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string | null} organizationName The Contact's organization name.
 * @param {string | null} firstName The Contact's first name.
 * @param {string | null} lastName The Contact's last name.
 * @param {string | null} email The Contact's email address.
 * @param {string | null} phoneNumber The Contact's phone number.
 * @param {string | null} address The Contact's street address.
 * @param {string | null} message The Contact's message to the System.
 * @param {Record<string, unknown> | null} [otherInfo=null] Other information about the Contact.
 * @return {Promise<OpaDm.IContact>}
 */
export async function createContact(callState: OpaDm.ICallState, organizationName: string | null, firstName: string | null, lastName: string | null, email: string | null, phoneNumber: string | null, address: string | null, message: string | null, otherInfo: Record<string, unknown> | null = null): Promise<OpaDm.IContact> { // eslint-disable-line max-len
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const user = authorizationState.user;
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const contactId = await OpaDb.Contacts.queries.create(callState.dataStorageState, user, organizationName, firstName, lastName, email, phoneNumber, address, message, otherInfo);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactId, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Updates the Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToUpdate The Contact to update.
 * @param {OpaDm.IContactPartial} updateObject The object containing the updated property values.
 * @return {Promise<OpaDm.IContact>}
 */
export async function updateContact(callState: OpaDm.ICallState, contactIdToUpdate: string, updateObject: OpaDm.IContactPartial): Promise<OpaDm.IContact> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Contacts.queries.update(callState.dataStorageState, contactIdToUpdate, updateObject, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactIdToUpdate, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Sets the Corresponding Users for the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToSet The Contact to set.
 * @param {Array<string>} correspondingUserIds The IDs of the Corresponding Users that apply to the Contact (usually only one User corresponds to one Contact).
 * @param {OPA.ArrayContentType} [contentType="exact"] The content type of the array.
 * @return {Promise<OpaDm.IContact>}
 */
export async function setCorrespondingUsersForContact(callState: OpaDm.ICallState, contactIdToSet: string, correspondingUserIds: Array<string>, contentType = OPA.ArrayContentTypes.exact): Promise<OpaDm.IContact> { // eslint-disable-line max-len
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const correspondingUsers = await OpaDb.Users.queries.getForIdsWithAssert(callState.dataStorageState, correspondingUserIds);
  await OpaDb.Contacts.queries.setCorrespondingUsers(callState.dataStorageState, contactIdToSet, correspondingUsers, contentType, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactIdToSet, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Adds the Corresponding Users to the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToAddTo The Contact to which to add.
 * @param {Array<string>} correspondingUserIdsToAdd The IDs of the Corresponding Users to add.
 * @return {Promise<OpaDm.IContact>}
 */
export async function addCorrespondingUsersToContact(callState: OpaDm.ICallState, contactIdToAddTo: string, correspondingUserIdsToAdd: Array<string>): Promise<OpaDm.IContact> {
  return await setCorrespondingUsersForContact(callState, contactIdToAddTo, correspondingUserIdsToAdd, OPA.ArrayContentTypes.only_added);
}

/**
 * Removes the Corresponding Users from the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToRemoveFrom The Contact from which to remove.
 * @param {Array<string>} correspondingUserIdsToRemove The IDs of the Corresponding Users to remove.
 * @return {Promise<OpaDm.IContact>}
 */
export async function removeCorrespondingUsersFromContact(callState: OpaDm.ICallState, contactIdToRemoveFrom: string, correspondingUserIdsToRemove: Array<string>): Promise<OpaDm.IContact> {
  return await setCorrespondingUsersForContact(callState, contactIdToRemoveFrom, correspondingUserIdsToRemove, OPA.ArrayContentTypes.only_removed);
}

/**
 * Set the Tags of the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToSet The Contact to set.
 * @param {Array<string>} tags The tags that apply to the Contact.
 * @param {OPA.ArrayContentType} [contentType="exact"] The content type of the array.
 * @return {Promise<OpaDm.IContact>}
 */
export async function setContactTags(callState: OpaDm.ICallState, contactIdToSet: string, tags: Array<string>, contentType = OPA.ArrayContentTypes.exact): Promise<OpaDm.IContact> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Contacts.queries.setTags(callState.dataStorageState, contactIdToSet, tags, contentType, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactIdToSet, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Adds the Tags to the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToAddTo The Contact to which to add Tags.
 * @param {Array<string>} tagsToAdd The tags to add to the Contact.
 * @return {Promise<OpaDm.IContact>}
 */
export async function addContactTags(callState: OpaDm.ICallState, contactIdToAddTo: string, tagsToAdd: Array<string>): Promise<OpaDm.IContact> {
  return await setContactTags(callState, contactIdToAddTo, tagsToAdd, OPA.ArrayContentTypes.only_added);
}

/**
 * Removes the Tags from the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToRemoveFrom The Contact from which to remove Tags.
 * @param {Array<string>} tagsToRemove The tags to remove from the Contact.
 * @return {Promise<OpaDm.IContact>}
 */
export async function removeContactTags(callState: OpaDm.ICallState, contactIdToRemoveFrom: string, tagsToRemove: Array<string>): Promise<OpaDm.IContact> {
  return await setContactTags(callState, contactIdToRemoveFrom, tagsToRemove, OPA.ArrayContentTypes.only_removed);
}

/**
 * Set the ArchivalState of the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToSet The Contact to set the ArchivalState of.
 * @param {OpaDm.ArchivalState} archivalState The ArchivalState to set to.
 * @return {Promise<OpaDm.IContact>}
 */
export async function setContactToArchivalState(callState: OpaDm.ICallState, contactIdToSet: string, archivalState: OPA.ArchivalState): Promise<OpaDm.IContact> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const isArchived = (archivalState == OPA.ArchivalStates.archived);
  await OpaDb.Contacts.queries.setToArchivalOption(callState.dataStorageState, contactIdToSet, isArchived, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactIdToSet, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Set the ArchivalState to Archived for the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToSet The Contact to set the ArchivalState of.
 * @return {Promise<OpaDm.IContact>}
 */
export async function setContactToArchived(callState: OpaDm.ICallState, contactIdToSet: string): Promise<OpaDm.IContact> {
  return await setContactToArchivalState(callState, contactIdToSet, OPA.ArchivalStates.archived);
}

/**
 * Set the ArchivalState to NotArchived for the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToSet The Contact to set the ArchivalState of.
 * @return {Promise<OpaDm.IContact>}
 */
export async function setContactToNotArchived(callState: OpaDm.ICallState, contactIdToSet: string): Promise<OpaDm.IContact> {
  return await setContactToArchivalState(callState, contactIdToSet, OPA.ArchivalStates.not_archived);
}

/**
 * Updates the Viewed status of the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToSet The Contact to set the status of.
 * @return {Promise<OpaDm.IContact>}
 */
export async function setContactToViewed(callState: OpaDm.ICallState, contactIdToSet: string): Promise<OpaDm.IContact> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Contacts.queries.setToViewed(callState.dataStorageState, contactIdToSet, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactIdToSet, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Updates the deletion status of the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToMark The Contact to mark the status of.
 * @param {OPA.DeletionState} deletionState The DeletionState to set to.
 * @return {Promise<OpaDm.IContact>}
 */
export async function markContactWithDeletionState(callState: OpaDm.ICallState, contactIdToMark: string, deletionState: OPA.DeletionState): Promise<OpaDm.IContact> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.Contacts.queries.markWithDeletionState(callState.dataStorageState, contactIdToMark, deletionState, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const contactReRead = await OpaDb.Contacts.queries.getByIdWithAssert(callState.dataStorageState, contactIdToMark, "The requested Contact does not exist.");
  return contactReRead;
}

/**
 * Sets the Deletion status to "true" for the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToMark The Contact to mark the status of.
 * @return {Promise<OpaDm.IContact>}
 */
export async function markContactAsDeleted(callState: OpaDm.ICallState, contactIdToMark: string): Promise<OpaDm.IContact> {
  return await markContactWithDeletionState(callState, contactIdToMark, OPA.DeletionStates.deleted);
}

/**
 * Sets the Deletion status to "false" for the specified Contact in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} contactIdToMark The Contact to mark the status of.
 * @return {Promise<OpaDm.IContact>}
 */
export async function markContactAsUnDeleted(callState: OpaDm.ICallState, contactIdToMark: string): Promise<OpaDm.IContact> {
  return await markContactWithDeletionState(callState, contactIdToMark, OPA.DeletionStates.undeleted);
}
