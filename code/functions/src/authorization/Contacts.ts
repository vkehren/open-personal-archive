import {onCall} from "firebase-functions/v2/https";
import * as OPA from "../../../base/src";
import {Contacts} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = module.filename.split(".")[0];
const getModuleName = () => moduleName;
type IContactDisplayModel = Contacts.IContactDisplayModel;

const getListOfContacts_FunctionName = () => (OPA.getTypedPropertyKeyAsText("getListOfContacts", {getListOfContacts})); // eslint-disable-line camelcase
export const getListOfContacts = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IContactDisplayModel>>(request, getModuleName, getListOfContacts_FunctionName, async (request, callState) => {
    const documents = await Contacts.getListOfContacts(callState);
    const displayModels = await Contacts.convertContactsToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IContactDisplayModel>>);
  return result;
});

const createContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("createContact", {createContact})); // eslint-disable-line camelcase
export const createContact = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, createContact_FunctionName, async (request, callState) => {
    const data = request.data;
    const organizationName = (data.query.organizationName) ? data.query.organizationName : null;
    const firstName = (data.query.firstName) ? data.query.firstName : null;
    const lastName = (data.query.lastName) ? data.query.lastName : null;
    const email = (data.query.email) ? data.query.email : null;
    const phoneNumber = (data.query.phoneNumber) ? data.query.phoneNumber : null;
    const address = (data.query.address) ? data.query.address : null;
    const message = (data.query.message) ? data.query.message : null;
    const otherInfo = (data.query.otherInfo) ? JSON.parse(data.query.otherInfo) : null;

    const document = await Contacts.createContact(callState, organizationName, firstName, lastName, email, phoneNumber, address, message, otherInfo);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const updateContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("updateContact", {updateContact})); // eslint-disable-line camelcase
export const updateContact = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, updateContact_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const updateObject = (data.query.updateObject) ? JSON.parse(data.query.updateObject) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.updateContact(callState, contactId, updateObject);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const setCorrespondingUsersForContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setCorrespondingUsersForContact", {setCorrespondingUsersForContact})); // eslint-disable-line camelcase
export const setCorrespondingUsersForContact = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, setCorrespondingUsersForContact_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const userIds = (data.query.userIds) ? JSON.parse(data.query.userIds) : undefined;
    const contentType = (data.query.contentType) ? data.query.contentType : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullish(userIds, "The corresponding User IDs must not be blank.");

    const document = await Contacts.setCorrespondingUsersForContact(callState, contactId, contactId, contentType);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});
