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
