import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "./Application";

/**
 * Records an ActivityLogItem for an activity that occurred in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {BT.ActivityType} activityType The type of the ActivityLogItem.
 * @param {string} requestor The URI of the requestor.
 * @param {string} resource The URI of the resource being requested.
 * @param {string | null} action The action being requested, if any.
 * @param {any} data The data for the request.
 * @param {string | null} firebaseAuthUserId The ID for the User within the Firebase Authentication system, if the User is authenticated.
 * @param {string | null} userId The ID for the User within the OPA system, if the User is authenticated.
 * @param {any | null} otherState Any other state for the request.
 * @return {Promise<OpaDm.IActivityLogItem>}
 */
export async function recordLogItem(dataStorageState: OpaDm.IDataStorageState, activityType: OpaDm.ActivityType, requestor: string, resource: string, action: string | null, data: any, firebaseAuthUserId: string | null = null, userId: string | null = null, otherState: any | null = null): Promise<OpaDm.IActivityLogItem> { // eslint-disable-line max-len
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  const db = dataStorageState.db;
  OPA.assertFirestoreIsNotNullish(db);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  // NOTE: DO NOT assert that system has been installed

  if (isSystemInstalled && OPA.isNullishOrWhitespace(userId) && !OPA.isNullishOrWhitespace(firebaseAuthUserId)) {
    const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(db, OPA.convertNonNullish(firebaseAuthUserId));

    // NOTE: Only implicitly set the "userId" when it was not specied, but the "firebaseAuthUserId" was specified
    if (!OPA.isNullish(user)) {
      userId = OPA.convertNonNullish(user).id;
    }
  }

  let resourceCanonical = resource;
  if (OpaDm.ActivityTypes.web_page_types.includes(activityType)) {
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
    } else if (resourceCanonical.endsWith(".com") || resourceCanonical.endsWith(".org") || resourceCanonical.endsWith(".net") || resourceCanonical.endsWith(".edu") || resourceCanonical.endsWith(".app") || resourceCanonical.endsWith(".web")) {
      resourceCanonical += "/index.html";
    }
  }

  const activityLogItemCollectionRef = OpaDb.ActivityLogItems.getTypedCollection(db);
  const activityLogItemDocumentRef = activityLogItemCollectionRef.doc();
  const activityLogItemId = activityLogItemDocumentRef.id;
  const activityLogItem = OpaDb.ActivityLogItems.createInstance(activityLogItemId, activityType, requestor, resource, resourceCanonical, action, data, firebaseAuthUserId, userId, otherState);
  await activityLogItemDocumentRef.set(activityLogItem, {merge: true});

  const activityLogItemReRead = await OpaDb.ActivityLogItems.queries.getById(db, activityLogItemId);
  OPA.assertDocumentIsValid(activityLogItemReRead, "The requested ActivityLogItem does not exist.");
  const activityLogItemReReadNonNull = OPA.convertNonNullish(activityLogItemReRead);

  return activityLogItemReReadNonNull;
}
