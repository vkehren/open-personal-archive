import * as admin from "firebase-admin";

// NOTE: To overcome known issue with storing Firebase Firestore Timestamps, for now, just use JavaScript Dates (see https://github.com/jloosli/node-firestore-import-export/issues/46)
export type DateShim = Date;
export const now = (): DateShim => admin.firestore.Timestamp.now().toDate();
// LATER: Submit bug to Firebase via GitHub specifically explaining that @google-cloud\firestore\build\src\serializer.js fails to recognize valid Timestamps at line 319

export type ApprovalState = "pending" | "approved" | "denied";
export const Pending: ApprovalState = "pending";
export const Approved: ApprovalState = "approved";
export const Denied: ApprovalState = "denied";
export const Default_ApprovalState: ApprovalState = Pending; // eslint-disable-line camelcase
