import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import * as CSU from "../../../domainlogic/src/CallStateUtilities";
import {Contacts} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

// NOTE: Eventually, Contacts will provide the mechanism by which the Archive Owner and Administrators can invite unauthenticated users to create User accounts

const moduleName = module.filename.split(".")[0];
const getModuleName = () => moduleName;
type IContactDisplayModel = Contacts.IContactDisplayModel;

const getListOfContacts_FunctionName = () => (OPA.getTypedPropertyKeyAsText("getListOfContacts", {getListOfContacts})); // eslint-disable-line camelcase
export const getListOfContacts = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IContactDisplayModel>>(request, getModuleName, getListOfContacts_FunctionName, async (request, callState) => {
    const documents = await Contacts.getListOfContacts(callState);
    const displayModels = await Contacts.convertContactsToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IContactDisplayModel>>);
  return result;
});

const createContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("createContact", {createContact})); // eslint-disable-line camelcase
export const createContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  let authenticationState = ((null as unknown) as OpaDm.IAuthenticationState | null);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, createContact_FunctionName(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp);
    authenticationState = await UTL.getAuthenticationStateForContextAndApp(request, adminApp);

    await UTL.setExternalLogState(dataStorageState, request);
    await UTL.logFunctionCall(dataStorageState, authenticationState, shimmedRequest, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const organizationName = (data.query.organizationName) ? data.query.organizationName : null;
    const firstName = (data.query.firstName) ? data.query.firstName : null;
    const lastName = (data.query.lastName) ? data.query.lastName : null;
    const email = (data.query.email) ? data.query.email : null;
    const phoneNumber = (data.query.phoneNumber) ? data.query.phoneNumber : null;
    const address = (data.query.address) ? data.query.address : null;
    const message = (data.query.message) ? data.query.message : null;
    const otherInfo = (data.query.otherInfo) ? JSON.parse(data.query.otherInfo) : null;

    const document = await Contacts.createContact(dataStorageState, authenticationState, organizationName, firstName, lastName, email, phoneNumber, address, message, otherInfo);

    if (OPA.isNullish(authenticationState)) {
      const minDisplayModel = {id: OPA.getDocumentIdWithAssert(document)};
      return OPA.getSuccessResult(minDisplayModel);
    } else {
      const authenticationStateNonNull = OPA.convertNonNullish(authenticationState);
      const callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationStateNonNull);

      const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
      return OPA.getSuccessResult(displayModel);
    }
  } catch (error) {
    await UTL.logFunctionError(dataStorageState, authenticationState, shimmedRequest, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(dataStorageState, authenticationState, adminApp, shimmedRequest);
  }
});

const updateContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("updateContact", {updateContact})); // eslint-disable-line camelcase
export const updateContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
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
export const setCorrespondingUsersForContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
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

const addCorrespondingUsersToContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("addCorrespondingUsersToContact", {addCorrespondingUsersToContact})); // eslint-disable-line camelcase
export const addCorrespondingUsersToContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, addCorrespondingUsersToContact_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const userIds = (data.query.userIds) ? JSON.parse(data.query.userIds) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullish(userIds, "The corresponding User IDs must not be blank.");

    const document = await Contacts.addCorrespondingUsersToContact(callState, contactId, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const removeCorrespondingUsersFromContact_FunctionName = () => (OPA.getTypedPropertyKeyAsText("removeCorrespondingUsersFromContact", {removeCorrespondingUsersFromContact})); // eslint-disable-line camelcase, max-len
export const removeCorrespondingUsersFromContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, removeCorrespondingUsersFromContact_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const userIds = (data.query.userIds) ? JSON.parse(data.query.userIds) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullish(userIds, "The corresponding User IDs must not be blank.");

    const document = await Contacts.removeCorrespondingUsersFromContact(callState, contactId, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const setContactTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setContactTags", {setContactTags})); // eslint-disable-line camelcase
export const setContactTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, setContactTags_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const tags = (data.query.tags) ? JSON.parse(data.query.tags) : undefined;
    const contentType = (data.query.contentType) ? data.query.contentType : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Contact tags must not be blank.");

    const document = await Contacts.setContactTags(callState, contactId, tags, contentType);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const addContactTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("addContactTags", {addContactTags})); // eslint-disable-line camelcase
export const addContactTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, addContactTags_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const tags = (data.query.tags) ? JSON.parse(data.query.tags) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Contact tags must not be blank.");

    const document = await Contacts.addContactTags(callState, contactId, tags);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const removeContactTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("removeContactTags", {removeContactTags})); // eslint-disable-line camelcase
export const removeContactTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, removeContactTags_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const tags = (data.query.tags) ? JSON.parse(data.query.tags) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Contact tags must not be blank.");

    const document = await Contacts.removeContactTags(callState, contactId, tags);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const setContactToArchivalState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setContactToArchivalState", {setContactToArchivalState})); // eslint-disable-line camelcase
export const setContactToArchivalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, setContactToArchivalState_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const archivalState = (data.query.archivalState) ? data.query.archivalState : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(archivalState, "The Contact archival state must not be blank.");

    const document = await Contacts.setContactToArchivalState(callState, contactId, archivalState);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const setContactToArchived_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setContactToArchived", {setContactToArchived})); // eslint-disable-line camelcase
export const setContactToArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, setContactToArchived_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.setContactToArchived(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const setContactToNotArchived_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setContactToNotArchived", {setContactToNotArchived})); // eslint-disable-line camelcase
export const setContactToNotArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, setContactToNotArchived_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.setContactToNotArchived(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const setContactToViewed_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setContactToViewed", {setContactToViewed})); // eslint-disable-line camelcase
export const setContactToViewed = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, setContactToViewed_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.setContactToViewed(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const markContactWithDeletionState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markContactWithDeletionState", {markContactWithDeletionState})); // eslint-disable-line camelcase, max-len
export const markContactWithDeletionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, markContactWithDeletionState_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;
    const deletionState = (data.query.deletionState) ? data.query.deletionState : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(deletionState, "The Contact deletion state must not be blank.");

    const document = await Contacts.markContactWithDeletionState(callState, contactId, deletionState);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const markContactAsDeleted_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markContactAsDeleted", {markContactAsDeleted})); // eslint-disable-line camelcase
export const markContactAsDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, markContactAsDeleted_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.markContactAsDeleted(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

const markContactAsUnDeleted_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markContactAsUnDeleted", {markContactAsUnDeleted})); // eslint-disable-line camelcase
export const markContactAsUnDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, getModuleName, markContactAsUnDeleted_FunctionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.query.contactId) ? data.query.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.markContactAsUnDeleted(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});
