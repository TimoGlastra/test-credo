import { Agent, CacheModule, ConsoleLogger, InMemoryLruCache, KeyDerivationMethod, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

import { AskarModule, AskarMultiWalletDatabaseScheme } from '@credo-ts/askar'
import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'
import { TenantsModule } from '@credo-ts/tenants'
import { TenantAgent as CredoTenantAgent } from '@credo-ts/tenants/build/TenantAgent'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

import { NodeFileSystem } from "@credo-ts/node/build/NodeFileSystem"

class CustomFileSystem extends NodeFileSystem {
    public constructor() {
        super({
            baseDataPath: import.meta.env.DEV ? './.data' : '/data',
        })
    }
}

const modules = {
    askar: new AskarModule({
        ariesAskar: ariesAskar,
        multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    }),
    openId4VcHolder: new OpenId4VcHolderModule(),
    cache: new CacheModule({
        cache: new InMemoryLruCache({ limit: 500 }),
    }),
} as const

// this prevents the agent from being initalized multple times
let _agent: Promise<RootAgent> | undefined = undefined
export const getRootAgent = async (rootWalletKey: string): Promise<RootAgent> => {
    if (!_agent) {
        _agent = (async () => {
            const agent = new Agent({
                config: {
                    label: 'fagsystem-wallet-test',
                    walletConfig: {
                        id: 'test',
                        key: rootWalletKey,
                        keyDerivationMethod: KeyDerivationMethod.Raw,
                    },
                    // autoUpdateStorageOnStartup: true,
                    logger: new ConsoleLogger(LogLevel.debug),
                },
                dependencies: {
                    ...agentDependencies,
                    FileSystem: CustomFileSystem
                },
                modules: {
                    ...modules,
                    tenants: new TenantsModule<typeof modules>(),

                },
            })
            await agent.initialize()
            return agent
        })()
    }

    return _agent
}

export const getTenantAgent = async (tenantId: string, rootWalletKey: string) => {
    const agent = await getRootAgent(rootWalletKey)

    return agent.modules.tenants.getTenantAgent({ tenantId })
}

export type RootAgent = Agent<typeof modules & { tenants: TenantsModule<typeof modules> }>
export type TenantAgent = CredoTenantAgent<typeof modules>