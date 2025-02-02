<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-2 ">
            <div class="fw-bold">Your contacts</div>
            <a href="#" @click.prevent="addContact()">
                Add contact    
            </a>
        </div>
           
        <div v-if="$user.account?.contacts?.length"> 
            <ContactItem :contact="contact" v-for="contact in $user.account.contacts" :mode="'edit'"/>            
        </div>             
    </div>
</template>

<script setup>
import ContactItem from './ContactItem.vue';
import { ref, onMounted, watch, inject, computed, nextTick, onUnmounted } from 'vue';
import { ethers, utils, Wallet } from 'ethers';

const $user = inject('$user')
const $timestamp = inject('$timestamp')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $socket = inject('$socket')
const $loader = inject('$loader')
const $modal = inject('$modal')
const $enigma = inject('$enigma')  
const $encryptionManager = inject('$encryptionManager')  
const hasCamera = ref()

onMounted(async () => {  
    
    //test()
    
})

const test = () => {
    const staticString = 'BKP';
    const staticBytes = ethers.utils.toUtf8Bytes(staticString); // Convert 'buckitup' to bytes
    const randomBytes = ethers.utils.randomBytes(10); // Generate 16 random bytes
    const challenge = utils.base58.encode(Buffer.concat([staticBytes, randomBytes])) // .toString('base58') 

    const keys = $enigma.generateKeypair()
    console.log('publicKey', keys.publicKey)

    const wallet = new Wallet($enigma.convertPrivateKeyToHex(keys.privateKey))
    console.log('wallet', wallet.address)

    const sig = $enigma.signChallenge(challenge + 'Roma1', keys.privateKey)
    console.log('sig', sig)
    const publicKey = $enigma.recoverPublicKey(challenge + 'Roma1', sig)
    console.log('publicKey', publicKey)
    console.log($enigma.convertPublicKeyToHex(publicKey))

    const uncpk = utils.computePublicKey('0x' + $enigma.convertPublicKeyToHex(publicKey))
    console.log('uncpk', uncpk)

    console.log('computeAddress', utils.computeAddress( uncpk ))
}

onUnmounted(async () => {
   
})

const addContact = async () => {
    try {
        // Get all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        // Check if there is at least one video input (camera)
        hasCamera.value = devices.some(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error checking camera availability:', error);        
    }

    if (!hasCamera.value) {
        $swal.fire({
            icon: 'error',
            title: 'Camera not available on this device',            
            timer: 30000,
        });
        return 
    }
    console.log($modal)
    $modal.value.open({ id: 'handshake' })
}

</script>
