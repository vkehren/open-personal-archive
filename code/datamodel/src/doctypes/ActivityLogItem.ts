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

type IActivityLogItemPartial = any;
/**
 * Checks whether the specified updates to the specified ActivityLogItem document are valid.
 * @param {IActivityLogItem} document The ActivityLogItem document being updated.
 * @param {IActivityLogItemPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IActivityLogItem, updateObject: IActivityLogItemPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: Currently, ActivityLogItems are not updateable
  return false;
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
   * @param {OPA.IDataStorageState} ds The state container for data storage.
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
  async create(ds: OPA.IDataStorageState, activityType: BT.ActivityType, requestor: string, resource: string, resourceCanonical: string | null, action: string | null, data: any, firebaseAuthUserId: string | null = null, userId: string | null = null, otherState: any | null = null): Promise<string> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const document = createInstance(documentId, activityType, requestor, resource, resourceCanonical, action, data, firebaseAuthUserId, userId, otherState);
    const proxiedDocument = this.documentProxyConstructor(document);

    // NOTE: An ActivityLogItem should NOT be updateable
    OPA.assertNonNullish(proxiedDocument);
    OPA.assertIsTrue(proxiedDocument.id == documentId);

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    batchUpdate.set(documentRef, proxiedDocument, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();}
    return documentId;
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IActivityLogItem, ActivityLogItemQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ActivityLogItemQuerySet(cd), null, [], createInstance);
