<template>
    <!-- Header -->                                
    <div class="d-flex align-items-center justify-content-between mb-2">                    
        <div class="d-flex align-items-center">
            <div class=" fs-5">
                Add contacts                
            </div>
        </div>

        <div class="d-flex">
            <a href="#" target="_blank" @click.prevent="closeModal()" rel="noopener noreferrer">
                X
            </a>
        </div>
    </div>

    <div class="">

        <template v-if="!scanning && !state.completed">
            <div class="d-flex">
                <img src="/handshake.jpg" alt="" class="w-100">
            </div>

            <div class="text-center mb-3">
                Place the phones facing each other, ensuring the camera of each phone 
                is centered on the other phone's QR code at a distance of approximately 10-20 cm. <br>

                The exact positioning may vary depending on your phone's specifications.<br>

                Once the contact exchange is successful, 
                the screen will turn green, and the phone will vibrate.<br>
            </div>
        </template>
        
        <!-- Display QR Code for Current State -->
        <div class="d-flex justify-content-center qrcode pointer mb-3" :class="{ 'd-none' : !scanning }">
            <div :class="{ '_detected' : state.signature, '_verified' : state.completed }">
                <canvas ref="stateQR"></canvas>
            </div>
        </div>      

        <div class="d-flex justify-content-center mb-3">
            <button class="btn btn-primary btn-lg" @click="toggleScanner">
                <span v-if="!scanning" >Click to start scan</span>
                <span v-if="scanning" >Scanning... Click to stop</span>
            </button>
        </div>

        <div v-if="state.completed">
            <div class="fw-bold">New contact</div>
            <div class="mb-2">
                <label for="exampleFormControlInput1" class="form-label d-flex justify-content-between">
                    <span>Name</span>                         
                    <a :href="$web3.blockExplorer + '/address/' + state.contactAddress" target="_blank" rel="noopener noreferrer">
                        {{ $filters.addressShort(state.contactAddress)  }}
                    </a>
                </label>
                <input                
                    class="form-control"
                    placeholder="Enter your Public name"
                    type="text"                
                    v-model="state.contactDisplayName"  
                />  
            </div>

            <div class="d-flex justify-content-center mb-3">
                <button class="btn btn-primary btn-lg" @click="addContact()">
                    Add
                </button>
            </div>
        </div>
       
        <div v-if="!$isProd">{{ state }}</div>
        <div v-show="scanning">
            <div class="d-flex justify-content-center video mt-3">
                <div id="qr-scanner-video" style="width: 400px; height: 400px;"></div>
            </div>
        </div>
        
    </div>
</template>

<style lang="scss">
.qrcode {
    overflow: hidden;

    div {
        padding: .5rem;
        width: 100% !important;
        max-width: 450px !important;
        background-color: #b6b6b6;
        
        &._detected {
            background-color: #e99f00;
        }

        &._verified {
            background-color: #07ce00;
        }

        canvas {
            width: 100% !important;
            height: auto !important;
        }
    }
}

.video {
    opacity: 0;
    height: 0px;
}
</style>

<script setup>
import { ref, reactive, watch, inject } from 'vue';
import { ethers, utils } from 'ethers';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

const $user = inject('$user')
const $mitt = inject('$mitt')
const $encryptionManager = inject('$encryptionManager') 
const $enigma = inject('$enigma') 

const scanning = ref();
const stateQR = ref(null);

const staticString = 'BKP';
const generateChallenge = () => {
    const staticBytes = ethers.utils.toUtf8Bytes(staticString); // Convert 'buckitup' to bytes
    const randomBytes = ethers.utils.randomBytes(10); // Generate 16 random bytes
    const challengeB58 = utils.base58.encode(Buffer.concat([staticBytes, randomBytes])) // .toString('base58') 
    state.challenge = challengeB58    
    return challengeB58
};

const state = reactive({
    challenge: null,   
    signature: null, 
    verified: 0,
    completed: false,

    contactChallenge: null,
    contactAddress: null,
    contactDisplayName: null,
    contactVerified: 0,
});

const updateQr = async (state, account) => {
    if (stateQR.value && state.challenge) {   
        if (state.contactChallenge && !state.signature) {   
            state.signature = $enigma.signChallenge(state.contactChallenge + account.displayName, account.privateKeyB64)            
            if ("vibrate" in navigator) {
                navigator.vibrate([50]);
            } 
        }

        const displayName = state.signature ? utils.base58.encode(new TextEncoder().encode(account.displayName)) : ''
          
        const msg = `${state.verified}${state.challenge}${state.signature || ''}${displayName}`      

        console.log('msg1', msg, state.verified, state.challenge, state.signature, displayName)
        
        QRCode.toCanvas(stateQR.value, msg);
        
        if (state.verified && state.contactVerified && !state.completed) {
            state.completed = true
            html5QrCode.value.stop().catch(console.error);   
            
            if ("vibrate" in navigator) navigator.vibrate([500, 100, 500, 100, 500]);
            
            await wait(3000)
            scanning.value = false
        }        
    }
};
const readQr = (msg, state) => {
    try {
        // Extract the fixed parts based on known lengths
        const verified = parseInt(msg[0]); // First character (1 char)
        const challenge = msg.slice(1, 19); // Next 18 characters (2nd to 19th char)
        const signature = msg.length > 19 ? msg.slice(19, 107) : null; // 19th to 107th char (if present)
        const displayNameEnc = msg.length > 107 ? msg.slice(107) : null;
        
        console.log('msg2', msg, verified, challenge, signature, displayNameEnc)

        if (challenge) {
            const decodedChallengeBytes = utils.base58.decode(challenge);                
            const contactChallengeDec = new TextDecoder().decode(decodedChallengeBytes);  

            if (challenge && contactChallengeDec.startsWith(staticString)) {
                if (state.contactChallenge !== challenge) {
                    if (state.contactChallenge) {
                        reset()
                    }
                    state.contactChallenge = challenge;   
                }

                if (signature) {        
                    const decodedNameBytes = utils.base58.decode(displayNameEnc);
                    const displayName = new TextDecoder().decode(decodedNameBytes);

                    const publicKey = $enigma.recoverPublicKey(state.challenge + displayName, signature)
                    const uncpk = utils.computePublicKey('0x' + $enigma.convertPublicKeyToHex(publicKey))
                    
                    state.contactAddress = utils.computeAddress(uncpk)                                       
                    state.contactDisplayName = displayName
                    state.verified = 1
                    
                    state.contactVerified = verified
                }                
            }
        }
    } catch (error) {
        console.log('readQr error', error)        
    }
}

// Watch for changes in state and update the QR code
watch(
    () => ({ ...state }),
    async () => {   
        await updateQr(state, $user.account)
    },
    { deep: true }
);

const reset = () => {
    state.verified = 0;
    state.completed = 0;
    state.signature = null;
    state.contactChallenge = null    
    state.contactAddress = null;
    state.contactDisplayName = null;
    state.contactVerified = 0;
}

const html5QrCode = ref()
const toggleScanner = () => {
    if (scanning.value && html5QrCode.value) {
        html5QrCode.value.stop().catch(console.error);
        scanning.value = false
        return
    }
    reset()
    generateChallenge()
    scanning.value = true

    try {
        html5QrCode.value = new Html5Qrcode("qr-scanner-video");
        html5QrCode.value.start(
            { facingMode: "user" },
            { fps: 20, aspectRatio: 1.0, qrbox: { width: 370, height: 370 } },
            async (decodedText) => {            
                readQr(decodedText, state, $user.account)
            },
            (errorMessage) => {
                if (!errorMessage.includes('QR code parse error')) {
                    console.error("Scanning error:", errorMessage);
                }
            }
        );
    } catch (error) {
        console.error("Init Scanning error:", error);
    }
};

function closeModal() {  
    if (scanning.value && html5QrCode.value) {
        html5QrCode.value.stop().catch(console.error);
        scanning.value = false
    }
    $mitt.emit('modal::close')
}

const addContact = async () => {
    if (!$user.account.contacts?.length ) $user.account.contacts = []
    const idx = $user.account.contacts.findIndex(e => e.address === state.contactAddress) 
    if (idx > -1) {
        $user.account.contacts[idx].displayName = state.contactDisplayName       
    } else {
        $user.account.contacts.push({
            displayName: state.contactDisplayName,
            address: state.contactAddress,
        })
        await $encryptionManager.setData(JSON.parse(JSON.stringify($user.account)))
        closeModal() 
    }
};

const wait = function(delay = 500) {
    return new Promise((resolve) =>
        setTimeout(() => {
            resolve();
        }, delay)
    );
}

</script>
