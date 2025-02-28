<template>
	<FullContentBlock v-if="$user.account">
		<template #header> My shares </template>
		<template #content>
			<div class="_full_width_block">
				<Account_Activate_Reminder />

				<template v-if="$user.account.registeredMetaWallet">
					<div class="_divider">
						Find your shares
						<InfoTooltip class="align-self-center ms-2" :content="'Find your shares'" />
					</div>

					<div class="text-center fs-4 mb-3 text-secondary" v-if="!data.searched">
						Scan all to find all shares created for your stealth addresses. Or search by backup tag, creator public key or wallet address
					</div>

					<div class="d-flex align-items-center w-100 mb-3 flex-column flex-lg-row">
						<div class="_search flex-grow-1 mb-2" :class="{ 'w-100': $breakpoint.lt('lg') }">
							<div class="_input_search">
								<div class="_icon_search"></div>
								<input class="" type="text" v-model="data.query.s" autocomplete="off" placeholder="backup tag, owner public key or address..." />

								<div class="_icon_times" v-if="data.query.s" @click="resetSearch()"></div>
							</div>
						</div>
						<button class="btn btn-dark ms-2 rounded-pill mb-2 px-4" :class="{ 'w-100': $breakpoint.lt('lg') }" @click="getList()">{{ data.query.s ? 'Search' : 'Scan all' }}</button>
					</div>

					<div v-if="data.fetched">
						<div v-if="!data.items.length">
							<div class="text-center fs-2 mb-3">No shares found</div>
						</div>
						<div class="_data_block mb-3" v-for="(backup, $index) in data.items" :key="backup.id">
							<BackupItem :backup="backup" />
						</div>
					</div>

					<Paginate :page-count="parseInt(data.totalPages)" :click-handler="setPage" :force-page="parseInt(1)"> </Paginate>
				</template>
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
import BackupItem from './Backup_Item.vue';
import Paginate from '@/components/Paginate.vue';
import { ref, onMounted, watch, inject, onUnmounted } from 'vue';
import axios from 'axios';
import FullContentBlock from '@/components/FullContentBlock.vue';
import Account_Activate_Reminder from '@/components/Account_Activate_Reminder.vue';
import { utils } from 'ethers';
const $user = inject('$user');
const $web3 = inject('$web3');
const $swal = inject('$swal');
const $socket = inject('$socket');
const $loader = inject('$loader');
const backups = ref([]);

const dataDefault = {
	query: { sort: 'desc', s: '' },
	items: [],
	totalPages: 0,
	totalResults: 0,
	fetching: false,
	fetched: false,
	searched: false,
};

const data = ref(JSON.parse(JSON.stringify(dataDefault)));

onMounted(async () => {
	$socket.on('BACKUP_UPDATE', updateData);
	data.value = JSON.parse(JSON.stringify(dataDefault));
	//if ($user.account?.registeredMetaWallet) getList();
});

onUnmounted(async () => {
	$socket.off('BACKUP_UPDATE', updateData);
});

watch(
	() => $user.account?.registeredMetaWallet,
	async (newVal) => {
		if (newVal) {
			//getList();
		}
	},
);

const updateData = async (tagUpdate) => {
	try {
		const idx = backups.value.findIndex((b) => b.tag === tagUpdate);
		if (idx > -1) {
			const bk = (await axios.get(API_URL + '/backup/get', { params: { tag: tagUpdate, chainId: $web3.mainChainId } })).data;
			backups.value[idx] = bk;
		}
	} catch (error) {
		console.log(error);
	}
};

const resetSearch = async () => {
	data.value.query.s = null;
	data.value.fetched = false;
	data.value.items = [];
	data.value.totalPages = 0;
	data.value.totalResults = 0;
};

function setPage(page) {
	//data.value.query.page = page;
	getList();
}

const getList = async () => {
	$loader.show();
	data.value.fetching = true;
	try {
		const backups = [];
		let s;
		if (data.value.query.s?.length) {
			try {
				s = utils.computeAddress(data.value.query.s.trim());
			} catch (error) {
				console.log(error);
			}

			if (!s) {
				s = data.value.query.s;
			}
		}
		const bk = (
			await axios.get(API_URL + '/backup/getAll', {
				params: {
					s,
					chainId: $web3.mainChainId,
				},
			})
		).data;

		for (let index = 0; index < bk.length; index++) {
			const backup = bk[index];

			for (let i = 0; i < backup.shares.length; i++) {
				const share = backup.shares[i];
				const stealthAddr = $web3.bukitupClient.getStealthAddressFromEphemeral($user.account.metaPrivateKey, share.ephemeralPubKey);

				if (stealthAddr.toLowerCase() === share.stealthAddress.toLowerCase()) {
					backups.push(backup);
					break;
				}
			}
		}
		data.value.items = backups;
		data.value.totalPages = 1;
		data.value.totalResults = backups.length;
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Fetch error',
			footer: error.toString(),
			timer: 30000,
		});
	}
	$loader.hide();
	data.value.fetched = true;
	data.value.fetching = false;
	data.value.searched = true;
};
</script>
