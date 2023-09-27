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
