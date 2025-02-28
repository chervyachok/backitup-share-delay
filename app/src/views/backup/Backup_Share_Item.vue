<template>
	<div class="border-top mt-2 pt-2" v-if="isOwner || share.stealthAddress?.toLowerCase() === stealthAddr">
		<div class="d-flex align-items-center justify-content-between mb-2" v-if="isOwner">
			<div class="" v-if="contact">
				<Account_Item :account="contact" />
			</div>

			<div class="text-end">
				<div class="text-danger fw-bold text-end" v-if="!share.unlocked && share.disabled">Disabled</div>
				<button type="button" class="btn btn-outline-dark btn-sm" @click="updateShareDisabled()" v-if="isOwner && !share.unlocked" :disabled="tx.length">
					{{ share.disabled ? 'Enable' : 'Disable' }}
				</button>
				<button type="button" class="btn btn-outline-dark btn-sm" @click="recover()" v-if="!isRequestRequired && isRocoverable">Recover</button>

				<span v-if="share.unlocked" class="text-success fw-bold ms-2"> Unlocked </span>
			</div>
		</div>

		<div v-if="message" class="mb-2">
			{{ message }}
		</div>

		<div class="fw-bold"></div>

		<div class="d-flex justify-content-between align-items-center">
			<div class="d-flex align-items-center" v-if="share.delay && !share.unlocked">
				<i class="_icon_timer bg-black me-2"></i>
				<div>Recover delay</div>
				<span class="fw-bold ms-1">{{ $filters.secondsToHMS(share.delay) }}</span>
				<InfoTooltip class="align-self-center ms-2" :content="'Required number of shares to recover secret'" />
			</div>

			<div>
				<button type="button" class="btn btn-outline-dark btn-sm" @click="setUpdateShareDelay(share.idx)" v-if="isOwner && share.delay && !share.unlocked" :disabled="tx.length">Update</button>
				<button type="button" class="btn btn-outline-dark btn-sm" @click="requestRecover()" v-if="!isOwner && isRequestRequired" :disabled="tx.length">Request</button>
			</div>
		</div>

		<div class="d-flex justify-content-between align-items-center" v-if="!isRequestRequired && isRocoverable">
			<div class="d-flex align-items-center">
				<span class="text-success fw-bold"> Unlocked </span>
			</div>

			<div>
				<button type="button" class="btn btn-outline-dark btn-sm" @click="recover('copy')">Copy</button>
				<button type="button" class="btn btn-outline-dark btn-sm ms-1" @click="recover('down')">Download</button>
				<button type="button" class="btn btn-outline-dark btn-sm ms-1" @click="recover('restore')">Restore</button>
			</div>
		</div>

		<div class="d-flex justify-content-between align-items-center mt-2" v-if="share.request && !share.unlocked">
			<div class="d-flex align-items-center">
				<span class="text-danger fw-bold me-2"> Recover requested </span>
				<!--span>{{ $date.unix(share.request).fromNow() }}</span-->
			</div>

			<div v-if="timeLeft" v-tooltip="`Requested ${$date.unix(share.request).format('DD-MM-YY HH:mm')}, Unlocks ${$date.unix(share.request + share.delay).format('DD-MM-YY HH:mm')}`">
				Unlocks {{ $date.unix(share.request + share.delay).fromNow() }}
			</div>
		</div>

		<div v-show="tx" class="mt-2">
			<Transactions :list="tx" />
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import { useReadContract } from '@wagmi/vue';
import { decryptToString } from '@lit-protocol/encryption';
import { cipher, decryptWithPrivateKey } from 'eth-crypto';
import copyToClipboard from '@/utils/copyToClipboard';
import { Wallet } from 'ethers';
import axios from 'axios';
import Account_Item from '@/components/Account_Item.vue';
import errorMessage from '@/utils/errorMessage';
import Transactions from '@/views/account/Transactions.vue';

const $timestamp = inject('$timestamp');
const $user = inject('$user');
const $web3 = inject('$web3');
const $swal = inject('$swal');
const $loader = inject('$loader');
const $swalModal = inject('$swalModal');
const $router = inject('$router');
const $appstate = inject('$appstate');

const shareDelay = ref();

const { backup, share, idx } = defineProps({
	backup: { type: Object, required: true },
	share: { type: Object, required: true },
	idx: { type: Number, required: true },
});

onMounted(async () => {
	init();
});

const tx = computed(() => {
	return $user.transactions.filter(
		(t) => (t.method === 'updateShareDelay' || t.method === 'requestRecover' || t.method === 'updateShareDisabled') && t.status === 'PROCESSING' && t.methodData.tag === backup.tag,
	);
});

watch(
	() => backup,
	async (newResult) => {
		console.log('watch backupData', newResult);
		init();
	},
	{ deep: true },
);

const message = ref();
const privateKey = ref();
const stealthAddr = ref();
const address = ref();

const contact = computed(() => {
	let contact;
	try {
		contact = $user.account.contacts.find((c) => c.address.toLowerCase() === address.value.toLowerCase());
	} catch (error) {}

	try {
		if (!contact && stealthAddr.value) {
			contact = {
				address: stealthAddr.value,
			};
		}
	} catch (error) {}
	return contact;
});

const init = async () => {
	privateKey.value = null;
	shareDelay.value = share.delay;
	message.value = null;
	stealthAddr.value = $web3.bukitupClient.getStealthAddressFromEphemeral($user.account.metaPrivateKey, share.ephemeralPubKey).toLowerCase();
	if (stealthAddr.value === share.stealthAddress.toLowerCase()) {
		privateKey.value = $web3.bukitupClient.generateStealthPrivateKey($user.account.metaPrivateKey, share.ephemeralPubKey);
		try {
			message.value = await decryptWithPrivateKey(privateKey.value.slice(2), cipher.parse(share.messageEncrypted.slice(2)));
			console.log('message', message.value);
		} catch (error) {
			console.log('message', error);
		}
	}
	if (isOwner.value && share.addressEncrypted) {
		address.value = await decryptWithPrivateKey($user.account.metaPrivateKey.slice(2), cipher.parse(share.addressEncrypted.slice(2)));
	}
};

const isRequestRequired = computed(() => {
	if (!privateKey.value) return false;
	if (share.request) return false;
	if (backup.disabled) return true;
	if (share.disabled) return true;
	if (share.delay) return true;
});

const isRocoverable = computed(() => {
	if (!privateKey.value) return false;
	if (backup.disabled) return false;
	if (share.disabled) return false;
	if (share.unlocked) return true;
});

const isOwner = computed(() => {
	return backup.wallet.toLowerCase() == $user.account?.address?.toLowerCase();
});

const timeLeft = computed(() => {
	if (share.request == 0) return 0;
	return Math.max(0, share.request + share.delay - $timestamp.value);
});

const updateShareDisabled = async () => {
	if (
		!(await $swalModal.value.open({
			id: 'confirm',
			title: share.disabled ? 'Enabling share' : 'Disabling share',
			content: 'Confirm transaction',
		}))
	)
		return;

	try {
		$loader.show();

		const expire = $timestamp.value + 300;
		const signature = await $web3.signTypedData($user.account.privateKey, {
			domain: {
				name: 'BuckitUpVault',
				version: '1',
				chainId: $web3.mainChainId,
				verifyingContract: $web3.bc.vault.address,
			},
			types: {
				UpdateShareDisabled: [
					{ name: 'tag', type: 'string' },
					{ name: 'idx', type: 'uint8' },
					{ name: 'disabled', type: 'uint8' },
					{ name: 'expire', type: 'uint40' },
				],
			},
			primaryType: 'UpdateShareDisabled',
			message: {
				tag: backup.tag,
				idx: share.idx,
				disabled: share.disabled ? 0 : 1,
				expire,
			},
		});

		await axios.post(API_URL + '/dispatch/updateShareDisabled', {
			wallet: $user.account.address,
			chainId: $web3.mainChainId,
			tag: backup.tag,
			idx: share.idx,
			disabled: share.disabled ? 0 : 1,
			expire,
			signature,
		});

		$swal.fire({
			icon: 'success',
			title: 'Update backup share',
			footer: 'Please wait for transaction confirmation',
			timer: 5000,
		});
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Update backup share error',
			footer: errorMessage(error),
			timer: 30000,
		});
	}
	$loader.hide();
};

const updateShareDelay = async () => {
	if (
		!(await $swalModal.value.open({
			id: 'confirm',
			title: 'Update recovery delay',
			content: 'Confirm transaction',
		}))
	)
		return;

	try {
		$loader.show();

		const expire = $timestamp.value + 300;
		const signature = await $web3.signTypedData($user.account.privateKey, {
			domain: {
				name: 'BuckitUpVault',
				version: '1',
				chainId: $web3.mainChainId,
				verifyingContract: $web3.bc.vault.address,
			},
			types: {
				UpdateShareDelay: [
					{ name: 'tag', type: 'string' },
					{ name: 'idx', type: 'uint8' },
					{ name: 'delay', type: 'uint40' },
					{ name: 'expire', type: 'uint40' },
				],
			},
			primaryType: 'UpdateShareDelay',
			message: {
				tag: backup.tag,
				idx: share.idx,
				delay: shareDelay.value,
				expire,
			},
		});

		await axios.post(API_URL + '/dispatch/updateShareDelay', {
			wallet: $user.account.address,
			chainId: $web3.mainChainId,
			tag: backup.tag,
			idx: share.idx,
			delay: shareDelay.value,
			expire,
			signature,
		});

		$swal.fire({
			icon: 'success',
			title: 'Update recovery delay',
			footer: 'Please wait for transaction confirmation',
			timer: 5000,
		});
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Update recovery delay',
			footer: errorMessage(error),
			timer: 30000,
		});
	}
	$loader.hide();
};

const requestRecover = async () => {
	if (
		!(await $swalModal.value.open({
			id: 'confirm',
			title: 'Recover request',
			content: 'Confirm transaction',
		}))
	)
		return;

	try {
		$loader.show();

		const expire = $timestamp.value + 300;
		const signature = await $web3.signTypedData(privateKey.value, {
			domain: {
				name: 'BuckitUpVault',
				version: '1',
				chainId: $web3.mainChainId,
				verifyingContract: $web3.bc.vault.address,
			},
			types: {
				RequestRecover: [
					{ name: 'tag', type: 'string' },
					{ name: 'idx', type: 'uint8' },
					{ name: 'expire', type: 'uint40' },
				],
			},
			primaryType: 'RequestRecover',
			message: {
				tag: backup.tag,
				idx: share.idx,
				expire,
			},
		});

		await axios.post(API_URL + '/dispatch/requestRecover', {
			wallet: $user.account.address,
			chainId: $web3.mainChainId,
			tag: backup.tag,
			idx: share.idx,
			expire: expire,
			signature: signature,
		});

		$swal.fire({
			icon: 'success',
			title: 'Recover request',
			footer: 'Please wait for transaction confirmation',
			timer: 5000,
		});
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Recover request',
			footer: errorMessage(error),
			timer: 30000,
		});
	}
	$loader.hide();
};

const recover = async (saveType) => {
	try {
		$loader.show();

		const checkAccess = await getGranted();

		if (!checkAccess.data) {
			$loader.hide();
			throw new Error('Not granted');
		}

		const signer = new Wallet(privateKey.value);

		const capacityDelegationAuthSig = (
			await axios.post(API_URL + '/lit/getCreditsSign', {
				address: signer.address,
			})
		).data;

		const sessionSigs = await $web3.getSessionSigs(signer, capacityDelegationAuthSig);
		const unifiedAccessControlConditions = $web3.getAccessControlConditions(backup.tag, share.idx);
		const ciphertext = Buffer.from(share.shareEncrypted.slice(2), 'hex');
		const decodedShare = await decryptToString(
			{
				unifiedAccessControlConditions,
				chain: 'sepolia',
				ciphertext: ciphertext.toString('base64'),
				dataToEncryptHash: share.shareEncryptedHash.slice(2),
				sessionSigs,
			},
			$web3.litClient,
		);
		const secret = await $web3.bukitupClient.decryptShare(decodedShare, privateKey.value);

		if (saveType === 'copy') {
			copyToClipboard(secret);
		} else if (saveType === 'restore') {
			$appstate.value.shareToRestore = secret;
			$router.push({ name: 'backup_restore' });
		} else {
			const blob = new Blob([secret], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			const now = new Date();
			const yyyy = now.getFullYear();
			const mm = String(now.getMonth() + 1).padStart(2, '0');
			const dd = String(now.getDate()).padStart(2, '0');
			const datePart = `${yyyy}_${mm}_${dd}`;
			a.download = `${backup.tag}_share_${idx + 1}_${datePart}.data`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Recover error',
			footer: errorMessage(error),
			timer: 30000,
		});
	}
	$loader.hide();
};

const { refetch: getGranted } = useReadContract({
	address: $web3.bc.vault.address,
	abi: JSON.parse($web3.bc.vault.abijson),
	functionName: 'granted',
	args: computed(() => [backup.tag, share.idx, stealthAddr.value]),
	enabled: false,
});
</script>
