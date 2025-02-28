<template>
	<FullContentBlock v-if="$user.account">
		<template #header> Account info </template>
		<template #content>
			<div class="_full_width_block">
				<Account_Info :account-in="$user.account" ref="accountInfo" v-if="$user.account" @update="updateAccount" />

				<div class="d-flex justify-content-center align-items-center mt-4 mb-3">
					<button type="button" class="btn btn-dark rounded-pill _action_btn" @click="$mitt.emit('modal::open', { id: 'account_backup' })">
						<i class="_icon_backups bg-white"></i>
					</button>

					<button type="button" class="btn btn-dark rounded-pill _action_btn" @click="deleteAccount()">
						<i class="_icon_delete bg-white"></i>
					</button>
				</div>
			</div>
		</template>
	</FullContentBlock>
</template>

<style lang="scss" scoped>
@import '@/scss/variables.scss';
._full_width_block {
	max-width: 30rem;
	width: 100%;
}
._action_btn {
	padding: 1.2rem;
	margin-left: 0.3rem;
	margin-right: 0.3rem;
	i {
		height: 1.5rem;
		width: 1.5rem;
	}
}
</style>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import Account_Info from '@/components/Account_Info.vue';
import FullContentBlock from '@/components/FullContentBlock.vue';
import { uploadToIPFS } from '@/api/ipfs';
import errorMessage from '@/utils/errorMessage';

const $user = inject('$user');
const $swal = inject('$swal');
const $swalModal = inject('$swalModal');
const $router = inject('$router');
const $loader = inject('$loader');
const $mitt = inject('$mitt');
const accountInfo = ref();
const updatedAccount = ref();

onMounted(async () => {
	updatedAccount.value = JSON.parse(JSON.stringify($user.account));
});

const updateAccount = (c) => {
	updatedAccount.value = c;
	save();
};

async function save() {
	try {
		if (updatedAccount.value.avatar?.dataUrl) {
			$loader.show();
			updatedAccount.value.avatar = await uploadToIPFS(updatedAccount.value.avatar.blobFile);
		}
		$user.account.name = updatedAccount.value.name;
		$user.account.avatar = updatedAccount.value.avatar;
		$user.account.notes = updatedAccount.value.notes;
		//await $encryptionManager.setData($user.toVaultFormat($user.account))
		$user.updateVault();
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Saving',
			text: errorMessage(error),
			timer: 15000,
		});
	}
	$loader.hide();
}

const deleteAccount = async () => {
	if (!(await $swalModal.value.open({ id: 'delete_account' }))) return;
	const idx = $user.vaults.findIndex((v) => v.address === $user.account.address);
	if (idx > -1) $user.vaults.splice(idx, 1);
	$user.updateVault();
	$user.logout();
	$router.push({ name: 'login' });
};
</script>
