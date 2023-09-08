import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import * as CollectionData from "./AuthenticationProviders.json";

const SingularName = "AuthenticationProvider";
const PluralName = "AuthenticationProviders";
const IsSingleton = false;
export const AuthenticationProvider_GoogleId = "OPA_AuthenticationProvider_Google"; // eslint-disable-line camelcase
export const AuthenticationProvider_RequiredIds = [AuthenticationProvider_GoogleId]; // eslint-disable-line camelcase
const RequiredDocuments: Array<IAuthenticationProvider> = OPA.promoteDocumentsToCreatable(CollectionData.requiredDocuments, null);
const DefaultDocument = (RequiredDocuments.find((v) => v.isDefault) as IAuthenticationProvider | undefined);
export const DefaultAuthenticationProviderId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : AuthenticationProvider_GoogleId;

export interface IAuthenticationProvider extends OPA.IDocument_Creatable {
  readonly id: string;
  readonly name: string;
  readonly externalId: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

/** Class providing queries for AuthenticationProvider collection. */
export class AuthenticationProviderQuerySet extends OPA.QuerySet<IAuthenticationProvider> {
  /**
   * Creates a AuthenticationProviderQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IAuthenticationProvider>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IAuthenticationProvider>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableCollectionDescriptor<IAuthenticationProvider, AuthenticationProviderQuerySet>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableCollectionDescriptor<IAuthenticationProvider, AuthenticationProviderQuerySet> {
    return OPA.convertTo<OPA.ITypedQueryableCollectionDescriptor<IAuthenticationProvider, AuthenticationProviderQuerySet>>(this.collectionDescriptor);
  }

  /**
   * Gets the Authentication Provider by that Provider's externally provided ID, since that ID is also a unique key.
   * @param {Firestore} db The Firestore Database to read from.
   * @param {string} externalId The ID for the Authentication Provider that is provided by the corresponding Provider.
   * @return {Promise<IAuthenticationProvider | null>} The User corresponding to the UUID, or null if none exists.
   */
  async getByExternalAuthProviderId(db: firestore.Firestore, externalId: string): Promise<IAuthenticationProvider | null> {
    OPA.assertFirestoreIsNotNullish(db);
    OPA.assertIdentifierIsValid(externalId, "A valid external Authentication Provider ID must be provided.");

    const authProvidersCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const getAuthProvidersForIdQuery = authProvidersCollectionRef.where("externalId", "==", externalId);
    const matchingAuthProvidersSnap = await getAuthProvidersForIdQuery.get();

    if (matchingAuthProvidersSnap.docs.length > 1) {
      throw new Error("The external Authentication Provider ID corresponds to more than one OPA-recognized Authentication Provider.");
    }
    if (matchingAuthProvidersSnap.docs.length < 1) {
      return null;
    }
    return matchingAuthProvidersSnap.docs[0].data();
  }
}

export const CollectionDescriptor = new OPA.CollectionDescriptor<IAuthenticationProvider, AuthenticationProviderQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new AuthenticationProviderQuerySet(cd), null, RequiredDocuments); // eslint-disable-line max-len
