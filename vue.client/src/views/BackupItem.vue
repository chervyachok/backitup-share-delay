<template>
    <div class="border rounded p-3 mt-2" v-if="tag">
         <div>
            <router-link :to="'/recover?t='+tag" class="fw-bold">
                {{ tag }}
            </router-link>  
            <span class="ms-3"v-if="$route.name !== 'recover'">(click to go to recover)</span>          
         </div>   
         <div v-if="backupData">
            <div>
                Owner of backup:
                <a :href="$walletClient.chain?.blockExplorers.default.url + '/address/' + backupData.owner" target="_blank" rel="noopener noreferrer" v-if="$walletClient?.chain">
                    {{ backupData.owner }}
                </a>
                <span v-else>{{ backupData.owner }}</span>

                <span class="fw-bold text-danger" v-if="$route.name !== 'backups' && $account.address?.value && backupData.owner.toLowerCase() == $account.address?.value?.toLowerCase()">
                    You
                </span>
            </div>
            <div>Backup restore enabled: {{ backupData.disabled ? 'No' : 'Yes' }} <a v-if="!backupDataIn" href="#" @click.prevent="toggleEnabled()" class="fw-bold">{{ backupData.disabled ? 'Enable' : 'Disable' }}</a></div>
            <div>Required number of shares to restore secret: {{ backupData.treshold }}</div>
            <div v-for="( portion, idx ) in backupData.portions">
                <div class="fw-bold" >Share #{{ idx + 1 }} <span class="fw-bold text-danger"v-if="portion.stealthAddress?.toLowerCase() === stealthAddr?.toLowerCase()">- This is your share</span> </div>
                <div>
                    Trusted stealth: 
                    <a :href="$walletClient.chain?.blockExplorers.default.url + '/address/' + portion.stealthAddress" target="_blank" rel="noopener noreferrer" v-if="$walletClient?.chain">
                        {{ portion.stealthAddress }}
                    </a>
                    <span v-else>{{ portion.stealthAddress }}</span>
                </div>
                <div>Share restore enabled: {{ portion.disabled ? 'No' : 'Yes' }} <a v-if="!backupDataIn" href="#" @click.prevent="toggleShareEnabled(idx)" class="fw-bold">{{ portion.disabled ? 'Enable' : 'Disable' }}</a></div>
                <div >
                    Restore delay (seconds): 
                    <template v-if="!backupDataIn">
                        <input type="number" v-model="portionDelay[idx]">  <a v-if="portionDelay[idx] != portion.delay" href="#" @click.prevent="setShareDelay(idx)" class="fw-bold">Set</a>
                    </template>
                    <template v-else>
                        {{ portion.delay }}
                    </template>
                </div>
                <div v-if="portion.request > 0" class="text-danger">                    
                    Restore requested / Time left to unlock: {{ Math.max(0, (portion.request + portion.delay) - $timestamp) }}
                </div>
            </div>

            <div v-if="updateTxHash && updateTxResult.data">
                <div>
                    Tx: <a :href="$walletClient.chain?.blockExplorers.default.url + '/tx/' + updateTxHash" target="_blank" rel="noopener noreferrer">{{ updateTxHash }}</a>
                </div>
                <div class="mb-3 fw-bold" v-if="updateTxResult.status">
                    {{ updateTxResult.status }}
                </div>                 
            </div>
         </div>
    </div>   
  </template>
  
<script setup>    
import { ref, onMounted, watch, inject, computed } from 'vue';    
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from '@wagmi/vue'
import { getTransactionCount } from '@wagmi/core'
import { bc, mainChainId, wagmiAdapter } from '../config/index'
import { useRoute } from 'vue-router';

const $timestamp = inject('$timestamp')
const $account = inject('$account')
const $walletClient = inject('$walletClient')
const $route = useRoute()

const portionDelay = ref([])

const { data: backupData, isPending: backupDataPending, refetch: getBackup } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getBackup',
    args: computed(() => [tag]),
    enabled: computed(() => !!(tag && !backupDataIn))
});
const { tag, backupDataIn, stealthAddr } = defineProps({
    tag: { typ: String, required: true },
    backupDataIn: { typ: Object },
    stealthAddr: { typ: String },
})

onMounted(async () => {
    console.log(tag)
    if (!backupDataIn) {
        await getBackup()
        init()
    }
    
})

// 0x242B39E000A1F6B509DAe48965D27eb93464F970
// 0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38
// 0x1df2674903208dfa0590B7664Fa3B25da5009194
const { writeContractAsync: updateBackup } = useWriteContract()    
const updateTxHash = ref()
const updateTxResult = useWaitForTransactionReceipt({
    hash: computed(() => updateTxHash.value), 
    enabled: computed(() => !!updateTxHash.value)
})

watch(() => backupData.value, async (newResult) => {
    console.log('watch backupData', newResult )
    init()  
}, { deep: true })

const init = () => {
    if (backupData.value) {
        portionDelay.value = []
        for (let i = 0; i < backupData.value.portions.length; i++) {
            const portion = backupData.value.portions[i];
            console.log('portion d',  portion.delay  )
            portionDelay.value.push(portion.delay)         
        }
    }  
}

watch(() => updateTxResult, async (newResult) => {
    console.log('watch updateTxResult', newResult )
    await getBackup()
}, { deep: true })

const toggleEnabled = async () => {
    update({
        disabled: backupData.value.disabled ? 0 : 1, 
        idx: backupData.value.portions.length, 
        delay: 0, 
        disabledIdx: 0
    })   
}

const toggleShareEnabled = async (idx) => {
    update({
        disabled: backupData.value.disabled, 
        idx, 
        delay: backupData.value.portions[idx].delay, 
        disabledIdx: backupData.value.portions[idx].disabled ? 0 : 1
    })  
}

const setShareDelay = async (idx) => {
    update({
        disabled: backupData.value.disabled, 
        idx, 
        delay: portionDelay.value[idx], 
        disabledIdx: backupData.value.portions[idx].disabled
    })
}
const { signTypedDataAsync } = useSignTypedData()
const update = async (args) => {
    try {
        console.log('args', args, $walletClient.value)
        
        if (!$walletClient.value) return;

        const currNonce = await getTransactionCount(wagmiAdapter.wagmiConfig, {
            address: $account.address.value,
        })
        const nonce = currNonce + 1        
        const deadline = $timestamp.value + 300                        
        const signature = await signTypedDataAsync({
            domain: {
                name: "BuckitUpVault",
                version: "1",
                chainId: mainChainId,
                verifyingContract: bc.vault.address,
            },
            types: {
                UpdateBackup: [
                    { name: "tag", type: "string" },
                    { name: "disabled", type: "uint8" },
                    { name: "idx", type: "uint8" },
                    { name: "delay", type: "uint40" },
                    { name: "disabledIdx", type: "uint8" },
                    { name: "deadline", type: "uint40" },
                    { name: "nonce", type: "uint40" },
                ],
            },
            primaryType: 'UpdateBackup',
            message: {
                tag,
                ...args,
                deadline,
                nonce
            },
        })

        console.log('signature', signature)


        const tx = await updateBackup({
            address: bc.vault.address,
            abi: JSON.parse(bc.vault.abijson),
            functionName: 'updateBackup',
            args: [ tag, args.disabled, args.idx, args.delay, args.disabledIdx, deadline, nonce, signature ]
        })
        updateTxHash.value = tx
    } catch (error) {
        console.log(error)
    }    
}

function toBase62(hexString) {
    // Remove the "0x" prefix if present
    const hex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
    const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // Convert hex to BigInt
    const value = BigInt("0x" + hex);
    // Encode BigInt to Base62
    let base62 = "";
    let current = value;
    while (current > 0) {
        const remainder = current % 62n;
        base62 = BASE62_CHARS[Number(remainder)] + base62;
        current = current / 62n;
    }
    return base62 || "0"; // Return "0" if the input value was 0
}
  
  </script>
  
  