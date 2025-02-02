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
            <div :class="{ '_detected' : state.contactAddress, '_verified' : state.completed }">
                <canvas ref="stateQR"></canvas>
            </div>
        </div>      

        <div class="d-flex justify-content-center mb-3">
            <button class="btn btn-primary btn-lg" @click="toggleScanner">
                <span v-if="!scanning" >Click to start scan</span>
                <span v-if="scanning" >Scanning... Click to stop</span>
            </button>
        </div>

        <div v-if="state.completed && !scanning">
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
import { ref, reactive, watch, inject, onMounted, onBeforeMount, onUnmounted, computed } from 'vue';
import { ethers, utils } from 'ethers';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

// Reactive data
const scanning = ref();
const challenges = []

// QR Code and Scanner Refs
const stateQR = ref(null);
const $timestamp = inject('$timestamp')
const $user = inject('$user')
const $swal = inject('$swal')
const $mitt = inject('$mitt')
const $encryptionManager = inject('$encryptionManager') 

const staticString = 'BKP';
const generateChallenge = () => {
    const staticBytes = ethers.utils.toUtf8Bytes(staticString); // Convert 'buckitup' to bytes
    const randomBytes = ethers.utils.randomBytes(10); // Generate 16 random bytes
    const challenge = utils.base58.encode(Buffer.concat([staticBytes, randomBytes])) // .toString('base58') 
    state.challenge = challenge

    challenges.push(challenge)
    if (challenges.length >= 30) challenges.shift()
    return challenge
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

let mounted
onMounted(async () => {    
    mounted = true    
})

onUnmounted(() => {
    mounted = false
})

//let counter = 0
//watch(() => $timestamp.value, () => {
//    counter++
//    if (counter > 15) {
//        //generateChallenge()
//        counter = 0
//    }
//})

const updateQr = async (state, account) => {
    if (stateQR.value && state.challenge) {   
        if (state.contactChallenge && !state.signature) {
            const wallet  = new ethers.Wallet(account.privateKey);
            const signature = await wallet.signMessage(state.challenge + state.contactChallenge + account.displayName);
            state.signature = utils.base58.encode(new TextEncoder().encode(signature)) 
            if ("vibrate" in navigator) {
                navigator.vibrate([50]);
            } 
        }
          
        const msg = `${state.challenge}:${state.contactChallenge || ''}:${state.signature || ''}:${state.verified}:${state.signature ? utils.base58.encode(new TextEncoder().encode(account.displayName)) : ''}`      
        //console.log('msg', msg)
        await QRCode.toCanvas(stateQR.value, msg);
        
        if (state.verified && state.contactVerified && !state.completed) {
            state.completed = true
            html5QrCode.value.stop().catch(console.error);            
            await wait(500)
            scanning.value = false
            
            console.log('Contact verified!!!!!!!!!!!!', state.contactDisplayName, state.contactAddress)
            if ("vibrate" in navigator) {
                navigator.vibrate([500, 100, 500, 100, 500]);
            }  
        }
        return msg
    }
};
const readQr = (decodedText, state) => {
    try {
        const arr = decodedText.split(':')        
        const challenge = arr[0].length ? arr[0] : null   
        const myChallenge = arr[1].length ? arr[1] : null
        const signatureEnc = arr[2].length ? arr[2] : null
        const verified = parseInt(arr[3])
        const displayNameEnc = arr[4].length ? arr[4] : null
      
        if (challenge) {
            const contactChallenge = challenge
            const decodedChallengeBytes = utils.base58.decode(challenge);                
            const contactChallengeDec = new TextDecoder().decode(decodedChallengeBytes);  

            if (contactChallenge && contactChallenge.length < 50 && contactChallengeDec.startsWith(staticString)) {
                if (state.contactChallenge !== contactChallenge) {
                    if (state.contactChallenge) {
                        reset()
                    }
                    state.contactChallenge = contactChallenge;                      
                }
                if (myChallenge === state.challenge && signatureEnc) {
                    const decodedSigBytes = utils.base58.decode(signatureEnc);                
                    const signature = new TextDecoder().decode(decodedSigBytes);
                    const decodedNameBytes = utils.base58.decode(displayNameEnc);                
                    const displayName = new TextDecoder().decode(decodedNameBytes);
                    state.contactAddress = ethers.utils.verifyMessage(challenge + myChallenge + displayName, signature).toLowerCase()
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

const updateQr2 = async (state, account) => {
    if (stateQR.value && state.challenge) {            
        let data = ''
               
        if (state.step == 0) data = state.challenge              
        
        if (state.contactChallenge) {
            const wallet  = new ethers.Wallet(account.privateKey);

            if (state.step == 1) data = await wallet.signMessage(state.contactChallenge); 
            if (state.step == 2) data = account.publicKey
            if (state.step == 3) data = account.metaPublicKey   
            if (state.step == 4) data = account.displayName
            if (state.step == 5) data = await wallet.signMessage(state.contactChallenge + account.publicKey + account.metaPublicKey + account.displayName);  
            
        }
                       
        if (state.step > 0) {
            data = utils.base58.encode(new TextEncoder().encode(data))
        }
        const msg = `${state.step}:${state.verified}:${data}`          
        
        await QRCode.toCanvas(stateQR.value, msg);

        let log = `${logs.value.length + 1} ms ${state.step} cs ${state.contactStep} mv ${state.verified} cv ${state.verified}`
        if ("vibrate" in navigator) {
                navigator.vibrate([50, 100, 50]);
            }

        if (state.step === state.contactStep && state.verified && state.contactVerified) {
            
            state.step ++
            state.verified = 0
            state.contactVerified = 0
            log += ' ++'
            if (state.step >= 6) {
                state.completed = true
                toggleScanner()
                console.log('Contact verified!!!!!!!!!!!!')
                if ("vibrate" in navigator) {
                    navigator.vibrate([500, 100, 500]);
                }  
            }
        }



        logs.value.push(log)
        console.log('log', log)

        return msg
    }
};

const readQr2 = (decodedText, state, account) => {
    try {
        const arr = decodedText.split(':')
        
        const step = arr[0].length ? parseInt(arr[0]) : null   
        const verified = parseInt(arr[1])
        const dataEnc = arr[2].length ? arr[2] : null

        console.log('readQr', step, verified, dataEnc)
        if (step == 0) {
            const contactChallenge = dataEnc
            const decodedChallengeBytes = utils.base58.decode(dataEnc);                
            const contactChallengeDec = new TextDecoder().decode(decodedChallengeBytes);  

            if (!contactChallenge || contactChallenge.length > 50 || !contactChallengeDec.startsWith(staticString)) {
                throw new Error('bad challenge')
            }
            
            if (state.contactChallenge !== contactChallenge) {
                if (state.contactChallenge) {
                    reset()
                }
                state.contactChallenge = contactChallenge;  
                state.verified = 1  
                state.contactStep = step 
            } 

            if (!state.contactVerified && state.step === state.contactStep && step >= state.contactStep) state.contactVerified = verified
        }

        if (step > 0) {
            const decodedDataBytes = utils.base58.decode(dataEnc);                
            const contactData = new TextDecoder().decode(decodedDataBytes); 

            if (step == 1) {
                if (!state.verified) {
                    state.contactAddress = ethers.utils.verifyMessage(state.challenge, contactData).toLowerCase()
                    console.log('recoverPublicKey', utils.recoverPublicKey(utils.hashMessage(state.challenge), contactData)) 
                    state.verified = 1
                    state.contactStep = step  
                }
                
                if (!state.contactVerified && state.step === state.contactStep && step >= state.contactStep) state.contactVerified = verified
            } 

            if (step == 2) {
                if (!state.verified) {
                    state.contactPublicKey = contactData 
                    console.log('recoverPublicKey', state.contactPublicKey)
                    state.verified = 1
                    state.contactStep = step  
                }
                
                if (!state.contactVerified && state.step === state.contactStep && step >= state.contactStep) state.contactVerified = verified
            }
            
            if (step == 3) {
                if (!state.verified) {
                    state.contactMetaPublicKey = contactData 
                    state.verified = 1
                    state.contactStep = step  
                }                
                if (!state.contactVerified && state.step === state.contactStep && step >= state.contactStep) state.contactVerified = verified
            }

            if (step == 4) {
                if (!state.verified) {
                    state.contactDisplayName = contactData 
                    state.verified = 1
                    state.contactStep = step  
                }                
                if (!state.contactVerified && state.step === state.contactStep && step >= state.contactStep) state.contactVerified = verified
            }

            if (step == 5) {    
                if (!state.verified) {
                    const signer = ethers.utils.verifyMessage(state.challenge + state.contactPublicKey + state.contactMetaPublicKey + state.contactDisplayName, contactData).toLowerCase()
                    if (state.contactAddress === signer) {
                        state.verified = 1   
                        state.contactStep = step                                             
                    } else {
                        console.log('Wrong signer', state.contactAddress, signer)
                        toggleScanner()
                        toggleScanner()
                        return
                    } 
                }                
                if (!state.contactVerified && state.step === state.contactStep && step >= state.contactStep) state.contactVerified = verified  
                
            }
        }

        
    } catch (error) {
        console.log('readQr error', error)
        //state.signerAddress = null;
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

// Start QR Scanner
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
                //console.error("Scanning error:", errorMessage);
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
