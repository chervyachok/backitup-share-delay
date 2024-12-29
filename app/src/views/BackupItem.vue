<template>
    <div class="border rounded p-3 mt-2" v-if="backup">
        <div>
            <router-link :to="'/recover?t=' + backup.tag" class="fw-bold">
                {{ backup.tag }}
            </router-link>

            <span class="fw-bold text-danger ms-2" v-if="$route.name !== 'backups' && isOwner">
                Your backup
            </span>

            <span class=" fw-bold ms-2 text-danger" v-if="backup.disabled" >
                Disabled
            </span> 
            
            <a v-if="isOwner && !isUnlocked" href="#"
                @click.prevent="updateBackupDisabled()" class="fw-bold ms-2">
                {{ backup.disabled ? 'Enable' : 'Disable'}}
            </a>

            <a v-if="isOwner" href="#" class="ms-3" @click.prevent="copyToClipboard(backup.tag)">Copy</a>
        </div>

        <div v-if="!isOwner">
            Owner 
            <a :href="$web3.blockExplorer + '/address/' + backup.wallet" target="_blank" rel="noopener noreferrer">
                {{ $filters.addressShort(backup.wallet)  }}
            </a>
        </div>

        <div class="text-danger" style="white-space: pre;" v-if="comment && isOwner">
            {{ comment.trim() }}
        </div>

        <div>Required number of shares to recover secret <span class="fw-bold text-secondary">{{ backup.treshold }}</span> </div>
        
        <BackupShareItem :backup="backup" :share="share" :idx="idx" v-for="(share, idx) in backup.shares" :key="backup.id + share.idx" />

    </div>
</template>

<script setup>
import BackupShareItem from './BackupShareItem.vue';
import { ref, onMounted, watch, inject, computed } from 'vue';
import { decryptWithPrivateKey, cipher } from 'eth-crypto';
import copyToClipboard from '../libs/copyToClipboard';
import { useSignTypedData } from '@wagmi/vue'
import { useRoute } from 'vue-router';
import axios from 'axios';

const $timestamp = inject('$timestamp')
const $account = inject('$account')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $route = useRoute()
const $loader = inject('$loader')

const { backup } = defineProps({
    backup: { type: Object, required: true },
})

onMounted(async () => {
    init()
})

watch(() => backup, () => {
    init()
}, { deep: true })

const comment = ref()

const isOwner = computed(() => {
    return backup.wallet.toLowerCase() == $account.address?.value?.toLowerCase()
})

const isUnlocked = computed(() => {
    return !backup.shares.find(s => !s.unlocked)
})

const init = async () => {
    if (isOwner.value) {      
        try {
            comment.value = await decryptWithPrivateKey(
                $web3.keyPair.spendingKeyPair.privatekey.slice(2),
                cipher.parse(backup.commentEncrypted.slice(2)),
            )            
        } catch (error) {
            console.log('comment', error)
        }  
    }
}

const { signTypedDataAsync } = useSignTypedData()

const updateBackupDisabled = async () => {
    try {
        if (!await $web3.walletClient()) return;

        $loader.show()

        const expire = $timestamp.value + 300
        const signature = await signTypedDataAsync({
            domain: {
                name: "BuckitUpVault",
                version: "1",
                chainId: $web3.mainChainId,
                verifyingContract: $web3.bc.vault.address,
            },
            types: {
                UpdateBackupDisabled: [
                    { name: "tag", type: "string" },
                    { name: "disabled", type: "uint8" },
                    { name: "expire", type: "uint40" },
                ],
            },
            primaryType: 'UpdateBackupDisabled',
            message: {
                tag: backup.tag,
                disabled: backup.disabled ? 0 : 1,
                expire,
            },
        })

        await axios.post(API_URL + '/dispatch/updateBackupDisabled', {
            wallet: $account.address.value,
            chainId: $web3.mainChainId,
            tag: backup.tag,
            disabled: backup.disabled ? 0 : 1,            
            expire,
            signature
        })

        $swal.fire({
            icon: 'success',
            title: 'Update backup',
            footer: 'Please wait for transaction confirmation',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Update backup error',
            footer: error.toString(),
            timer: 30000,
        });
    }
    $loader.hide()
}

</script>