<template>
	<div class="px-3 mb-2 mt-2" v-if="mode !== 'qr'">
		<button class="btn btn-outline-dark w-100 mt-3" @click="useQr()">Scan QR code on second device</button>
	</div>

	<div v-show="scanning">
		<div class="text-center fw-bold text-secondary mt-3 mb-2">Scan QR code on second device to establish automatic connection</div>
		<div class="_qr_scanner">
			<video ref="qrScannerEl"></video>
		</div>
	</div>

	<div class="px-3 mb-2 mt-2" v-if="mode !== 'manual'">
		<button class="btn btn-outline-dark w-100 mt-3" @click="useManual()">Enter invitation manually</button>
	</div>

	<div class="px-3 w-100 mb-3 mt-3" v-if="mode === 'manual' && !invitation">
		<div class="text-center fw-bold text-secondary mt-2 mb-2">Enter invitation</div>

		<div class="d-flex justify-content-center">
			<input type="text" class="form-control text-center" v-model="invitationString" />
		</div>

		<button class="btn btn-outline-dark w-100 mt-3" @click="joinInvite()" :disabled="!invitationString">Next</button>
	</div>

	<div class="px-3 w-100 mb-3 mt-3" v-if="invitation && !authenticated && mode === 'manual'">
		<div class="text-center fw-bold text-secondary mt-2 mb-3">Enter auth code from first device</div>

		<div class="d-flex justify-content-center">
			<input type="text" class="form-control _code_input" v-model="authCode" @keydown.enter="authenticate()" />
		</div>

		<button class="btn btn-outline-dark w-100 mt-3" @click="authenticate()" :disabled="!authCode || isWaitingForSpace">Authenticate</button>
	</div>

	<div class="text-center fw-bold text-secondary mt-3 mb-2" v-if="isWaitingForSpace">Connecting...</div>
	<div class="text-center fw-bold text-secondary mt-3 mb-2" v-if="decrypting">Authenticating...</div>
</template>

<style lang="scss">
@import '@/scss/variables.scss';

._qr_scanner {
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 1rem;
	overflow: hidden;
	video {
		//max-width: 20rem;
		width: 100%;
		//height: 30rem;
	}
}

._code_input {
	width: 80%;
	height: 50px;
	font-weight: 500;
	font-size: 40px;
	text-align: center;
}
</style>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import QrScanner from 'qr-scanner';
import { InvitationEncoder } from '@dxos/client/invitations';
const qrScannerEl = ref();
const qrScanner = ref();
const hasCamera = ref();

const $route = inject('$route');
const $router = inject('$router');
const $swal = inject('$swal');
const $loader = inject('$loader');
const $mitt = inject('$mitt');
const $user = inject('$user');
const $enigma = inject('$enigma');
const $encryptionManager = inject('$encryptionManager');

const mode = ref();

const scanning = ref();
const authenticating = ref();
const authenticated = ref();
const decrypting = ref();

const invitationString = ref();
const invitationCode = ref();
const invitation = ref();

const authCode = ref();
const encryptionKey = ref();

onMounted(async () => {
	if ($route.query.invitationCode && $route.query.encryptionKey) {
		invitationCode.value = $route.query.invitationCode;
		encryptionKey.value = $route.query.encryptionKey;
		mode.value = 'manual';
		$router.replace({ query: {} });
		joinInvite();
	}
});

const useQr = async () => {
	mode.value = 'qr';
	startScan();
};

const useManual = async () => {
	mode.value = 'manual';
	try {
		if (qrScanner.value) {
			await qrScanner.value.stop();
			scanning.value = false;
		}
	} catch (error) {
		console.log('authenticate error', error);
	}
};

const joinInvite = async () => {
	try {
		if (invitationString.value) {
			const params = new URL(invitationString.value).searchParams;
			invitationCode.value = params.get('invitationCode') || null;
			encryptionKey.value = params.get('encryptionKey') || null;
			authCode.value = params.get('authCode') || null;
			console.log('🔑 Extracted Invitation', invitationCode.value, encryptionKey.value, authCode.value);
		}

		if (!invitationCode.value || !encryptionKey.value) {
			console.error('❌ No valid invitation code found.');
			return;
		}

		invitation.value = await $user.dxClient.spaces.join(InvitationEncoder.decode(invitationCode.value));
	} catch (error) {
		console.log('authenticate error', error);
		invitationString.value = null;
		invitationCode.value = null;
		encryptionKey.value = null;
		authCode.value = null;
	}
};

const authenticate = async () => {
	if (authenticating.value || authenticated.value || !invitation.value || !authCode.value) return;
	authenticating.value = true;
	try {
		await invitation.value.authenticate(authCode.value);

		const isReady = await waitForSpaceConnection(invitation.value.get().spaceKey.toHex());
		if (!isReady) throw new Error('Connection ot space error');

		authenticated.value = true;
		console.log('Space ready');
		await decryptAccount();
	} catch (error) {
		console.log('authenticate error', error);

		space.value = null;
		invitation.value = null;
	}
	authenticating.value = false;
};

const isWaitingForSpace = ref(false); // 🔹 Reactive flag for UI feedback

const waitForSpaceConnection = async (spaceKey, maxRetries = 10, interval = 1000) => {
	isWaitingForSpace.value = true; // 🔹 Start showing "Waiting..." message
	for (let i = 0; i < maxRetries; i++) {
		console.log(`⏳ Checking for space connection... (Attempt ${i + 1}/${maxRetries})`);
		const spaces = $user.dxClient.spaces.get();
		const spaceToConnect = spaces.find((s) => s.key.toHex() === spaceKey);
		if (spaceToConnect) {
			console.log('✅ Space found:', spaceToConnect);
			isWaitingForSpace.value = false; // 🔹 Stop showing "Waiting..." message
			return true;
		}
		// Wait before the next attempt
		await new Promise((resolve) => setTimeout(resolve, interval));
	}
	console.log('❌ Space connection timed out.');
	isWaitingForSpace.value = false; // 🔹 Stop waiting if timed out
	return null;
};

const decryptAccount = async () => {
	if (decrypting.value || !encryptionKey.value || $user.space) return;
	decrypting.value = true;
	$loader.show();
	try {
		const spaceKey = invitation.value.get().spaceKey.toHex();
		const spaces = $user.dxClient.spaces.get();
		const space = spaces.find((s) => s.key.toHex() === spaceKey);

		await space.waitUntilReady();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const encryptedAccountQuery = await space.db.query((doc) => doc.type === 'encryptedAccount').run();

		if (encryptedAccountQuery.objects.length) {
			const encryptedAccount = encryptedAccountQuery.objects[0];
			const privateKey = $enigma.decryptDataSync(encryptedAccount.privateKey, encryptionKey.value);

			const account = await $user.generateAccount(privateKey);
			console.log('account', account);

			if (account) {
				const accountInfoQuery = await space.db.query((doc) => doc.type === 'accountInfo').run();

				if (accountInfoQuery.objects.length) {
					const accountInfo = $enigma.decryptObjectKeys(accountInfoQuery.objects[0], $user.accountInfoKeys, account.privateKey);

					await $encryptionManager.createVault({
						keyOptions: {
							username: accountInfo.name,
							displayName: accountInfo.name,
						},
						address: account.address,
						publicKey: account.publicKey,
						avatar: accountInfo.avatar,
						notes: accountInfo.notes,
					});
					$user.account = account;
					$user.account.spaceId = space.id;

					await $encryptionManager.setData($user.toVaultFormat($user.account));
					$user.space = space;

					await $user.updateVault();
					await $user.openSpace();

					if (qrScanner.value && scanning.value) {
						await qrScanner.value.stop();
						scanning.value = false;
					}

					encryptedAccount.status = 'COMPLETED';

					$mitt.emit('account::created');
					$mitt.emit('modal::close');
					$router.push({ name: 'account_info' });
					$swal.fire({
						icon: 'success',
						title: 'Device connected',
						timer: 5000,
					});
				}
			}
		}
	} catch (error) {
		console.log('decryptAccount error', error);
	}
	decrypting.value = false;
	$loader.hide();
};

const startScan = async () => {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		hasCamera.value = devices.some((device) => device.kind === 'videoinput');

		if (hasCamera.value) {
			qrScanner.value = new QrScanner(
				qrScannerEl.value,
				async (result) => {
					if (!invitationString.value) {
						invitationString.value = result.data;
						await joinInvite();
						if (invitation.value) {
							await qrScanner.value.stop();
							scanning.value = false;
							authenticate();
						}
					}
				},
				{
					returnDetailedScanResult: true,
					preferredCamera: 'environment',
					highlightScanRegion: true,
					highlightCodeOutline: true,
					calculateScanRegion: (video) => {
						const width = video.videoWidth;
						const height = video.videoHeight;
						const scanSize = 0.8; // 100% of video size
						//const size = width > height ? height : width;
						return {
							x: (width * (1 - scanSize)) / 2, // Center horizontally
							y: (height * (1 - scanSize)) / 2, // Center vertically
							width: width * scanSize, // 80% width
							height: height * scanSize, // 80% height
						};
					},
				},
			);

			await qrScanner.value.start();
			scanning.value = true;
		}
	} catch (error) {
		console.error('Error checking camera availability:', error);
	}
};
</script>
