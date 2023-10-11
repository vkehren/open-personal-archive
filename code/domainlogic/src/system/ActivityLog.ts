import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as CSU from "../CallStateUtilities";
import * as Application from "./Application";

export interface ILogItemListOptions {
  numberOfLatestItems?: number,
  groupItemsByRootId: boolean,
  groupItemsByExternalId: boolean,
  // LATER: Add Date-Time constraints
}

export interface IGroupableActivityLogItem extends OpaDm.IActivityLogItem {
  subItems: Array<IGroupableActivityLogItem>,
}

/**
 * Gets the list of ActivityLogItems in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @param {ILogItemListOptions} options The options for the result.
 * @return {Promise<Array<IGroupableActivityLogItem>>}
 */
export async function getListOfLogItems(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState, options: ILogItemListOptions): Promise<Array<IGroupableActivityLogItem>> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertAuthenticationStateIsNotNullish(authenticationState);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);

  if (isSystemInstalled) {
    const callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);

    const authorizationState = OPA.convertNonNullish(callState.authorizationState);
    const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes._authorizers);
    const authorizerIds = [...authorizersById.keys()];

    authorizationState.assertUserApproved();
    authorizationState.assertRoleAllowed(authorizerIds);
  }

  const colRef = OpaDb.ActivityLogItems.getTypedCollection(dataStorageState);
  let queryRef = colRef.orderBy(OPA.getTypedPropertyKeyAsText<OpaDm.IActivityLogItem>("dateOfCreation"));
  if (!OPA.isNullish(options.numberOfLatestItems)) {
    queryRef = queryRef.limit(OPA.convertNonNullish(options.numberOfLatestItems));
  }
  const querySnap = await queryRef.get();
  const docSnaps = querySnap.docs;
  const logItems = docSnaps.map((docSnap) => docSnap.data());
  const groupableLogItems = logItems.map((logItem) => (logItem as IGroupableActivityLogItem));
  groupableLogItems.forEach((logItem) => logItem.subItems = []);

  if (!options.groupItemsByExternalId && !options.groupItemsByRootId) {
    return groupableLogItems;
  }

  const logItemsMap = OPA.createMapFromArray(groupableLogItems, (logItem) => logItem.id);
  const ungroupedLogItems = ([] as Array<IGroupableActivityLogItem>);

  groupableLogItems.forEach((logItem) => {
    let hasBeenGrouped = false;

    if (!OPA.isNullishOrWhitespace(logItem.rootLogItemId) && options.groupItemsByRootId) {
      const parentLogItem = logItemsMap.get(OPA.convertNonNullish(logItem.rootLogItemId));

      if ((logItem.rootLogItemId != logItem.id) && !OPA.isNullish(parentLogItem)) {
        const parentLogItemNonNull = OPA.convertNonNullish(parentLogItem);
        parentLogItemNonNull.subItems.push(logItem);
        hasBeenGrouped = true;
      }
    }

    if (!hasBeenGrouped && !OPA.isNullishOrWhitespace(logItem.externalLogItemId) && options.groupItemsByExternalId) {
      const parentLogItem = logItemsMap.get(OPA.convertNonNullish(logItem.externalLogItemId));

      if ((logItem.externalLogItemId != logItem.id) && !OPA.isNullish(parentLogItem)) {
        const parentLogItemNonNull = OPA.convertNonNullish(parentLogItem);
        parentLogItemNonNull.subItems.push(logItem);
        hasBeenGrouped = true;
      }
    }

    if (!hasBeenGrouped) {
      ungroupedLogItems.push(logItem);
    }
  });

  return ungroupedLogItems;
}

/**
 * Records an ActivityLogItem for an activity that occurred in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState | null} authenticationState The Firebase Authentication state for the User.
 * @param {BT.ActivityType} activityType The type of the ActivityLogItem.
 * @param {OPA.ExecutionState} executionState The execution state of the call for the ActivityLogItem.
 * @param {string} requestor The URI of the requestor.
 * @param {string} resource The URI of the resource being requested.
 * @param {string | null} action The action being requested, if any.
 * @param {Record<string, unknown>} data The data for the request.
 * @param {Record<string, unknown> | null} otherState Any other state for the request.
 * @return {Promise<OpaDm.IActivityLogItem>}
 */
export async function recordLogItem(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState | null, activityType: OpaDm.ActivityType, executionState: OPA.ExecutionState, requestor: string, resource: string, action: string | null, data: Record<string, unknown>, otherState: Record<string, unknown> | null = null): Promise<OpaDm.IActivityLogItem> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  // NOTE: DO NOT assert that system has been installed, as we need the Log to work in any case

  let firebaseAuthUserId: string | null = null;
  let userId: string | null = null;
  if (!OPA.isNullish(authenticationState)) {
    const authenticationStateNonNull = OPA.convertNonNullish(authenticationState);
    const firebaseAuthUserIdNonNull = authenticationStateNonNull.firebaseAuthUserId;
    firebaseAuthUserId = firebaseAuthUserIdNonNull;

    // NOTE: Only check for OPA User if the System is actually installed
    if (isSystemInstalled) {
      // NOTE: The OPA User could still be null because an account may not have been created for the Firebase User yet
      const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState, firebaseAuthUserIdNonNull);
      if (!OPA.isNullish(user)) {
        const userNonNull = OPA.convertNonNullish(user);
        userId = userNonNull.id;
      }
    }
  }

  let resourceCanonical = resource;
  if (OpaDm.ActivityTypes._web_page_types.includes(activityType)) {
    if (resourceCanonical.includes("?")) {
      const parts = resourceCanonical.split("?");
      const part0Length = parts[0].length;
      const part0EndChar = (part0Length > 0) ? parts[0][part0Length - 1] : null;
      if (part0EndChar == "/") {
        const subStr0 = resourceCanonical.substring(0, part0Length - 1);
        const subStr1 = "/index.html?";
        const subStr2 = resourceCanonical.substring(part0Length + 1, resourceCanonical.length);
        resourceCanonical = (subStr0 + subStr1 + subStr2);
      }
    } else if (resourceCanonical.endsWith("/")) {
      resourceCanonical += "index.html";
    } else if (resourceCanonical.endsWith(".com") || resourceCanonical.endsWith(".org") || resourceCanonical.endsWith(".net") || resourceCanonical.endsWith(".edu") || resourceCanonical.endsWith(".app") || resourceCanonical.endsWith(".web")) { // eslint-disable-line max-len
      resourceCanonical += "/index.html";
    }
  }

  const activityLogItemId = await OpaDb.ActivityLogItems.queries.create(dataStorageState, activityType, executionState, requestor, resource, resourceCanonical, action, data, firebaseAuthUserId, userId, otherState); // eslint-disable-line max-len
  await dataStorageState.currentWriteBatch.commit();
  dataStorageState.currentWriteBatch = null;

  const activityLogItemReRead = await OpaDb.ActivityLogItems.queries.getByIdWithAssert(dataStorageState, activityLogItemId, "The requested ActivityLogItem does not exist.");
  return activityLogItemReRead;
}
