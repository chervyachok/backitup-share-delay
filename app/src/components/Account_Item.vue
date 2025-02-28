<template>
	<div class="_account">
		<div class="_avatar">
			<Avatar :name="account.address" variant="bauhaus" v-if="account.address && !account?.avatar" />
			<img v-if="account?.avatar" :src="mediaUrl(account.avatar, defaultAvatar)" @error="(event) => (event.target.src = defaultAvatar)" />
		</div>
		<div class="_info">
			<div class="d-flex">
				<div class="_name" v-if="account.name">
					<span v-if="account.highlightedName" v-html="account.highlightedName"></span>
					<span v-else>{{ account.name }}</span>
				</div>
				<div class="_pubk">[{{ account.address.slice(-4) }}]</div>
			</div>

			<div class="_notes" v-if="account.notes">
				<span v-if="account.highlightedNotes" v-html="account.highlightedNotes"></span>
				<span v-else>{{ account.notes }}</span>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/scss/variables.scss';
@import '@/scss/breakpoints.scss';

._account {
	display: flex;
	align-items: center;
	width: 100%;
	._avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 2.5rem;
		width: 2.5rem;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 0.6rem;
		flex-shrink: 0; // Prevents shrinking when text overflows
		img,
		svg {
			height: 100%;
			width: 100%;
			border-radius: 30rem;
			object-fit: cover;
		}
	}
	._info {
		flex-grow: 1; // Allows it to expand within the container
		min-width: 0; // Ensures text truncation works
		._name {
			font-weight: 500;
			font-size: 0.9rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 100%; // Ensures truncation works properly
			display: block; // Ensures proper alignment
		}
		._pubk {
			font-weight: 400;
			font-size: 0.9rem;
			color: $grey_dark;
			margin-left: 0.4rem;
		}
		._notes {
			color: $grey_dark2;
			font-size: 0.85rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 100%; // Ensures truncation works properly
			display: block; // Ensures proper alignment
		}
	}
}
</style>

<script setup>
import { mediaUrl } from '@/utils/mediaUrl';
import Avatar from 'vue-boring-avatars';

const defaultAvatar = '/img/profile.webp';

const { account } = defineProps({
	account: { type: Object, required: true },
});
</script>
