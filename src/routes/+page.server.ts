import { getRootAgent } from "$lib/agent/agent";

export const load = async ({ url }) => {
	const {ariesAskar} = await import("@hyperledger/aries-askar-nodejs");
	console.log("Server running", url.toString())
	const rootAgent = await getRootAgent(ariesAskar.storeGenerateRawKey({}));
	await rootAgent.shutdown()
	console.log("Server shutdown")
	return {
		key: ariesAskar.storeGenerateRawKey({}),
	}
};