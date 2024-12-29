<template>
    <div class="border-top mt-2 pt-2">
        <div class="fw-bold ">
            Share #{{ idx + 1 }}    
            
            <span class="text-danger fw-bold ms-2" v-if="!share.unlocked && share.disabled">
                Disabled
            </span> 
            
            <a v-if="isOwner && !share.unlocked" href="#"
                @click.prevent="updateShareDisabled()" class="fw-bold ms-2">
                {{ share.disabled ? 'Enable' : 'Disable'}}
            </a> 
            
            <span v-if="share.unlocked" class="text-danger fw-bold ms-2">
                Unlocked   
            </span>
            
            <a v-if="!isRequestRequired && isRocoverable" href="#" @click.prevent="recover()" class="fw-bold ms-2">
                Recover
            </a>

            <a v-if="isRequestRequired" href="#" @click.prevent="requestRecover()" class="fw-bold ms-2">
                Request recover
            </a>        

            <span class="fw-bold text-danger ms-2" v-if="share.stealthAddress?.toLowerCase() === stealthAddr"> 
                Your share
            </span> 

        </div>

        <div v-if="message">
            <span class="text-danger">
                {{ message }}
            </span>
        </div>

        <div class="d-flex align-items-center">
            <template v-if="share.delay && !share.unlocked ">
                <div>Recover delay</div>
            
                <span class="fw-bold text-secondary ms-2">{{ $filters.secondsToHMS(share.delay)  }}</span>
            </template>
            
            <template v-if="isOwner && !share.unlocked">
                <input class="ms-3" type="number" v-model="shareDelay" style="max-width: 5rem;"> 
                <a v-if="shareDelay != share.delay" href="#" @click.prevent="updateShareDelay(share.idx)"
                    class="fw-bold ms-2">
                    Update
                </a>
            </template>
        </div>

        <div v-if="share.request && !share.unlocked" class="text-danger fw-bold">
            Requested {{ $date.unix(share.request).format('DD MMM HH:mm') }}
        </div>
        
        <div v-if="share.request && timeLeft && !share.unlocked" class="text-danger fw-bold">
            Unlocks {{ $date.unix(share.request + share.delay).from() }}
        </div>

            
        
        <div v-if="false">
            Trusted stealth:
            <a :href="$web3.blockExplorer + '/address/' + share.stealthAddress" target="_blank"
                rel="noopener noreferrer">
                {{ $filters.addressShort(share.stealthAddress)  }}
            </a>
        </div>
        
        <div class="mb-3" v-if="secretText && privateKey">
            <div>Your recovered share</div>            
            <div>
                <span class="fw-bold text-break text-secondary">
                    {{ secretText }}
                </span>
                <a href="#" class="ms-3" @click.prevent="copyToClipboard(secretText)">Copy</a>
            </div>
        </div>
    </div>    
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import { useReadContract, useSignTypedData } from '@wagmi/vue'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem';
import { decryptToString } from "@lit-protocol/encryption"
import { cipher, decryptWithPrivateKey} from 'eth-crypto';
import copyToClipboard from '../libs/copyToClipboard';
import { Wallet } from 'ethers';
import axios from 'axios';

const $timestamp = inject('$timestamp')
const $account = inject('$account')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $loader = inject('$loader')

const shareDelay = ref()
const secretText = ref()

const { backup, share, idx } = defineProps({
    backup: { type: Object, required: true },
    share: { type: Object, required: true },
    idx: { type: Number, required: true },
})

onMounted(async () => {
    init()
})

watch(() => backup, async (newResult) => {
    console.log('watch backupData', newResult)
    init()
}, { deep: true })

const message = ref()
const privateKey = ref()
const stealthAddr = ref()

const init = async () => {    
    privateKey.value = null
    shareDelay.value = share.delay       
    message.value = null           
    stealthAddr.value = $web3.bukitupClient.getStealthAddressFromEphemeral($web3.keyPair.spendingKeyPair.privatekey, share.ephemeralPubKey).toLowerCase();    
    if (stealthAddr.value === share.stealthAddress.toLowerCase()) {
        privateKey.value = $web3.bukitupClient.generateStealthPrivateKey($web3.keyPair.spendingKeyPair.privatekey, share.ephemeralPubKey);  
        try {
            message.value = await decryptWithPrivateKey(
                privateKey.value.slice(2),
                cipher.parse(share.messageEncrypted.slice(2)),
            )
            console.log('message', message.value)
        } catch (error) {
            console.log('message', error)
        }                
    }
}

const isRequestRequired = computed(() => {
    if (!privateKey.value) return false;
    if (share.request) return false;    
    if (backup.disabled) return true
    if (share.disabled) return true
    if (share.delay) return true    
})

const isRocoverable = computed(() => {
    if (!privateKey.value) return false;
    if (backup.disabled) return false
    if (share.disabled) return false
    if (share.unlocked) return true
})

const isOwner = computed(() => {
    return backup.wallet.toLowerCase() == $account.address?.value?.toLowerCase()
})

const timeLeft = computed(() => {
    if (share.request == 0) return 0
    return Math.max(0, (share.request + share.delay - $timestamp.value)) 
})

const { signTypedDataAsync } = useSignTypedData()

const updateShareDisabled = async () => {
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
                UpdateShareDisabled: [
                    { name: "tag", type: "string" },
                    { name: "idx", type: "uint8" },
                    { name: "disabled", type: "uint8" },
                    { name: "expire", type: "uint40" },
                ],
            },
            primaryType: 'UpdateShareDisabled',
            message: {
                tag: backup.tag,
                idx: share.idx,
                disabled: share.disabled ? 0 : 1,
                expire,
            },
        })

        await axios.post(API_URL + '/dispatch/updateShareDisabled', {
            wallet: $account.address.value,
            chainId: $web3.mainChainId,
            tag: backup.tag,
            idx: share.idx,
            disabled: share.disabled ? 0 : 1,            
            expire,
            signature
        })

        $swal.fire({
            icon: 'success',
            title: 'Update backup share',
            footer: 'Please wait for transaction confirmation',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Update backup share error',
            footer: error.toString(),
            timer: 30000,
        });
    }
    $loader.hide()
}

const updateShareDelay = async () => {
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
                UpdateShareDelay: [
                    { name: "tag", type: "string" },
                    { name: "idx", type: "uint8" },
                    { name: "delay", type: "uint40" },
                    { name: "expire", type: "uint40" },
                ],
            },
            primaryType: 'UpdateShareDelay',
            message: {
                tag: backup.tag,
                idx: share.idx,
                delay: shareDelay.value,
                expire,
            },
        })

        await axios.post(API_URL + '/dispatch/updateShareDelay', {
            wallet: $account.address.value,
            chainId: $web3.mainChainId,
            tag: backup.tag,
            idx: share.idx,
            delay: shareDelay.value,            
            expire,
            signature
        })

        $swal.fire({
            icon: 'success',
            title: 'Update backup share',
            footer: 'Please wait for transaction confirmation',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Update backup share error',
            footer: error.toString(),
            timer: 30000,
        });
    }
    $loader.hide()
}

const requestRecover = async () => {    
    try {
        const res = await $swal.fire({
			icon: 'info',
			title: 'Request recover',
			showConfirmButton: true,
			showCancelButton: true,
			confirmButtonText: 'Yes' ,
			cancelButtonText: 'Cancel',
		});
		if (!res.isConfirmed) return		

        $loader.show()

        const account = privateKeyToAccount(privateKey.value);        
        const walletClient = createWalletClient({
            chain: $web3.mainChain,
            transport: http(),
            account,
        });
        
        const expire = $timestamp.value + 300           
        const signature = await walletClient.signTypedData({
            domain: {
                name: "BuckitUpVault",
                version: "1",
                chainId: $web3.mainChainId,
                verifyingContract: $web3.bc.vault.address,
            },
            types: {
                RequestRecover: [
                    { name: "tag", type: "string" },                    
                    { name: "idx", type: "uint8" },                    
                    { name: "expire", type: "uint40" },
                ],
            },
            primaryType: 'RequestRecover',
            message: {
                tag: backup.tag,
                idx: share.idx,
                expire,
            },
        })
      
        await axios.post(API_URL + '/dispatch/requestRecover', {
            wallet: $account.address.value, 
            chainId: $web3.mainChainId,
            tag: backup.tag, 
            idx: share.idx,
            expire: expire,
            signature: signature 
        })
       
        $swal.fire({
            icon: 'success',
            title:  'Recover request',
            footer: 'Please wait for transaction confirmation',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Recover request error',
            footer: error.toString(),
            timer: 30000,
        });
    }
    $loader.hide()
}

const recover = async () => {
    try {
        $loader.show()

        const checkAccess = await getGranted()
        console.log('grantedData111', checkAccess, checkAccess.data)
        if (!checkAccess.data) {
            $loader.hide()
            throw new Error("Not granted");            
        }
        
        const signer = new Wallet(privateKey.value)
        const sessionSigs = await $web3.getSessionSigs(signer)
        const unifiedAccessControlConditions = $web3.getAccessControlConditions(backup.tag, share.idx) 
        const ciphertext = Buffer.from(share.shareEncrypted.slice(2), "hex")
        const decodedShare = await decryptToString(
            {
                unifiedAccessControlConditions,
                chain: 'sepolia',
                ciphertext: ciphertext.toString("base64"), 
                dataToEncryptHash: share.shareEncryptedHash.slice(2), 
                sessionSigs,
            },
            $web3.litClient,
        )
        secretText.value = await $web3.bukitupClient.decryptShare(decodedShare, privateKey.value);

        $swal.fire({
            icon: 'success',
            title:  'Recovered',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Recover error',
            footer: error.toString(),
            timer: 30000,
        });
    }
    $loader.hide()
}

const { refetch: getGranted } = useReadContract({
    address: $web3.bc.vault.address,
    abi: JSON.parse($web3.bc.vault.abijson),
    functionName: 'granted',
    args: computed(() => [backup.tag, share.idx, stealthAddr.value]),  
    enabled: false  
});

</script>