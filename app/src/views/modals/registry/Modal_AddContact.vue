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

        <template v-if="!scanning">
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
        <div ref="qrHandshakeEl" class="mb-3"></div>
       
        <div class="d-flex justify-content-center mb-3">
            <button class="btn btn-primary btn-lg" @click="toggleScanner()">
                <span v-if="!scanning" >Click to start scan</span>
                <span v-if="scanning" >Scanning... Click to stop</span>
            </button>
        </div>

        
        <div v-if="contact">
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

    </div>
</template>

<style lang="scss">
._qrh {
    
    ._qrh_wrapper {
        overflow: hidden;
        justify-content: center;
        ._qrh_container {
            padding: .5rem;
            width: 100% !important;
            max-width: 450px !important;
            background-color: #b6b6b6;
            &._qrh_detected {
                background-color: #e99f00;
            }
    
            &._qrh_verified {
                background-color: #07ce00;
            }
    
            canvas {
                width: 100% !important;
                height: auto !important;
            }
        }
    }
}
</style>

<script setup>
import { ref, inject, onMounted } from 'vue';
import QRHandshakeManager from '../../../libs/QRHandshakeManager';

const $user = inject('$user')
const $mitt = inject('$mitt')
const $encryptionManager = inject('$encryptionManager') 

const scanning = ref()

const contact = ref(null);
const qrHandshakeEl = ref(null);
const qrHandshakeInstance = ref(null);

onMounted(() => {
    qrHandshakeInstance.value = new QRHandshakeManager(qrHandshakeEl.value, { 
        name: $user.account, 
        privateKeyB64: $user.account.privateKeyB64 
    })

    qrHandshakeInstance.value.addEventListener('handshakeCompleted', (event) => {
        console.log('Handshake completed:', event  );
        contact.value = event.detail 
    });
    qrHandshakeInstance.value.addEventListener('scanning', (event) => {
        console.log('Handshake scanning:', event  );
        scanning.value = event.detail
    });
})


function toggleScanner() {  
    contact.value = null
    qrHandshakeInstance.value.toggleScanner()
    
}

function closeModal() {  
    qrHandshakeInstance.value.dispose()
    $mitt.emit('modal::close')
}

const addContact = async () => {
    if (!$user.account.contacts?.length ) $user.account.contacts = []
    const idx = $user.account.contacts.findIndex(e => e.address === contact.value.address) 
    if (idx > -1) {
        $user.account.contacts[idx].displayName = contact.value.name       
    } else {
        $user.account.contacts.push(contact.value)
        
        await $encryptionManager.setData($user.toVaultFormat($user.account))
        closeModal() 
    }
};

</script>
