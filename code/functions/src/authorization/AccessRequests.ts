import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import {AccessRequests} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

export const requestUserAccess = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    const firebaseAdminApp = admin.app();
    const data = request.data;
    const callState = await UTL.getCallStateForFirebaseContextAndApp(request, firebaseAdminApp);

    const message = (data.query.message) ? data.query.message : undefined;
    OPA.assertNonNullishOrWhitespace(message, "The Access Request message must not be blank.");
    const citationId = (data.query.citationId) ? data.query.citationId : null;
    const displayModel = await AccessRequests.requestUserAccess(callState, message, citationId);

    return OPA.getSuccessResult("", displayModel);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

// LATER: export const updateUserSettings = ...

// LATER: export const updateUserApprovalState = ...

// LATER: export const assignUserToRole = ...

// LATER: export const disableUser = ...
