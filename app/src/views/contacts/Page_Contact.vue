<template>
	<FullContentBlock v-if="$user.account">
		<template #header>
			<div class="d-flex align-items-center justify-content-between w-100 pe-3">
				<div>Contact</div>
				<button class="btn btn-dark rounded-pill ms-1 d-flex align-items-center justify-content-center p-2 px-3" @click="$mitt.emit('modal::open', { id: 'add_contact_handshake' })">
					<i class="_icon_plus bg-white"></i>
					<span class="ms-2">Add</span>
				</button>
			</div>
		</template>
		<template #content>
			<div class="_full_width_block">
				<Account_Info :account-in="contact" ref="accountInfo" v-if="contact" @update="updateContact" />

				<div class="d-flex justify-content-center align-items-center mt-3 mb-2" v-if="false">
					<button type="button" class="btn btn-dark w-100 px-5" @click="save()">Save</button>
					<button type="button" class="btn btn-dark ms-2" @click="accountInfo.reset()" v-if="contact">Discard</button>
				</div>

				<div class="d-flex justify-content-center align-items-center mt-4 mb-3" v-if="isContactSaved">
					<button type="button" class="btn btn-dark rounded-pill _action_btn">
						<i class="_icon_chats bg-white"></i>
					</button>

					<button type="button" class="btn btn-dark rounded-pill _action_btn">
						<i class="_icon_rooms bg-white"></i>
					</button>

					<button type="button" class="btn btn-dark rounded-pill _action_btn">
						<i class="_icon_share bg-white"></i>
					</button>

					<button type="button" class="btn btn-dark rounded-pill _action_btn" @click="deleteContact()">
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
const $route = inject('$route');
const $router = inject('$router');
const $loader = inject('$loader');
const $swalModal = inject('$swalModal');
const $mitt = inject('$mitt');

const accountInfo = ref();
const updatedContact = ref();

onMounted(async () => {
	if (!contact.value) {
		return $router.push({ name: 'account_info' });
	}
	updatedContact.value = JSON.parse(JSON.stringify(contact.value));
});

const updateContact = (c) => {
	updatedContact.value = c;
	save();
};

const contact = computed(() => {
	return $user.account.contacts.find((e) => e.address === $route.params.address);
});

const isContactSaved = computed(() => {
	return $user.account.contacts.findIndex((e) => e.address === updatedContact.value?.address) > -1;
});

async function save() {
	try {
		const idx = $user.account.contacts.findIndex((e) => e.address === contact.value?.address);
		if (idx > -1) {
			if (updatedContact.value.avatar?.dataUrl) {
				$loader.show();
				updatedContact.value.avatar = await uploadToIPFS(updatedContact.value.avatar.blobFile);
			}

			$user.account.contacts[idx].name = updatedContact.value.name;
			$user.account.contacts[idx].avatar = updatedContact.value.avatar;
			$user.account.contacts[idx].notes = updatedContact.value.notes;
			$user.updateVault();
			//await $encryptionManager.setData($user.toVaultFormat($user.account))
		}

		accountInfo.value.reset();
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

const deleteContact = async () => {
	if (!(await $swalModal.value.open({ id: 'delete_contact' }))) return;
	const idx = $user.account.contacts.findIndex((e) => e.address === contact.value?.address);
	if (idx > -1) $user.account.contacts.splice(idx, 1);
	$user.updateVault();

	$router.push({ name: 'home' });
};
</script>
