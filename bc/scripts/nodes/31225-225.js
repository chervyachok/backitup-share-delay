module.exports = {
	// npx hardhat node --port 31225 --config scripts/nodes/31225-225.js
	networks: {
		hardhat: {
			chainId: 225,
			gasPrice: 'auto',
			throwOnTransactionFailures: true,
			throwOnCallFailures: true,
			allowUnlimitedContractSize: true,
			loggingEnabled: true,
			accounts: {
				mnemonic: 'test test test test test test test test test test test junk',
				accountsBalance: '100000000000000000000000',
				count: 8,
			},
			mining: {
				auto: true,
				interval: 20000,
			},
			//forking: {
			//  url: 'https://ethereum-sepolia-rpc.publicnode.com',
			//},
		},
	},
};
