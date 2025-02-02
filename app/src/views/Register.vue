<template>
    <div class="border rounded p-3 mb-2">                                       
        <div class="mb-2" v-if="metaStealthPubKey?.length <= 2">
            <div class="fw-bold">Register Meta address</div>            
        </div>
                  
        <div class="mb-1" v-if="false && metaStealthPubKey?.length > 2">
            <span class="fw-bold">
                You registered Meta Stealth Key:
            </span>
            <span class="ms-3"> {{ metaStealthPubKey.substring(0, 16) }}...{{ metaStealthPubKey.substring(metaStealthPubKey.length - 16, metaStealthPubKey.length)}}</span>
            
        </div>
        
        <div class="row gx-2" v-if=" metaStealthPubKey?.length <= 2">
            
            <div class="col-md-3">
                <button class="btn btn-primary mb-2 me-2" @click="register()" v-if="metaStealthPubKey?.length <= 2">
                    Register
                </button>
            </div>
        </div>

        <div class="d-flex justify-content-between small" v-if="metaStealthPubKey?.length > 2">
            <div>
                <div class="fw-bold">
                    Join to <a :href="`https://t.me/${tmBot}`" target="_blank" rel="noopener noreferrer">@{{ tmBot }}</a> and receive instant notifications 
                </div>            
            </div>
            
        </div>
               
        <Transactions v-if="$user.account?.address" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed, onUnmounted } from 'vue';
import { useReadContract, useSignTypedData } from '@wagmi/vue'
import Transactions from "./Transactions.vue"
import axios from 'axios';

const $user = inject('$user')
const $timestamp = inject('$timestamp')

const $mitt = inject('$mitt')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $loader = inject('$loader')

const tmBot = TM_BOT

const { data: metaStealthPubKey, refetch: refetchMetaStealthPubKey } = useReadContract({
    address: $web3.bc.registry.address,
    abi: JSON.parse($web3.bc.registry.abijson),
    functionName: 'stealthMetaAddresses',
    args: computed(() => [$user.account?.address]),
    enabled: computed(() => !!$user.account?.address)
});

watch(() => metaStealthPubKey.value, () => {
    console.log('REGISTERED!', !!(metaStealthPubKey.value?.length > 2))
    $web3.setRegisterred(!!(metaStealthPubKey.value?.length > 2))
})

onMounted(async () => {
   $mitt.on('WALLET_UPDATE', update)
})

onUnmounted(async () => {
   $mitt.off('WALLET_UPDATE', update)
})

const update = async () => {
    refetchMetaStealthPubKey()
}

const pin = ref('1234') 
const pinDirty = ref(true)
watch(() => pin.value, () => {
    pinDirty.value = true
})

const register = async () => {
    try {
        $loader.show()
        
        const expire = $timestamp.value + 300000 
        const signature = await $web3.signTypedData($user.account.privateKey, {
            domain: {
                name: "BuckitUpRegistry",
                version: "1",
                chainId: $web3.mainChainId,
                verifyingContract: $web3.bc.registry.address,
            },
            types: {
                RegisterWithSign: [
                    { name: "owner", type: "address" },                   
                    { name: "stealthMetaAddress", type: "bytes" },
                    { name: "expire", type: "uint40" },
                ],
            },
            primaryType: 'RegisterWithSign',
            message: {
                owner: $user.account.address,
                stealthMetaAddress: $user.account.metaPublicKey,
                expire
            },
        })
        
	    await axios.post(API_URL + '/dispatch/register', {
            owner: $user.account.address, 
            chainId: $web3.mainChainId,
            stealthMetaAddress: $user.account.metaPublicKey, 
            expire: expire,
            signature: signature 
        })  
        
        $swal.fire({
            icon: 'success',
            title:  'Register',
            footer: 'Please wait for transaction confirmation',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Register error',
            footer: error.toString(),
            timer: 30000,
        });
    }  
    $loader.hide()
}

</script>