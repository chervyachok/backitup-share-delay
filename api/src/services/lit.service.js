const config = require('../config/config');
const { ethers } = require('ethers');
const { LIT_RPC, LIT_NETWORK  } = require("@lit-protocol/constants");
const { LitNodeClient } = require("@lit-protocol/lit-node-client");

let nodeClient 

const litSigner = new ethers.Wallet(
    config.DISPATCHER_PK,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
);

const litNodeClient = async () => {	
    if (!nodeClient) {
        nodeClient = new LitNodeClient({
            litNetwork: LIT_NETWORK.DatilTest,
            debug: true,
        });
        await nodeClient.connect();
    }
	return nodeClient
};




module.exports = {
	litNodeClient,
	litSigner, 
	
};
