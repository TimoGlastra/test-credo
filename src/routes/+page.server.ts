import { getRootAgent } from "$lib/agent/agent";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";


export const load = async ({ url }) => {
	console.log("Server running", url.toString())
	const rootAgent = await getRootAgent(ariesAskar.storeGenerateRawKey({}));
	await rootAgent.shutdown()
	console.log("Server shutdown")
};