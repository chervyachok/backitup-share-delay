<template>
	<div class="wrapper" v-if="$user.account">
		<Menu class="_menu" :class="{ _opened: $menuOpened }" />
		<div class="_menu_backdrop" :class="{ _opened: $menuOpened && $breakpoint.lt('md') }" @click="$menuOpened = false"></div>

		<div class="_main" v-if="$user.account">
			<router-view v-slot="{ Component, route }">
				<component :is="Component" :key="route.path" />
			</router-view>
		</div>
	</div>

	<div v-if="!$user.account" class="_login">
		<router-view v-slot="{ Component, route }">
			<component :is="Component" :key="route.path" />
		</router-view>
	</div>

	<Modal ref="$modal" />
	<Swal ref="$swalModal" />
	<Loader />
</template>

<style lang="scss" scoped>
@import '@/scss/variables.scss';
@import '@/scss/breakpoints.scss';

._login {
	width: 100vw; /* full browser width */
	display: flex; /* use Flexbox */
	justify-content: center; /* horizontally center items */
	align-items: center; /* vertically center items */
}

.wrapper {
	display: flex;
	height: 100vh; // Full viewport height
	flex-direction: row;
}

._menu {
	z-index: 10;
	white-space: nowrap;
	height: 100%;
	flex-shrink: 0;
	position: fixed;
	top: 0;
	left: 0;
	width: 0;
	transition: $transition;
	&._opened {
		width: 360px;
		max-width: 360px;
	}
	@include media-breakpoint-up(md) {
		position: unset;
		width: 360px;
		max-width: 360px;
	}
	box-shadow: 15px 0rem 1rem 0px rgb(0 0 0 / 12%);
	overflow: hidden;
}
._menu_backdrop {
	position: fixed;
	height: 100%;
	width: 0;
	z-index: 9;
	background-color: rgba(0, 0, 0, 0.041);
	//transition: backdrop-filter .3s ease;
	pointer-events: none;
	&._opened {
		width: 100%;
		pointer-events: all;
		cursor: pointer;
		//backdrop-filter: blur(3px); // Apply blur effect
		//-webkit-backdrop-filter: blur(3px); // For Safari support
	}
}
/* 📌 Main Section */
._main {
	display: flex;
	flex-direction: row;
	overflow: hidden;
	height: 100%;
	width: 100%;
}

/* 📌 Mobile: Move `_menu` to Bottom */
@include media-breakpoint-up(md) {
	.wrapper {
		flex-direction: row;
	}

	._menu {
	}

	._main {
		flex-grow: 1; // Takes remaining space
		height: 100%; // Adjust height to fit bottom menu
	}
}
</style>

<script setup>
import Loader from './components/Loader.vue';
import Menu from '@/views/menu/Menu_.vue';
import Modal from '@/components/modal/Modal_.vue';
import Swal from '@/components/swal/Swal_.vue';
import { ref, provide, watch, onMounted, inject, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReadContract } from '@wagmi/vue';
import axios from 'axios';

const $socket = inject('$socket');
const $mitt = inject('$mitt');
const $user = inject('$user');
const $breakpoint = inject('$breakpoint');
const $web3 = inject('$web3');

const $appstate = ref({});
provide('$appstate', $appstate);

const $route = useRoute();
provide('$route', $route);

const $router = useRouter();
provide('$router', $router);

const $menuOpened = ref();
provide('$menuOpened', $menuOpened);

const $modal = ref();
provide('$modal', $modal);

const $swalModal = ref();
provide('$swalModal', $swalModal);

const timestamp = ref();
provide('$timestamp', timestamp);

watch(
	() => $breakpoint.current,
	() => {
		if ($breakpoint.gt('sx')) $menuOpened.value = true;
	},
);

const $isOnline = ref(navigator.onLine);
provide('$isOnline', $isOnline);

onMounted(async () => {
	$socket.on('WALLET_UPDATE', walletUpdateListener);
	window.addEventListener('online', () => ($isOnline.value = navigator.onLine));
	window.addEventListener('offline', () => ($isOnline.value = navigator.onLine));
	setTimeout(function tick() {
		timestamp.value = Math.floor(Date.now().valueOf() / 1000);
		setTimeout(tick, 1000);
	}, 1000);
	//$mitt.emit('modal::open', { id: 'add_contact_handshake' });
	//for (let i = 0; i < 10; i++) {
	//	const u = await $user.generateAccount()
	//	console.log(JSON.stringify({
	//		address: u.address,
	//		publicKey: u.publicKey,
	//	}, null, 2) )
	//}
});

const walletUpdateListener = async (wallet) => {
	if ($user.account?.address && $user.account?.address.toLowerCase() === wallet.toLowerCase()) {
		$mitt.emit('WALLET_UPDATE');
		try {
			if (!$user.account.registeredMetaWallet) refetchMetaStealthPubKey();
		} catch (error) {}
		getUserTransactions();
	}
};

const { data: metaStealthPubKey, refetch: refetchMetaStealthPubKey } = useReadContract({
	address: $web3.bc.registry.address,
	abi: JSON.parse($web3.bc.registry.abijson),
	functionName: 'metaPublicKeys',
	args: computed(() => [$user.account?.address]),
	enabled: computed(() => !!$user.account?.address && !$user.account?.registeredMetaWallet),
});

watch(
	() => metaStealthPubKey.value,
	() => {
		if ($user.account) {
			$user.account.registeredMetaWallet = !!(metaStealthPubKey.value?.length > 2);
			$user.updateVault();
		}
	},
);

const getUserTransactions = async () => {
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
	} catch (error) {
		console.log('getUserTransactions', error);
	}
};
</script>
