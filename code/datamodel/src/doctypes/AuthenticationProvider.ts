import * as OPA from "../../../base/src";
import * as CollectionData from "./AuthenticationProviders.json";

/* eslint-disable camelcase */

const SingularName = "AuthenticationProvider";
const PluralName = "AuthenticationProviders";
const IsSingleton = false;
export const AuthenticationProvider_GoogleId = "OPA_AuthenticationProvider_Google"; // eslint-disable-line camelcase
export const AuthenticationProvider_PasswordId = "OPA_AuthenticationProvider_Password"; // eslint-disable-line camelcase
export const AuthenticationProvider_RequiredIds = [AuthenticationProvider_GoogleId, AuthenticationProvider_PasswordId]; // eslint-disable-line camelcase
const RequiredDocuments: Array<IAuthenticationProvider> = OPA.promoteDocumentsToCreatable(CollectionData.requiredDocuments, null);
const DefaultDocument = (RequiredDocuments.find((v) => v.isDefault) as IAuthenticationProvider | undefined);
export const DefaultAuthenticationProviderId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : AuthenticationProvider_GoogleId; // eslint-disable-line camelcase

export interface IAuthenticationProvider extends OPA.IDocument_Creatable {
  readonly name: string;
  readonly externalId: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}
const IAuthenticationProvider_ReadOnlyPropertyNames = [ // eslint-disable-line camelcase
  OPA.getTypedPropertyKeyAsText<IAuthenticationProvider>("name"),
  OPA.getTypedPropertyKeyAsText<IAuthenticationProvider>("externalId"),
  OPA.getTypedPropertyKeyAsText<IAuthenticationProvider>("displayOrder"),
  OPA.getTypedPropertyKeyAsText<IAuthenticationProvider>("isDefault"),
];

type IAuthenticationProviderPartial = unknown;
/**
 * Checks whether the specified updates to the specified AuthenticationProvider document are valid.
 * @param {IAuthenticationProvider} document The AuthenticationProvider document being updated.
 * @param {IAuthenticationProviderPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IAuthenticationProvider, updateObject: IAuthenticationProviderPartial): boolean {
  OPA.assertDocumentIsValid(document);
  OPA.assertNonNullish(updateObject, "The processed Update Object must not be null.");

  const updateObject_AsUnknown = (updateObject as unknown);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject_AsUnknown as OPA.IDocument, IAuthenticationProvider_ReadOnlyPropertyNames)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForCreatable(document, updateObject_AsUnknown as OPA.ICreatable)) {
    return false;
  }

  // NOTE: Currently, AuthenticationProviders are not updateable
  return false;
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
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} externalId The ID for the Authentication Provider that is provided by the corresponding Provider.
   * @return {Promise<IAuthenticationProvider | null>} The Authentication Provider corresponding to the ID, or null if none exists.
   */
  async getByExternalAuthProviderId(ds: OPA.IDataStorageState, externalId: string): Promise<IAuthenticationProvider | null> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertIdentifierIsValid(externalId, "A valid external Authentication Provider ID must be provided.");

    const authProvidersCollectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const externalIdFieldName = OPA.getTypedPropertyKeyAsText<IAuthenticationProvider>("externalId");
    const getAuthProvidersForIdQuery = authProvidersCollectionRef.where(externalIdFieldName, "==", externalId);
    const matchingAuthProvidersSnap = await getAuthProvidersForIdQuery.get();

    if (matchingAuthProvidersSnap.docs.length > 1) {
      throw new Error("The external Authentication Provider ID corresponds to more than one OPA-recognized Authentication Provider.");
    }
    if (matchingAuthProvidersSnap.docs.length < 1) {
      return null;
    }

    const authProvider = matchingAuthProvidersSnap.docs[0].data();
    const proxiedAuthProvider = this.documentProxyConstructor(authProvider);
    return proxiedAuthProvider;
  }

  /**
   * Gets the Auth Provider by that its externally provided ID, since that ID is also a unique key, and asserts that the Auth Provider is valid (i.e. is non-null and has non-null "id" property).
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} externalId The ID for the Authentication Provider that is provided by the corresponding Provider.
   * @param {string} [assertionFailureMessage=default] The message to include in the Error if the assertion fails.
   * @return {Promise<IAuthenticationProvider>} The Authentication Provider corresponding to the ID.
   */
  async getByExternalAuthProviderIdWithAssert(ds: OPA.IDataStorageState, externalId: string, assertionFailureMessage = "The specified ID does not correspond to a valid authentication provider."): Promise<IAuthenticationProvider> { // eslint-disable-line max-len
    const authProvider = await this.getByExternalAuthProviderId(ds, externalId);
    OPA.assertDocumentIsValid(authProvider, assertionFailureMessage, assertionFailureMessage);
    const authProviderNonNull = OPA.convertNonNullish(authProvider);
    return authProviderNonNull;
  }
}

export const CollectionDescriptor = new OPA.CollectionDescriptor<IAuthenticationProvider, AuthenticationProviderQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new AuthenticationProviderQuerySet(cd), null, RequiredDocuments); // eslint-disable-line max-len
