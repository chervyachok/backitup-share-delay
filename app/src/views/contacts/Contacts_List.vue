<template>
	<div class="_contacts_list" :class="{ _has_contacts: $user.account?.contacts?.length }">
		<div class="_search mb-1" v-if="$user.account?.contacts?.length">
			<div class="_input_search">
				<div class="_icon_search"></div>
				<input class="" type="text" v-model="search" autocomplete="off" placeholder="Search..." />

				<div class="_icon_times" v-if="search" @click="search = null"></div>
			</div>
		</div>

		<div class="_list" v-if="$user.account?.contacts?.length">
			<div class="_contact" @click="select(contact.address)" v-for="contact in filteredList" :class="{ _selected: isSelected(contact.address) }">
				<Account_Item :account="contact" />
				<div v-if="metaRequired && contact.metaPublicKey">
					<div class="_icon_activated bg-success me-2"></div>
				</div>
			</div>
			<div class="px-2 mt-2">
				<button class="btn btn-dark rounded-pill d-flex align-items-center justify-content-center p-2 w-100" @click="$mitt.emit('modal::open', { id: 'add_contact_handshake' })">
					<i class="_icon_plus bg-white"></i>
					<span class="ms-2">Add new contact</span>
				</button>
			</div>
		</div>
	</div>
</template>
<style lang="scss" scoped>
@import '@/scss/variables.scss';
@import '@/scss/breakpoints.scss';

._contacts_list {
	height: calc(100vh - 3rem);
	display: flex;
	flex-direction: column;
	overflow: hidden;

	&._has_contacts {
		flex-grow: 1;
	}

	._list {
		flex-grow: 1;
		overflow-y: auto;

		._contact {
			display: flex;
			align-items: center;
			padding: 0.5rem;
			width: 100%;
			cursor: pointer;
			border-radius: $blockRadiusSm;
			&:hover {
				background-color: lighten($black, 90%);
			}
			&._selected {
				background-color: lighten($black, 85%);
			}
		}
	}
}
</style>

<script setup>
import { ref, onMounted, watch, inject, computed, nextTick, onUnmounted } from 'vue';
import Account_Item from '@/components/Account_Item.vue';
import { readContract } from '@wagmi/core';

const $user = inject('$user');
const $web3 = inject('$web3');
const $mitt = inject('$mitt');
const search = ref();

const { selected, excluded, metaRequired } = defineProps({
	selected: { type: Array, default: [] },
	excluded: { type: Array, default: [] },
	metaRequired: { type: Boolean },
});

const emit = defineEmits(['select']);

const isSelected = (address) => {
	return selected.findIndex((a) => a === address) > -1;
};

const select = (address) => {
	if (metaRequired) {
		const hasMeta = $user.account.contacts.find((c) => c.address === address && c.metaPublicKey);

		if (!hasMeta) return;
	}
	emit('select', address);
};

const filteredList = computed(() => {
	let list, searchTerm;
	if (!search.value) {
		list = $user.account.contacts;
	} else {
		searchTerm = search.value.toLowerCase();
		list = $user.account.contacts.filter((c) => [c.name, c.notes].some((value) => value.toLowerCase().includes(searchTerm)));
	}

	if (excluded?.length) {
		list = list.filter((item) => !excluded.includes(item.address)); // exclude from excluded)
	}

	return list.map((c) => ({
		...c,
		highlightedName: highlightText(c.name, searchTerm),
		highlightedAddress: highlightText(c.address, searchTerm),
		highlightedNotes: highlightText(c.notes, searchTerm),
	}));
});

function highlightText(text, searchTerm) {
	if (!searchTerm) return text;
	const regex = new RegExp(`(${searchTerm})`, 'gi');
	return text.replace(regex, `<span class="_highlight_search_text">$1</span>`); // Wrap matched text with <mark>
}

onMounted(async () => {
	if (metaRequired) checkContacts();
});

onUnmounted(async () => {});

const checkContacts = async () => {
	try {
		const contactsWithoutWetaWallet = $user.account.contacts.filter((c) => !c.metaPublicKey).map((c) => c.address);
		if (!contactsWithoutWetaWallet.length) return;

		const metaPublicKeys = await readContract($web3.wagmiAdapter.wagmiConfig, {
			address: $web3.bc.registry.address,
			abi: JSON.parse($web3.bc.registry.abijson),
			functionName: 'getPulickKeys',
			args: [contactsWithoutWetaWallet],
		});

		for (let i = 0; i < contactsWithoutWetaWallet.length; i++) {
			const metaPublicKey = metaPublicKeys[i];

			if (metaPublicKey && metaPublicKey.length > 2) {
				const idx = $user.account.contacts.findIndex((c) => c.address === contactsWithoutWetaWallet[i]);
				if (idx > -1) {
					$user.account.contacts[idx].metaPublicKey = metaPublicKey;
					$user.updateVault();
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
};
</script>
