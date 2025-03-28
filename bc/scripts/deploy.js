const { utils, Wallet } = require('ethers');
const { ethers } = require('hardhat');
const {
	promises: { readFile, writeFile },
} = require('fs');
const path = require('path');
const { time, setBalance } = require('@nomicfoundation/hardhat-network-helpers');
// mainnet simulation
// npx hardhat run --network hardhat scripts/deploy.js
// npx hardhat run --network local scripts/deploy.js
// npx hardhat run --network vps scripts/deploy.js
// npx hardhat run --network sepolia scripts/deploy.js

const fileName = 'bcConfig.json';
const filePath = path.join(__dirname, '../../', fileName);
let bcConfig = {};

async function main() {
	const [deployer, user1, user2, user3, user4, user5] = await ethers.getSigners();

	try {
		bcConfig = JSON.parse(await readFile(filePath, 'utf-8'));
	} catch (error) {
		console.log('bcConfig', error);
	}

	const chainId = Number(await network.provider.send('eth_chainId'));
	const startBlock = await ethers.provider.getBlockNumber();

	if (!bcConfig[chainId]) bcConfig[chainId] = {};

	console.log('--------------------------------DEPLOY----------------------------------', 'CHAIN ID', chainId);

	bcConfig[chainId].chain = {
		rpcUrl: network.config.url || network.config.forking?.url,
	};

	const BuckitUpEventEmitter = await ethers.getContractFactory('EventEmitter');
	const eventEmitter = await BuckitUpEventEmitter.deploy();
	await eventEmitter.deployed();
	console.log('BuckitUpEventEmitter', eventEmitter.address);
	bcConfig[chainId].eventEmitter = {
		address: eventEmitter.address,
		abi: eventEmitter.interface.format(),
		abijson: eventEmitter.interface.format(ethers.utils.FormatTypes.json),
		startBlock,
	};

	const BuckitUpRegistry = await ethers.getContractFactory('Registry');
	const registry = await BuckitUpRegistry.deploy(eventEmitter.address);
	await registry.deployed();
	console.log('BuckitUpRegistry', registry.address);
	bcConfig[chainId].registry = {
		address: registry.address,
		abi: registry.interface.format(),
		abijson: registry.interface.format(ethers.utils.FormatTypes.json),
	};

	const BuckitUpVault = await ethers.getContractFactory('Vault');
	const vault = await BuckitUpVault.deploy(eventEmitter.address);
	await vault.deployed();
	console.log('BuckitUpVault', vault.address);
	bcConfig[chainId].vault = {
		address: vault.address,
		abi: vault.interface.format(),
		abijson: vault.interface.format(ethers.utils.FormatTypes.json),
	};

	await writeFile(`../${fileName}`, JSON.stringify(bcConfig, null, 4));

	await eventEmitter.setEmitter(registry.address, true);
	await eventEmitter.setEmitter(vault.address, true);

	return;

	const testers = [
		'0x242B39E000A1F6B509DAe48965D27eb93464F970',
		'0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38',
		'0xEc44b418139Fa30bdAe165a7D8484f6d7F471445',
		'0xf7a6799E164685Ef752e7121eC6CBf47D6B67dD5',
		'0xE3D1Ca0e6E87420333c12b475eFcB7457C22E396',
		'0x1df2674903208dfa0590B7664Fa3B25da5009194',
	];
	for (let tester of testers) {
		await deployer.sendTransaction({ to: tester, value: utils.parseEther('10') });
	}

	const register = [
		{
			user: new Wallet('0xd292bd04cecd27f8ff12dad85b71b1d62a6da29863a94341ac618a5049494f9f'),
			ma: '0x0469ac33afa06c7c9da136c2604172a2969fd6dc1e65316e19e36463ffb1e4891e6e9c0c183bbb592183c81470dffd54f764ccd78e5aaa484eeb82bded821f85da',
		},
		{
			user: new Wallet('0xd20ac7cb8e3a8c9e655fa729f4e6d836717233874a8722bf92097b102576c4e2'),
			ma: '0x042ab05cfdff78f3f5ec165feaeff0a605b85f40383fb04780b35c59fb3a7b7cb883f7827002c360a06e650ce3701f8072bae1c100a656d87ce9c0e2469532ae0a',
		},
		{
			user: new Wallet('0x4a06275ea3f9d5bb57b72b2c6d59fdbc12dbf00fd1d1ef6e2df7040b705333c5'),
			ma: '0x0483efb6096c60d6966eb9e38b5a4c817e4d1c3d38592be30a6f0885baa69d680493332a04996b5abbf8d2ea1df151f013f145d9d89610e85b7ffa105fd22b1fee',
		},
	];

	for (let reg of register) {
		const expire = (await time.latest()) + 300;
		const domain = {
			name: 'BuckitUpRegistry',
			version: '1',
			chainId: chainId,
			verifyingContract: registry.address,
		};
		const types = {
			RegisterWithSign: [
				{ name: 'owner', type: 'address' },
				{ name: 'metaPublicKey', type: 'bytes' },
				{ name: 'expire', type: 'uint40' },
			],
		};
		const value = {
			owner: reg.user.address,
			metaPublicKey: reg.ma,
			expire,
		};

		const signature = await reg.user._signTypedData(domain, types, value);

		await registry.connect(deployer).registerWithSign(reg.user.address, reg.ma, expire, signature);
		console.log('RegisterWithSign', reg.user.address);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

const wait = function (delay = 500) {
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve();
		}, delay),
	);
};
