<template>
	<Contacts_List @select="select" :selected="selected" />

	<div class="fs-5 text-center" v-if="!$user.account.contacts.length">
		<p>Your list is empty</p>
	</div>
</template>

<script setup>
import Contacts_List from '@/views/contacts/Contacts_List.vue';
import { ref, inject, watch, onMounted } from 'vue';

const $route = inject('$route');
const $router = inject('$router');
const $user = inject('$user');
const $menuOpened = inject('$menuOpened');

const selected = ref([]);

const select = (address) => {
	selected.value = [address];
	$router.push({ name: 'contact', params: { address } });
	$menuOpened.value = false;
};

onMounted(async () => {
	if ($menuOpened.value && $route.params.address) checkSelection();
});

watch(
	() => $menuOpened.value,
	async (newVal) => {
		if (newVal && $route.params.address) checkSelection();
	},
);

watch(
	() => $user.account?.address,
	async (newVal) => {
		selected.value = [];
	},
);

const checkSelection = () => {
	const contact = $user.account.contacts.find((c) => c.address === $route.params.address);
	if (contact) selected.value = [$route.params.address];
};
</script>
