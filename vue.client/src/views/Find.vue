<template>
    <div>
        <p>Find backups for your stealth address</p>
        
        <div class="mb-2 fw-bold">1. Enter pin from your Meta address and provide signature</div>
               
        <div class="row gx-2">
            <div class="col-md-3">
                <div class="form-floating mb-3 ">
                    <input type="text" 
                        v-model="pin" 
                        class="form-control" 
                        placeholder="pin"
                        :class="[ pinDirty && (pinInvalid ? 'is-invalid': 'is-valid') ]"
                        >
                    <label for="pin">Pin code</label>
                    <div class="invalid-feedback">
                        {{ pinInvalid }}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <button class="btn btn-primary mb-2 me-2" @click="sign()" :disabled="!pin">
                    Sign
                </button>
            </div>
        </div>

        <div class="mb-2 fw-bold">2. If you know the owner of backup, enter address, this will narrow the search range. Or leave it blank to scan all backups</div>
       

        <div class="row gx-2">
            <div class="col-md-6">
                <div class="form-floating mb-3 ">                
                    <input type="text" 
                        v-model="address" 
                        class="form-control" 
                        id="secretText" 
                        placeholder="secretText"
                        >
                    <label for="secretText">Owner</label>                    
                </div>
            </div>
        </div>
        
        <div class="mb-2 fw-bold">3. We will check them and mark created for you</div>
        <div>
            <button class="btn btn-primary mb-2 me-2" @click="scan()" :disabled="!signature">
                 {{ scanning ? 'Scaning... Press to stop' : 'Scan' }}
            </button>
        </div>

        <div v-for="backup in backups" class="border rounded p-3 mt-2">
            <div>
                <router-link :to="'/recover?t='+backup.tag" class="fw-bold">
                    {{ backup.tag }}
                </router-link>  
                (click to go to recover)          
            </div>  
            <div>
                Owner of backup: 
                
                <a :href="$walletClient.chain?.blockExplorers.default.url + '/address/' + backup.owner" target="_blank" rel="noopener noreferrer" v-if="$walletClient?.chain">
                    {{ backup.owner }}
                </a>
                <span v-else>{{ backupData.owner }}</span>
                
                <span class="fw-bold text-danger" v-if="$account.address?.value && backup.owner.toLowerCase() == $account.address?.value?.toLowerCase()">
                    You
                </span>
            </div>
            <div>Backup restore enabled: {{ backup.disabled ? 'No' : 'Yes' }}</div>
            <div>Required number of shares to restore secret: {{ backup.treshold }}</div>
            <div v-for="( portion, idx ) in backup.portions">
                <div class="fw-bold" >Share #{{ idx + 1 }} <span class="fw-bold text-danger"v-if="portion.found">- This is your share</span> </div>
                <div>
                    Trusted stealth: 
                    <a :href="$walletClient.chain?.blockExplorers.default.url + '/address/' + portion.stealthAddress" target="_blank" rel="noopener noreferrer" v-if="$walletClient?.chain">
                        {{ portion.stealthAddress }}
                    </a>
                    <span v-else>{{ portion.stealthAddress }}</span>
                </div>
                <div>Share restore enabled: {{ portion.disabled ? 'No' : 'Yes' }} </div>
                <div >
                    Restore delay (seconds): {{ portion.delay }}                    
                </div>
                <div v-if="portion.request > 0" class="text-danger">                    
                    Restore requested / Time left to unlock: {{ Math.max(0, (portion.request + portion.delay) - $timestamp) }}
                </div>
            </div>
         </div>
    </div>
</template>

<script setup>
import BackupItem from './BackupItem.vue';
import { ref, onMounted, watch, inject, computed, nextTick } from 'vue';
import { useReadContract } from '@wagmi/vue'
import { bc } from '../config/index'
import { isAddress } from 'viem';
import { ethers } from 'ethers';

const $walletClient = inject('$walletClient')
const $bukitupClient = inject('$bukitupClient')
const $account = inject('$account')
const pin = ref('1234') 
const address = ref()
const pinDirty = ref()
const signature = ref()
const tags = ref([])
const tag = ref()
const backups = ref([])
const stealthAddr = ref()
const position = ref()
const scanning = ref()
watch(() => pin.value, () => {
    pinDirty.value = true
})

watch(() => $account?.address?.value, async (n, o) => {
    signature.value = null
    backups.value = []
})

onMounted(async () => {
   
})

const { data: allTagsData, isPending: allTagsPending, refetch: allTagsGet } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getTags',
    args: computed(() => [ address.value && isAddress(address.value) ? address.value : ethers.constants.AddressZero ]),
    enabled: false
});


const { data: backupData, isPending: backupDataPending, refetch: getBackup } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getBackup',
    args: computed(() => [ tag.value?.trim() ]),
    enabled: false
});

const { data: grantedData, refetch: getGranted } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'granted',
    args: computed(() => [ tag.value?.trim(), position.value, stealthAddr.value]),  
    enabled: false  
});

const { data: backupsData, isPending: backupsDataPending, refetch: getBackups } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getBackups',
    args: computed(() => [ tags.value ]),
    enabled: false
});



const sign = async () => {  
    try {
        signature.value = await $bukitupClient.generateBaseSignature(pin.value, $walletClient.value);
        
    } catch (error) {
        console.log('error', error)
    }
}

const scan = async () => {  
    if (scanning.value) {
        scanning.value = false   
        return
    }
    scanning.value = true
    backups.value = []
    try {
        console.log(signature.value)
        if (!signature.value) {
            signature.value = await $bukitupClient.generateBaseSignature(pin.value.toString(), $walletClient.value);
        }
        
        const keyPair = await $bukitupClient.generateKeysFromSignature(signature.value);

        tags.value = await allTagsGet()
        
        if (!tags.value.data.length) {
            scanning.value = false   
            return
        }
        console.log('tags', tags.value.data)
        

        for (let index = 0; index < tags.value.data.length; index++) {
            if (!scanning.value) break
            tag.value = tags.value.data[index];


            const backup = await getBackup()

            console.log('backup', tag.value, backup.data)

            for (let i=0; i < backup.data.portions.length; i++) {
                stealthAddr.value = $bukitupClient.getStealthAddressFromEphemeral(keyPair.spendingKeyPair.privatekey, backup.data.portions[i].ephemeralPubKey);
                console.log('Address', stealthAddr.value.toLowerCase(), backup.data.portions[i].stealthAddress.toLowerCase())
                if (stealthAddr.value.toLowerCase() === backup.data.portions[i].stealthAddress.toLowerCase()) {
                    if (!scanning.value) break
                    //const checkAccess = await getGranted()                    
                    //backup.data.granged = checkAccess.data
                    backup.data.tag = tag.value
                    backup.data.portions[i].found = true
                    backups.value.push(backup.data)
                    break;
                }
            }
        }       
    } catch (error) {
        console.log('error', error)
    } 
    scanning.value = false     
}

</script>
