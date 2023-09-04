import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../base/src";
import * as UTL from "./Utilities";
import {ILocale} from "./Locale";
import {IUser} from "./User";

const SingularName = "AccessRequest";
const PluralName = "AccessRequests";
const IsSingleton = false;

export interface IAccessRequestPartial {
  message?: OPA.ILocalizable<string>;
  userIdForLatestUpdate?: string;
  dateOfLatestUpdate?: UTL.DateShim;
  hasBeenViewed?: boolean;
  approvalState?: UTL.ApprovalState;
  userIdOfApprover?: string | null;
  dateOfApproval?: UTL.DateShim | null;
}

export interface IAccessRequest extends OPA.IDocument, IAccessRequestPartial {
  readonly id: string;
  readonly archiveId: string;
  readonly userIdOfRequestor: string;
  message: OPA.ILocalizable<string>;
  readonly isSpecificToCitation: boolean;
  readonly citationId: string | null;
  readonly userIdForCreation: string;
  readonly dateOfCreation: UTL.DateShim;
  userIdForLatestUpdate: string;
  dateOfLatestUpdate: UTL.DateShim;
  hasBeenViewed: boolean;
  approvalState: UTL.ApprovalState;
  userIdOfApprover: string | null;
  dateOfApproval: UTL.DateShim | null;
}

/**
  * Creates an instance of the IAccessRequest document type.
  * @param {IUser} currentUser The current User of the OPA system.
  * @param {ILocale} currentLocale The Locale for the current User of the OPA system.
  * @param {string} id The ID for the Access Request within the OPA system.
  * @param {string} archiveId The ID for the Archive.
  * @param {string} userIdOfRequestor The ID for the User who is requesting access.
  * @param {string} message A message containing information about the Access Request.
  * @param {string | null} [citationId=null] The ID of the Citation that the Access Request pertains to, if one exists.
  * @return {IAccessRequest} The new document instance.
  */
function createInstance(currentUser: IUser, currentLocale: ILocale, id: string, archiveId: string, userIdOfRequestor: string, message: string, citationId: string | null = null): IAccessRequest { // eslint-disable-line max-len
  const now = UTL.now();
  const messages: OPA.ILocalizable<string> = {en: message};
  messages[currentLocale.optionName] = message;
  const isSpecificToCitation = (!OPA.isNullishOrWhitespace(citationId));

  const document: IAccessRequest = {
    id: id,
    archiveId: archiveId,
    userIdOfRequestor: userIdOfRequestor,
    message: messages,
    isSpecificToCitation: isSpecificToCitation,
    citationId: citationId,
    userIdForCreation: currentUser.id,
    dateOfCreation: now,
    userIdForLatestUpdate: currentUser.id,
    dateOfLatestUpdate: now,
    hasBeenViewed: false,
    approvalState: UTL.ApprovalStates.pending,
    userIdOfApprover: null,
    dateOfApproval: null,
  };
  return document;
}

/** Class providing queries for AccessRequest collection. */
export class AccessRequestQuerySet extends OPA.QuerySet<IAccessRequest> {
  /**
    * Creates a AccessRequestQuerySet.
    * @param {OPA.ITypedCollectionDescriptor<IAccessRequest>} collectionDescriptor The collection descriptor to use for queries.
    */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IAccessRequest>) {
    super(collectionDescriptor);
  }

  /**
    * The typed collection descriptor to use for queries.
    * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>}
    */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
    * Gets all of the AccessRequests for the relevant User's OPA User ID.
    * @param {Firestore} db The Firestore Database to read from.
    * @param {string} userId The ID for the relevant User within the OPA system.
    * @return {Promise<Array<IAccessRequest>>} The list of Access Requests that correspond to the relevant User.
    */
  async getAllForUserId(db: firestore.Firestore, userId: string): Promise<Array<IAccessRequest>> {
    OPA.assertFirestoreIsNotNullish(db);
    OPA.assertIdentifierIsValid(userId, "A valid OPA User ID must be provided.");

    const accessRequestsCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const getAccessRequestsForUserIdQuery = accessRequestsCollectionRef.where("userIdOfRequestor", "==", userId);
    const matchingAccessRequestsSnap = await getAccessRequestsForUserIdQuery.get();

    const matchingAccessRequests = matchingAccessRequestsSnap.docs.map((doc) => doc.data());
    return matchingAccessRequests;
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createInstance>) => ReturnType<typeof createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IAccessRequest, AccessRequestQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new AccessRequestQuerySet(cd));
