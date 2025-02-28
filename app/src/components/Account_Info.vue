<template>
	<div class=" " v-if="accountIn && account">
		<div class="_avatar">
			<div class="_wrap">
				<div class="_img_wrap">
					<Avatar :name="account.address" variant="bauhaus" v-if="account.address && !account?.avatar && !accountIn?.avatar" />
					<img :src="account.avatar?.dataUrl || mediaUrl(accountIn?.avatar)" v-if="account?.avatar || accountIn?.avatar" />
				</div>

				<a href="#" class="btn btn-dark rounded-pill p-2" @click.prevent="$refs.avatarImageInput.click()">
					<i class="bg-white" :class="[account.avatar || account.avatar?.dataUrl ? '_icon_edit' : '_icon_plus']"></i>
				</a>
				<input class="_hidden" ref="avatarImageInput" type="file" :accept="ALLOWED_IMAGE_TYPES.join(',')" @change="handleImage($event)" />
			</div>
		</div>

		<div class="_input_block mt-3">
			<div class="mb-2">
				<label for="name" class="form-label">
					Name
					<span class="small ms-1 opacity-50" v-if="account.name && accountIn?.name !== account.name">({{ maxNameLength - account.name.length }} left)</span>
					<span class="small ms-1 opacity-50" v-if="!account.name">({{ maxNameLength }} characters max)</span>
				</label>
				<input class="form-control" id="name" placeholder="any name you want (visible only to you)" type="text" rows="1" v-model="account.name" :class="{ 'fw-bold': account.name }" />
			</div>

			<div class="mb-2">
				<label for="notes" class="form-label">
					Notes
					<span class="small ms-1 opacity-50" v-if="account.notes && accountIn?.notes !== account.notes">({{ maxNotesLength - account.notes.length }} left)</span>
					<span class="small ms-1 opacity-50" v-if="!account.notes">({{ maxNotesLength }} characters max)</span>
				</label>
				<textarea id="notes" class="form-control" placeholder="private note (visible only to you)" type="text" rows="2" v-model="account.notes"></textarea>
			</div>

			<div class="mb-2" v-if="account.publicKey && $route.name !== 'login'">
				<label class="form-label d-flex justify-content-between">
					<div>Public key</div>
					<div class="d-flex align-items-center">
						<div>
							{{ $filters.txHashShort(account.publicKey) }}
						</div>
						<i class="_icon_copy bg-black ms-2 _pointer" @click="copyPublicKey()"></i>
					</div>
				</label>
			</div>

			<div class="mb-2" v-if="account.address && !$isProd">
				<label class="form-label d-flex justify-content-between">
					<div>Wallet address</div>
					<div class="d-flex align-items-center">
						<a :href="$web3.blockExplorer + '/address/' + account.address" target="_blank" rel="noopener noreferrer">
							{{ $filters.addressShort(account.address) }}
						</a>
						<i class="_icon_copy bg-black ms-2 _pointer" @click="copyToClipboard(account.address)"></i>
					</div>
				</label>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/scss/variables.scss';

._avatar {
	display: flex;
	justify-content: center;
	width: 100%;
	._wrap {
		position: relative;
		._img_wrap {
			width: 14rem;
			height: 14rem;
			border-radius: 50%;
			border: 5px solid $white;
			overflow: hidden;
			img,
			svg {
				height: 100%;
				width: 100%;
				object-fit: cover;
			}
		}
		a {
			position: absolute;
			bottom: 1rem;
			right: 5rem;
			transform: translateX(4rem);
		}
	}
}
</style>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import imageResize from '@/utils/imageResize';
import copyToClipboard from '@/utils/copyToClipboard';
import errorMessage from '@/utils/errorMessage';
import Avatar from 'vue-boring-avatars';
import { mediaUrl } from '@/utils/mediaUrl';

const $swal = inject('$swal');
const $loader = inject('$loader');
const $user = inject('$user');
const $mitt = inject('$mitt');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const maxNameLength = 30;
const maxNotesLength = 300;
const account = ref();

const emit = defineEmits(['update']);

const { accountIn } = defineProps({
	accountIn: { type: Object },
});

onMounted(async () => {
	//console.log('accountIn', accountIn);
	account.value = JSON.parse(JSON.stringify(accountIn));

	watch(
		() => accountIn?.address,
		(newVal) => {
			if (newVal) account.value = JSON.parse(JSON.stringify(accountIn));
		},
	);

	watch(
		() => account.value.name,
		(newVal) => {
			if (newVal && newVal.length > maxNameLength) account.value.name = newVal.slice(0, maxNameLength);
			emit('update', account.value);
		},
	);

	watch(
		() => account.value.notes,
		(newVal) => {
			if (newVal && newVal.length > maxNotesLength) account.value.notes = newVal.slice(0, maxNotesLength);
			emit('update', account.value);
		},
	);

	watch(
		() => account.value.avatar,
		() => {
			emit('update', account.value);
		},
	);
});

const copyPublicKey = () => {
	if (account.value.address === $user.account.address) {
		$mitt.emit('swal::open', { id: 'copy_public_key' });
	} else {
		copyToClipboard(account.value.publicKey);
	}
};

const reset = () => {
	account.value = JSON.parse(JSON.stringify(accountIn));
};

const handleImage = async (event) => {
	event.preventDefault();
	$loader.show();
	try {
		const file = Array.from(event.target.files)[0];
		if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw Error(`"${file.name}" not supported media format`);
		// Load the image
		var reader = new FileReader();
		reader.onload = function (readerEvent) {
			var image = new Image();
			image.onload = async function () {
				account.value.avatar = imageResize(image, 300, 0.8);
				$loader.hide();
				emit('update', account.value);
			};
			image.src = readerEvent.target.result;
		};
		reader.readAsDataURL(file);
	} catch (error) {
		console.log(error);
		$swal.fire({
			icon: 'error',
			title: 'Avatar upload',
			footer: errorMessage(error),
			timer: 15000,
		});
		$loader.hide();
	}

	event.target.value = '';
};

defineExpose({ reset });
</script>
