import { defineStore } from 'pinia';
import { ref, inject } from 'vue';
import * as $enigma from '../libs/enigma';
import { utils, Wallet } from 'ethers';
import { web3Store } from './web3.store';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

export const userStore = defineStore(
	'user',
	() => {
		const account = ref();
		const defaultAvatar = '/img/profile.webp';

		//const $swalModal = inject('$swalModal');

		const transactions = ref([]);

		const vaults = ref([
			{
				address: '0x748d9c35b6bFD0AD3E05d891Ad97855c314C49ED',
				privateKey: '0xd292bd04cecd27f8ff12dad85b71b1d62a6da29863a94341ac618a5049494f9f',
				privateKeyB64: '0pK9BM7NJ/j/EtrYW3Gx1iptophjqUNBrGGKUElJT58=',
				publicKey: '0x028b1cc67b1524038c8445e0ab4a383d0bb02f4e75b8f7eee6bae33eff14781e7a',
				publicKeyB64: 'AoscxnsVJAOMhEXgq0o4PQuwL051uPfu5rrjPv8UeB56',
				metaPublicKey: '0x0469ac33afa06c7c9da136c2604172a2969fd6dc1e65316e19e36463ffb1e4891e6e9c0c183bbb592183c81470dffd54f764ccd78e5aaa484eeb82bded821f85da',
				metaPrivateKey: '0x1559a9de3c10299fee40e18bf44845400f26080c05f4d11398a7fa9ccd1663d4',
				name: 'Roman Chvankov',
				notes: 'BuckitUp working profile',
				avatar: 'bafybeiaygoakof2slx3spdoy2nf6bqdghurqvfucka2mslh7b54bhhfim4',
				contacts: [
					{
						publicKey: '0x02bf7a036d76c748bcd23619d0961eff9f813715e3df83562c90d48c100ef2b7cc',
						address: '0xAc3e4a2D4609309A837DF653Cbd71b1589bb2E65',
						name: 'Arkadiy',
						notes: 'BuckitUp boss',
					},
					{
						publicKey: '0x02ee7928ca1750ce9fc0e870a780087f2bd5b5fed29d6a3b9cfd82004bb755f4b1',
						address: '0xAC31746448cdcC7e72915F68185372FF63a10279',
						name: 'Sergey',
						notes: 'BuckitUp lead dev',
					},
					{
						address: '0x7257253d64871377f3563cB533aF715927CE5Ea9',
						publicKey: '0x02e066aae9b2f0efe43b0f604b1398ce38914e77cb61c645bb5bdde61a07523ee8',
						name: 'Alice Johnson',
						notes: 'A long-time friend and crypto enthusiast.',
						avatar: 'bafybeicmqczqlcfstoc242b4rfgdcsiyr7znqczisqfjxmrgoh5w4w7owi',
					},
					{
						address: '0x96103B125c6FD386B1901138d1Ebfcad18A70d29',
						publicKey: '0x02883c1f0e26d20fbf7944fbf0662e2e21e6c8416b11b7778671a8555a38f9a847',
						name: 'Bob Smith',
						notes: 'Met at a blockchain conference last year.',
						avatar: 'bafybeiey4mhhezratch34l2py5jycdnk2l4bvp2oe26pr3pwmfd2jdjkxa',
					},
					{
						address: '0x4cb87d2842691b21529082189839Dd6F9f82a7Fd',
						publicKey: '0x03cb59130c8daef1ad3a9c59509bdf7a6ee20c112020317acdc5edaf2f4b3cc8a4',
						name: 'Charlie Brown',
						notes: 'Trusted trader and NFT collector.',
						avatar: 'bafybeic7vhotto7c4kqgzmlechjjgbsrhyigzznl3e5wriuhpa527hqk64',
					},
					{
						address: '0x699756A0c4663C04a87E1bF8b85ff165BADEd0dE',
						publicKey: '0x0245934e1ace7a0cedb723f15893b3985179061f62e98e6cbbe1c9698fce09f977',
						name: 'David Taylor',
						notes: 'Specializes in decentralized finance (DeFi).',
					},
					{
						address: '0x46d66a7EE137bD896E63f62658028Bb7DeAe9504',
						publicKey: '0x02581d24eca4173aa9e06a85cd8e0548adf3605da210eb5a3eb2a22ac38b930cb5',
						name: 'Eve Anderson',
						notes: 'Always up to date with the latest crypto trends.',
					},
					{
						address: '0xaA5AD169584DE3a4081d7eEaDeB88B48F3Fc99A3',
						publicKey: '0x02db0d7100bf402b89069d11fc6701bdca52e0876a38a7d09c8808782e3c31d89f',
						name: 'Frank Thomas',
						notes: 'We collaborated on a smart contract project.',
					},
					{
						address: '0x84B225D89C5D98882C3fBB054e45403C2943C483',
						publicKey: '0x029ab62a5d196300dbe031050a8b91581982ea25e25cfe2f22ae4c853e10d8cc34',
						name: 'Grace White',
						notes: 'Knows a lot about Ethereum staking strategies.',
					},
					{
						address: '0x1904937662053BD2c55E12F5782c9D82A7A76E82',
						publicKey: '0x02e8582fabb113ed79864ede4eb100bb21cd3afde042e28deee0db3fbee1b074fc',
						name: 'Hannah Harris',
						notes: 'Runs a YouTube channel about crypto investing.',
					},
					{
						address: '0x82B97cC2003832594EE8f70eFC21dDa5A2FF2eC1',
						publicKey: '0x0306e297502b67f2746eb0112f0a26a8189b56a24f2b2759848eb362b1af70cdcb',
						name: 'Ivan Martin',
						notes: 'A passionate advocate for Web3 and privacy.',
					},
					{
						address: '0xB096bF7842401EFB33A1950a022C11061Ea23298',
						publicKey: '0x0244cdc749381572f5b501b89efbc4ba398d594323a1b83be8e209684a5f95db7f',
						name: 'Julia Thompson',
						notes: 'Highly skilled in Solidity and dApp development.',
					},
				],
			},
			{
				address: '0xAc3e4a2D4609309A837DF653Cbd71b1589bb2E65',
				privateKey: '0xd20ac7cb8e3a8c9e655fa729f4e6d836717233874a8722bf92097b102576c4e2',
				privateKeyB64: '0grHy446jJ5lX6cp9ObYNnFyM4dKhyK/kgl7ECV2xOI=',
				publicKey: '0x02bf7a036d76c748bcd23619d0961eff9f813715e3df83562c90d48c100ef2b7cc',
				publicKeyB64: 'Ar96A212x0i80jYZ0JYe/5+BNxXj34NWLJDUjBAO8rfM',
				metaPublicKey: '0x042ab05cfdff78f3f5ec165feaeff0a605b85f40383fb04780b35c59fb3a7b7cb883f7827002c360a06e650ce3701f8072bae1c100a656d87ce9c0e2469532ae0a',
				metaPrivateKey: '0xc5a3ad0b7f6f81220b7ab870d7f23a6c9f187ebcc1f0a528fc7c414a2538d7bb',
				name: 'Arkadiy',
				notes: 'Testing profile',
				contacts: [
					{
						publicKey: '0x028b1cc67b1524038c8445e0ab4a383d0bb02f4e75b8f7eee6bae33eff14781e7a',
						address: '0x748d9c35b6bFD0AD3E05d891Ad97855c314C49ED',
						name: 'Roman Chvankov',
						notes: 'Blockchain dev',
					},
					//{
					//  publicKey:
					//    "0x02ee7928ca1750ce9fc0e870a780087f2bd5b5fed29d6a3b9cfd82004bb755f4b1",
					//  address: "0xAC31746448cdcC7e72915F68185372FF63a10279",
					//  name: "Sergey",
					//  notes: "BuckitUp lead dev",
					//},
					{
						address: '0x7257253d64871377f3563cB533aF715927CE5Ea9',
						publicKey: '0x02e066aae9b2f0efe43b0f604b1398ce38914e77cb61c645bb5bdde61a07523ee8',
						name: 'Alice Johnson',
						notes: 'A long-time friend and crypto enthusiast.',
						avatar: 'bafybeicmqczqlcfstoc242b4rfgdcsiyr7znqczisqfjxmrgoh5w4w7owi',
					},
					{
						address: '0x96103B125c6FD386B1901138d1Ebfcad18A70d29',
						publicKey: '0x02883c1f0e26d20fbf7944fbf0662e2e21e6c8416b11b7778671a8555a38f9a847',
						name: 'Bob Smith',
						notes: 'Met at a blockchain conference last year.',
						avatar: 'bafybeiey4mhhezratch34l2py5jycdnk2l4bvp2oe26pr3pwmfd2jdjkxa',
					},
					{
						address: '0x4cb87d2842691b21529082189839Dd6F9f82a7Fd',
						publicKey: '0x03cb59130c8daef1ad3a9c59509bdf7a6ee20c112020317acdc5edaf2f4b3cc8a4',
						name: 'Charlie Brown',
						notes: 'Trusted trader and NFT collector.',
						avatar: 'bafybeic7vhotto7c4kqgzmlechjjgbsrhyigzznl3e5wriuhpa527hqk64',
					},
					{
						address: '0x699756A0c4663C04a87E1bF8b85ff165BADEd0dE',
						publicKey: '0x0245934e1ace7a0cedb723f15893b3985179061f62e98e6cbbe1c9698fce09f977',
						name: 'David Taylor',
						notes: 'Specializes in decentralized finance (DeFi).',
					},
				],
			},
			{
				address: '0xAC31746448cdcC7e72915F68185372FF63a10279',
				privateKey: '0x4a06275ea3f9d5bb57b72b2c6d59fdbc12dbf00fd1d1ef6e2df7040b705333c5',
				privateKeyB64: 'SgYnXqP51btXtyssbVn9vBLb8A/R0e9uLfcEC3BTM8U=',
				publicKey: '0x02ee7928ca1750ce9fc0e870a780087f2bd5b5fed29d6a3b9cfd82004bb755f4b1',
				publicKeyB64: 'Au55KMoXUM6fwOhwp4AIfyvVtf7SnWo7nP2CAEu3VfSx',
				metaPublicKey: '0x0483efb6096c60d6966eb9e38b5a4c817e4d1c3d38592be30a6f0885baa69d680493332a04996b5abbf8d2ea1df151f013f145d9d89610e85b7ffa105fd22b1fee',
				metaPrivateKey: '0x2babd837b464ed6100b9b7cfb2ecc68423e2f090b21e646050d9c8e32db3a5c9',
				name: 'Sergey',
				notes: 'Preview profile',
				contacts: [
					//{
					//  publicKey:
					//    "0x02bf7a036d76c748bcd23619d0961eff9f813715e3df83562c90d48c100ef2b7cc",
					//  address: "0xAc3e4a2D4609309A837DF653Cbd71b1589bb2E65",
					//  name: "Arkadiy",
					//  notes: "BuckitUp boss",
					//},
					//{
					//  publicKey:
					//    "0x028b1cc67b1524038c8445e0ab4a383d0bb02f4e75b8f7eee6bae33eff14781e7a",
					//  address: "0x748d9c35b6bFD0AD3E05d891Ad97855c314C49ED",
					//  name: "Roman Chvankov",
					//  notes: "Blockchain dev",
					//}
				],
			},
			{
				address: '0xad145e1F9684f926996Bfe9d967c4E3bF55d35a3',
				privateKey: '0xed0c62a9c2d2f8968ad14fb00a486653bae207cba2109720288912f065cc1e91',
				privateKeyB64: '7QxiqcLS+JaK0U+wCkhmU7riB8uiEJcgKIkS8GXMHpE=',
				publicKey: '0x03559e5e8d2494c90ab055408f0f6100be28d6bbc6bd9ee5b2ae697c347dfc81f4',
				publicKeyB64: 'A1WeXo0klMkKsFVAjw9hAL4o1rvGvZ7lsq5pfDR9/IH0',
				metaPublicKey: '0x04b4fd6cc548d005a7bf9dbbbec6bbfa729e19a77b7734891083bada802e56f78c90606735db64d483f2d4f26a5e237fff1ff49fd6c4ef8af034701b7cba4e12df',
				metaPrivateKey: '0x0799a0d8a9a2ddf0cb437f71a777d1730c87e6cc72d8c994634d14c7ba590c7b',
				rooms: [],
				contacts: [],
				name: 'Test1',
				notes: 'wefwf',
			},
		]);

		const ls = localStorage.getItem('user');
		let lsd;

		try {
			lsd = JSON.parse(ls);
		} catch (error) {}

		//if (location.origin.includes('loc')) {account.value = lsd?.vaults[0] ? lsd.vaults[0] : vaults.value[0];}
		//if (location.origin.includes('192')) account.value = lsd?.vaults[1] ? lsd.vaults[1] : vaults.value[1];
		//if (location.origin.includes('buck')) account.value = lsd?.vaults[2] ? lsd.vaults[2] : vaults.value[2];

		const logout = () => {
			account.value = null;
			transactions.value = [];
		};

		const updateVault = () => {
			const idx = vaults.value.findIndex((v) => v.address === account.value.address);
			if (idx > -1) vaults.value[idx] = account.value;
		};
		const toVaultFormat = (user) => {
			return user;
			return [
				[user.name, $enigma.combineKeypair(user.privateKeyB64, user.publicKeyB64)],
				user.rooms,
				user.contacts.reduce((acc, u) => {
					acc[u.publicKey] = { name: u.name, notes: u.notes, avatar: u.avatar };
					return acc;
				}, {}),
			];
		};

		const fromVaultFormat = async (vault) => {
			return vault;
			const keys = $enigma.splitKeypair(vault[0][1]);
			const privateKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.privateKey);
			const publicKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.publicKey);
			const wallet = new Wallet(privateKeyHex);
			const signature = await wallet.signMessage(privateKeyHex);
			const meta = await web3Store().bukitupClient.generateKeysFromSignature(signature);

			return {
				displayName: vault[0][0],
				address: wallet.address,
				metaPrivateKey: meta.spendingKeyPair.privatekey,
				metaPublicKey: meta.spendingKeyPair.account.publicKey,
				privateKey: privateKeyHex,
				privateKeyB64: keys.privateKey,
				publicKey: publicKeyHex,
				publicKeyB64: keys.publicKey,
				contacts: Object.entries(vault[2]).map(([publicKey, value]) => ({
					publicKey,
					address: utils.computeAddress('0x' + publicKey).toLowerCase(),
					...value,
				})),
				rooms: vault[1],
			};
		};

		const generateAccount = async () => {
			const keys = $enigma.generateKeypair();
			const privateKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.privateKey);
			const publicKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.publicKey);
			const wallet = new Wallet(privateKeyHex);
			const signature = await wallet.signMessage(privateKeyHex);
			const meta = await web3Store().bukitupClient.generateKeysFromSignature(signature);
			const account = {
				address: wallet.address,
				privateKey: privateKeyHex,
				privateKeyB64: keys.privateKey,
				publicKey: publicKeyHex,
				publicKeyB64: keys.publicKey,
				metaPublicKey: meta.spendingKeyPair.account.publicKey,
				metaPrivateKey: meta.spendingKeyPair.privatekey,
				rooms: [],
				contacts: [],
			};
			//console.log('generateAccount',JSON.stringify(account, null, 2) )
			return account;
		};

		return {
			vaults,
			logout,
			account,
			defaultAvatar,

			transactions,
			toVaultFormat,
			fromVaultFormat,
			generateAccount,
			updateVault,
		};
	},
	{
		persist: {
			//storage: piniaPluginPersistedstate.localStorage(),
			pick: ['vaults'],
		},
	},
);
