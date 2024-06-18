
import { type RootAgent, type TenantAgent } from '$lib/agent/agent.js';
import type {
    JwkDidCreateOptions,
    KeyDidCreateOptions
} from '@credo-ts/core';
import type {
    OpenId4VciCredentialSupportedWithId
} from '@credo-ts/openid4vc';

import {
    DidJwk,
    DidKey,
    JwaSignatureAlgorithm,
    SdJwtVcRecord,
    W3cCredentialRecord,
    getJwkFromKey
} from '@credo-ts/core';
import { OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc';

import {
    extractOpenId4VcCredentialMetadata,
    setOpenId4VcCredentialMetadata,
} from './openid4vc/metadata';

export const acceptCredentialOffer = async (agent: RootAgent | TenantAgent, credentialOfferUri: string) => {
    const resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(
        credentialOfferUri
    )
    console.log("resolvedCredentialOffer", resolvedCredentialOffer)
    const credentials =
        await agent.modules.openId4VcHolder.acceptCredentialOfferUsingPreAuthorizedCode(
            resolvedCredentialOffer,
            {
                credentialBindingResolver: async ({
                    supportedDidMethods,
                    keyType,
                    supportsAllDidMethods,
                    supportsJwk,
                    credentialFormat,
                }) => {
                    // First, we try to pick a did method
                    // Prefer did:jwk, otherwise use did:key, otherwise use undefined
                    let didMethod: 'key' | 'jwk' | undefined =
                        supportsAllDidMethods || supportedDidMethods?.includes('did:jwk')
                            ? 'jwk'
                            : supportedDidMethods?.includes('did:key')
                                ? 'key'
                                : undefined

                    // If supportedDidMethods is undefined, and supportsJwk is false, we will default to did:key
                    // this is important as part of MATTR launchpad support which MUST use did:key but doesn't
                    // define which did methods they support
                    if (!supportedDidMethods && !supportsJwk) {
                        didMethod = 'key'
                    }

                    if (didMethod) {
                        const didResult = await agent.dids.create<JwkDidCreateOptions | KeyDidCreateOptions>({
                            method: didMethod,
                            options: {
                                keyType,
                            },
                        })

                        if (didResult.didState.state !== 'finished') {
                            throw new Error('DID creation failed.')
                        }

                        let verificationMethodId: string
                        if (didMethod === 'jwk') {
                            const didJwk = DidJwk.fromDid(didResult.didState.did)
                            verificationMethodId = didJwk.verificationMethodId
                        } else {
                            const didKey = DidKey.fromDid(didResult.didState.did)
                            verificationMethodId = `${didKey.did}#${didKey.key.fingerprint}`
                        }

                        return {
                            didUrl: verificationMethodId,
                            method: 'did',
                        }
                    }

                    // Otherwise we also support plain jwk for sd-jwt only
                    if (supportsJwk && credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc) {
                        const key = await agent.wallet.createKey({
                            keyType,
                        })
                        return {
                            method: 'jwk',
                            jwk: getJwkFromKey(key),
                        }
                    }

                    throw new Error(
                        `No supported binding method could be found. Supported methods are did:key and did:jwk, or plain jwk for sd-jwt. Issuer supports ${supportsJwk ? 'jwk, ' : ''
                        }${supportedDidMethods?.join(', ') ?? 'Unknown'}`
                    )
                },

                verifyCredentialStatus: false,
                allowedProofOfPossessionSignatureAlgorithms: [
                    // NOTE: MATTR launchpad for JFF MUST use EdDSA. So it is important that the default (first allowed one)
                    // is EdDSA. The list is ordered by preference, so if no suites are defined by the issuer, the first one
                    // will be used
                    JwaSignatureAlgorithm.EdDSA,
                    JwaSignatureAlgorithm.ES256,
                ],
            }
        )
    const [firstCredential] = credentials
    if (!firstCredential) throw new Error('Error retrieving credential using pre authorized flow.')

    let record: SdJwtVcRecord | W3cCredentialRecord

    // TODO: add claimFormat to SdJwtVc

    if ('compact' in firstCredential) {
        record = new SdJwtVcRecord({
            compactSdJwtVc: firstCredential.compact,
        })
    } else {
        record = new W3cCredentialRecord({
            credential: firstCredential,
            // We don't support expanded types right now, but would become problem when we support JSON-LD
            tags: {},
        })
    }

    const openId4VcMetadata = extractOpenId4VcCredentialMetadata(
        resolvedCredentialOffer.offeredCredentials[0] as OpenId4VciCredentialSupportedWithId,
        resolvedCredentialOffer.metadata
    )

    setOpenId4VcCredentialMetadata(record, openId4VcMetadata)
    return record
}

