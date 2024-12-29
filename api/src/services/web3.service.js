const config = require('../config/config');
const { ethers } = require('ethers');

const rpcs = {}

const rpc = function (chainId) {
	
	if (!rpcs[chainId]) rpcs[chainId] = new ethers.providers.JsonRpcProvider({ url: config.bcConfig[chainId].chain.rpcUrl, timeout: 10000 }, 'any')
	return rpcs[chainId]
};

const dispatcher = function (chainId) {	
	return new ethers.Wallet(config.DISPATCHER_PK).connect(rpc(chainId))
};

const contract = function (name, chainId, address) {
	if (config.bcConfig[chainId][name]) {
		if (!address) address = config.bcConfig[chainId][name].address
		return {
			instance: new ethers.Contract(address, config.bcConfig[chainId][name].abi, rpc(chainId)),
			...config.bcConfig[chainId][name]
		};
	}
	return null;
};

const timestamp = async function(chainId) {
	const blockNum = await rpc(chainId).getBlockNumber();
	const block = await rpc(chainId).getBlock(blockNum);
	return block.timestamp;
}

const explorer = (chainId) => {
	const list = {
		225: 'https://localtrace.io',
		11155111: 'https://sepolia.etherscan.io'
	}
	return list[chainId]
}

const txHashShort = (txHash) => {
	if (txHash) return txHash.replace(txHash.substring(8, 60), '.....');
	return '.....';
}

const addressShort = (tokenAddress) => {
	if (tokenAddress) return tokenAddress.replace(tokenAddress.substring(6, 38), '...');
	return '...';
}

const secondsToDuration = (value) => {
	if (!value) return '...';

	let seconds = Number(value);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor((seconds % (3600 * 24)) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	var s = Math.floor(seconds % 60);

	var dDisplay = d > 0 ? d + ` day${ d > 1 ? 's':'' } ` : '';
	var hDisplay = h > 0 ? h + ` hour${ h > 1 ? 's':'' } ` : '';
	var mDisplay = m > 0 ? m + ` minute${ m > 1 ? 's':'' } ` : '';
	let sDisplay = ''
	if (d == 0 && h == 0 && m == 0 && s) {
		sDisplay = s > 0 ? s + ` second${ s > 1 ? 's':'' } ` : '';		
	}
	
	return (dDisplay + hDisplay + mDisplay + sDisplay).trim(); // + sDisplay;
}

module.exports = {
	contract,
	rpc, 
	timestamp,
	dispatcher,
	explorer,
	txHashShort,
	addressShort,
	secondsToDuration
};
