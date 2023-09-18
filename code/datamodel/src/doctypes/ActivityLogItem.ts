import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";

const SingularName = "ActivityLogItem";
const PluralName = "ActivityLogItems";
const IsSingleton = false;
const DefaultActionName = "(default)";

export interface IActivityLogItem extends OPA.IDocument_Creatable {
  readonly rootLogItemId: string;
  readonly externalLogItemId: string | null;
  readonly activityType: BT.ActivityType;
  readonly requestor: string;
  readonly resource: string;
  readonly resourceCanonical: string;
  readonly action: string;
  readonly data: Record<string, unknown>;
  readonly firebaseAuthUserId: string | null;
  readonly userId: string | null;
  readonly otherState: Record<string, unknown> | null;
}

type IActivityLogItemPartial = unknown;
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
 * @param {string | null} rootLogItemId The ID of the root ActivityLogItem for the current call.
 * @param {string | null} externalLogItemId The ID of the external ActivityLogItem of the requestor of the current call.
 * @param {BT.ActivityType} activityType The type of the ActivityLogItem.
 * @param {string} requestor The URI of the requestor.
 * @param {string} resource The URI of the resource being requested.
 * @param {string | null} resourceCanonical The canonical URI of the resource being requested.
 * @param {string | null} action The action being requested, if any.
 * @param {Record<string, unknown>} data The data for the request.
 * @param {string | null} firebaseAuthUserId The ID for the User within the Firebase Authentication system, if the User is authenticated.
 * @param {string | null} userId The ID for the User within the OPA system, if the User is authenticated.
 * @param {Record<string, unknown> | null} otherState Any other state for the request.
 * @return {IActivityLogItem} The new document instance.
 */
function createInstance(id: string, rootLogItemId: string | null, externalLogItemId: string | null, activityType: BT.ActivityType, requestor: string, resource: string, resourceCanonical: string | null, action: string | null, data: Record<string, unknown>, firebaseAuthUserId: string | null = null, userId: string | null = null, otherState: Record<string, unknown> | null = null): IActivityLogItem { // eslint-disable-line max-len
  if ((activityType == "browser_page_action") && OPA.isNullishOrWhitespace(action)) {
    throw new Error("The action name must be specified when logging web page actions.");
  }

  const now = OPA.nowToUse();
  const document: IActivityLogItem = {
    id: id,
    rootLogItemId: (!OPA.isNullishOrWhitespace(rootLogItemId)) ? OPA.convertNonNullish(rootLogItemId) : id,
    externalLogItemId: externalLogItemId,
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
   * @param {Record<string, unknown>} data The data for the request.
   * @param {string | null} firebaseAuthUserId The ID for the User within the Firebase Authentication system, if the User is authenticated.
   * @param {string | null} userId The ID for the User within the OPA system, if the User is authenticated.
   * @param {Record<string, unknown> | null} otherState Any other state for the request.
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, activityType: BT.ActivityType, requestor: string, resource: string, resourceCanonical: string | null, action: string | null, data: Record<string, unknown>, firebaseAuthUserId: string | null = null, userId: string | null = null, otherState: Record<string, unknown> | null = null): Promise<string> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc();
    const documentId = documentRef.id;
    const logState = ds.logWriteState;
    const document = createInstance(documentId, logState.rootLogItemId, logState.externalLogItemId, activityType, requestor, resource, resourceCanonical, action, data, firebaseAuthUserId, userId, otherState); // eslint-disable-line max-len
    const proxiedDocument = this.documentProxyConstructor(document);

    // NOTE: An ActivityLogItem should NOT be updateable
    OPA.assertNonNullish(proxiedDocument);
    OPA.assertIsTrue(proxiedDocument.id == documentId);

    // NOTE: Logging should always occur on its own write batch that is immediately committed
    const batchUpdate = ds.constructorProvider.writeBatch();
    batchUpdate.set(documentRef, proxiedDocument, {merge: true});
    await batchUpdate.commit();
    return documentId;
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IActivityLogItem, ActivityLogItemQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ActivityLogItemQuerySet(cd), null, [], createInstance); // eslint-disable-line max-len
