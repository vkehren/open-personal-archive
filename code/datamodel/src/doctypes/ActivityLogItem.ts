import * as firestore from "@google-cloud/firestore";
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

/** Class providing queries for ActivityLogItem collection. */
export class ActivityLogItemQuerySet extends OPA.QuerySet<IActivityLogItem> {
  /**
   * Creates a ActivityLogItemQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IActivityLogItem>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IActivityLogItem>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IActivityLogItem, ActivityLogItemQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IActivityLogItem, ActivityLogItemQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IActivityLogItem, ActivityLogItemQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Creates an instance of the IActivityLogItem document type.
   * @param {Firestore} db The Firestore Database.
   * @param {BT.ActivityType} activityType The type of the ActivityLogItem.
   * @param {string} requestor The URI of the requestor.
   * @param {string} resource The URI of the resource being requested.
   * @param {string | null} resourceCanonical The canonical URI of the resource being requested.
   * @param {string | null} action The action being requested, if any.
   * @param {any} data The data for the request.
   * @param {string | null} firebaseAuthUserId The ID for the User within the Firebase Authentication system, if the User is authenticated.
   * @param {string | null} userId The ID for the User within the OPA system, if the User is authenticated.
   * @param {any | null} otherState Any other state for the request.
   * @return {Promise<string>} The new document ID.
   */
  async createActivityLogItem(db: firestore.Firestore, activityType: BT.ActivityType, requestor: string, resource: string, resourceCanonical: string | null, action: string | null, data: any, firebaseAuthUserId: string | null = null, userId: string | null = null, otherState: any | null = null): Promise<string> { // eslint-disable-line max-len
    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, activityType, requestor, resource, resourceCanonical, action, data, firebaseAuthUserId, userId, otherState);

    // NOTE: An ActivityLogItem should NOT be updateable
    OPA.assertNonNullish(document);
    OPA.assertIsTrue(document.id == documentId);

    await documentRef.set(document, {merge: true});
    return documentId;
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IActivityLogItem, ActivityLogItemQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ActivityLogItemQuerySet(cd), null, [], createInstance);
