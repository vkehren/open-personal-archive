import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import * as CSU from "../../../domainlogic/src/CallStateUtilities";
import {Contacts} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

// NOTE: Eventually, Contacts will provide the mechanism by which the Archive Owner and Administrators can invite unauthenticated users to create User accounts

const moduleName = OPA.getModuleNameFromSrc(module.filename);
type IContactDisplayModel = Contacts.IContactDisplayModel;

export const getListOfContacts = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("getListOfContacts", {getListOfContacts});
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IContactDisplayModel>>(request, moduleName, functionName, async (request, callState) => {
    const documents = await Contacts.getListOfContacts(callState);
    const displayModels = await Contacts.convertContactsToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IContactDisplayModel>>);
  return result;
});

export const createContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("createContact", {createContact});
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  let authenticationState = ((null as unknown) as OpaDm.IAuthenticationState | null);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, functionName, state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp, moduleName, functionName);
    authenticationState = await UTL.getAuthenticationStateForContextAndApp(request, adminApp);

    await UTL.setExternalLogState(dataStorageState, request);
    await UTL.logFunctionCall(dataStorageState, authenticationState, shimmedRequest, OPA.ExecutionStates.ready);

    const data = request.data;
    const organizationName = (data.organizationName) ? data.organizationName : null;
    const firstName = (data.firstName) ? data.firstName : null;
    const lastName = (data.lastName) ? data.lastName : null;
    const email = (data.email) ? data.email : null;
    const phoneNumber = (data.phoneNumber) ? data.phoneNumber : null;
    const address = (data.address) ? data.address : null;
    const message = (data.message) ? data.message : null;
    const otherInfo = (data.otherInfo) ? OPA.parseJsonIfNeeded(data.otherInfo) : null;

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

export const updateContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("updateContact", {updateContact});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const updateObject = (data.updateObject) ? OPA.parseJsonIfNeeded(data.updateObject) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.updateContact(callState, contactId, updateObject);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const setCorrespondingUsersForContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setCorrespondingUsersForContact", {setCorrespondingUsersForContact});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const userIds = (data.userIds) ? OPA.parseJsonIfNeeded(data.userIds) : undefined;
    const contentType = (data.contentType) ? data.contentType : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullish(userIds, "The corresponding User IDs must not be blank.");

    const document = await Contacts.setCorrespondingUsersForContact(callState, contactId, contactId, contentType);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const addCorrespondingUsersToContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("addCorrespondingUsersToContact", {addCorrespondingUsersToContact});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const userIds = (data.userIds) ? OPA.parseJsonIfNeeded(data.userIds) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullish(userIds, "The corresponding User IDs must not be blank.");

    const document = await Contacts.addCorrespondingUsersToContact(callState, contactId, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const removeCorrespondingUsersFromContact = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("removeCorrespondingUsersFromContact", {removeCorrespondingUsersFromContact});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const userIds = (data.userIds) ? OPA.parseJsonIfNeeded(data.userIds) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullish(userIds, "The corresponding User IDs must not be blank.");

    const document = await Contacts.removeCorrespondingUsersFromContact(callState, contactId, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const setContactTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setContactTags", {setContactTags});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const tags = (data.tags) ? OPA.parseJsonIfNeeded(data.tags) : undefined;
    const contentType = (data.contentType) ? data.contentType : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Contact tags must not be blank.");

    const document = await Contacts.setContactTags(callState, contactId, tags, contentType);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const addContactTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("addContactTags", {addContactTags});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const tags = (data.tags) ? OPA.parseJsonIfNeeded(data.tags) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Contact tags must not be blank.");

    const document = await Contacts.addContactTags(callState, contactId, tags);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const removeContactTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("removeContactTags", {removeContactTags});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const tags = (data.tags) ? OPA.parseJsonIfNeeded(data.tags) : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Contact tags must not be blank.");

    const document = await Contacts.removeContactTags(callState, contactId, tags);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const setContactToArchivalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setContactToArchivalState", {setContactToArchivalState});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const archivalState = (data.archivalState) ? data.archivalState : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(archivalState, "The Contact archival state must not be blank.");

    const document = await Contacts.setContactToArchivalState(callState, contactId, archivalState);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const setContactToArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setContactToArchived", {setContactToArchived});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.setContactToArchived(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const setContactToNotArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setContactToNotArchived", {setContactToNotArchived});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.setContactToNotArchived(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const setContactToViewed = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setContactToViewed", {setContactToViewed});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.setContactToViewed(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const markContactWithDeletionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markContactWithDeletionState", {markContactWithDeletionState});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;
    const deletionState = (data.deletionState) ? data.deletionState : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(deletionState, "The Contact deletion state must not be blank.");

    const document = await Contacts.markContactWithDeletionState(callState, contactId, deletionState);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const markContactAsDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markContactAsDeleted", {markContactAsDeleted});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.markContactAsDeleted(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});

export const markContactAsUnDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markContactAsUnDeleted", {markContactAsUnDeleted});
  const result = (await UTL.performAuthenticatedActionWithResult<IContactDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const contactId = (data.contactId) ? data.contactId : undefined;

    OPA.assertIdentifierIsValid(contactId, "The Contact ID must not be blank.");

    const document = await Contacts.markContactAsUnDeleted(callState, contactId);
    const displayModel = await Contacts.convertContactToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IContactDisplayModel>);
  return result;
});
