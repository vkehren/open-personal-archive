import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";

const SingularName = "ActivityLogItem";
const PluralName = "ActivityLogItems";
const IsSingleton = false;
const DefaultActionName = "(default)";

export interface IActivityLogItem extends OPA.IDocument_Creatable {
  readonly activityType: BT.ActivityType;
  readonly requestor: string;
  readonly resource: string;
  readonly resourceCanonical: string;
  readonly action: string;
  readonly data: any;
  readonly firebaseAuthUserId: string | null;
  readonly userId: string | null;
  readonly otherState: any | null;
}

/**
  * Creates an instance of the IActivityLogItem document type.
  * @param {string} id The ID for the ActivityLogItem within the OPA system.
  * @param {BT.ActivityType} activityType The type of the ActivityLogItem.
  * @param {string} requestor The URI of the requestor.
  * @param {string} resource The URI of the resource being requested.
  * @param {string | null} resourceCanonical The canonical URI of the resource being requested.
  * @param {string | null} action The action being requested, if any.
  * @param {any} data The data for the request.
  * @param {string | null} firebaseAuthUserId The ID for the User within the Firebase Authentication system, if the User is authenticated.
  * @param {string | null} userId The ID for the User within the OPA system, if the User is authenticated.
  * @param {any | null} otherState Any other state for the request.
  * @return {IActivityLogItem} The new document instance.
  */
function createInstance(id: string, activityType: BT.ActivityType, requestor: string, resource: string, resourceCanonical: string | null, action: string | null, data: any, firebaseAuthUserId: string | null = null, userId: string | null = null, otherState: any | null = null): IActivityLogItem { // eslint-disable-line max-len
  if ((activityType == "browser_page_action") && OPA.isNullishOrWhitespace(action)) {
    throw new Error("The action name must be specified when logging web page actions.")
  }

  const now = OPA.nowToUse();
  const document: IActivityLogItem = {
    id: id,
    activityType: activityType,
    requestor: requestor,
    resource: resource,
    resourceCanonical: (!OPA.isNullishOrWhitespace(resourceCanonical)) ? OPA.convertNonNullish(resourceCanonical) : resource,
    action: (!OPA.isNullishOrWhitespace(action)) ? OPA.convertNonNullish(action) : DefaultActionName,
    data: data,
    firebaseAuthUserId: firebaseAuthUserId,
    userId: userId,
    otherState: otherState,
    dateOfCreation: now,
  };
  return document;
}

export type QuerySet = OPA.QuerySet<IActivityLogItem>;
export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IActivityLogItem, QuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, [], createInstance);
