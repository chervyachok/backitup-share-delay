<template>
	<FullContentBlock v-if="$user.account">
		<template #header><div class="fw-bold fs-5 py-1">Transactions</div> </template>
		<template #content>
			<div class="_full_width_block">
				<div class="d-flex align-items-center justify-content-between mb-2" v-if="data.query && !onlyLast">
					<div class="">Recent transactions</div>

					<div class="d-flex align-items-center _pointer" @click="getList()">
						<i class="_icon_reload bg-dark me-2" v-if="!data.fetching"></i>
						<span v-if="!data.fetching"> Reload </span>
						<span v-if="data.fetching"> Loading... </span>
					</div>
				</div>
				<div v-if="data.fetched">
					<div v-if="!data.items.length && !onlyLast">
						<div class="text-center fs-5 mb-2">No transactions yet</div>
					</div>

					<Transactions :list="$user.transactions" />
				</div>
			</div>
		</template>
	</FullContentBlock>
</template>

<style lang="scss" scoped>
@import '@/scss/variables.scss';
._full_width_block {
	max-width: 40rem;
	width: 100%;
}
</style>

<script setup>
import FullContentBlock from '@/components/FullContentBlock.vue';
import Transactions from './Transactions.vue';

import { ref, onMounted, watch, inject, computed, onUnmounted } from 'vue';
import axios from 'axios';

const $user = inject('$user');
const $mitt = inject('$mitt');
const $web3 = inject('$web3');

const dataDefault = {
	query: { sort: 'desc', page: 1, limit: 10 },
	items: [],
	totalPages: 0,
	totalResults: 0,
	fetching: false,
	fetched: false,
};

const data = ref(JSON.parse(JSON.stringify(dataDefault)));

onMounted(async () => {
	$mitt.on('WALLET_UPDATE', getList);
	getList();
});

onUnmounted(async () => {
	$mitt.off('WALLET_UPDATE', getList);
});

watch(
	() => $user.account?.address,
	async (n, o) => {
		$user.transactions = [];
		if (n) getList();
	},
);

function setPage(page) {
	data.value.query.page = page;
	getList();
}

const getList = async () => {
	if (!$user.account?.address) return;
	data.value.fetching = true;
	try {
		const res = (
			await axios.get(API_URL + '/dispatch/getList', {
				params: {
					wallet: $user.account.address,
					chainId: $web3.mainChainId,
				},
			})
		).data;
		$user.transactions = res.results;
		data.value.items = res.results;
		data.value.totalPages = res.totalPages;
		data.value.totalResults = res.totalResults;
	} catch (error) {
		console.log('transactins update', error);
	}
	data.value.fetched = true;
	data.value.fetching = false;
};
</script>
