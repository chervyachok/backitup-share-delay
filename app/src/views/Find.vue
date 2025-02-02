<template>
    <div>
        <div class="mb-2 fw-bold">If you know the owner of backup, enter address, this will narrow the search range. Or leave it blank to scan all backups</div>
       

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
            <div class="col-md-3">
                <button class="btn btn-primary mb-2 me-2" @click="scan()" :disabled="!$user.account">
                    Scan
                </button>
            </div>
        </div>
                       
        <BackupItem :backup="backup" v-for="backup in backups"/> 
           
    </div>
</template>

<script setup>
import BackupItem from './BackupItem.vue';
import { ref, onMounted, watch, inject, onUnmounted } from 'vue';
import axios from 'axios';

const $user = inject('$user')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $socket = inject('$socket')
const $loader = inject('$loader')
const address = ref()
const backups = ref([])

watch(() => $user.account?.address, async (n, o) => {
    backups.value = []
})

onMounted(async () => {
    $socket.on('BACKUP_UPDATE', updateData)    
})

onUnmounted(async () => {
   $socket.off('BACKUP_UPDATE', updateData)
})

const updateData = async (tagUpdate) => {
    console.log('updateData', tagUpdate )
    try {
        const idx = backups.value.findIndex(b => b.tag === tagUpdate)
        console.log('updateData', idx )
        if (idx > -1) {
            const bk = (await axios.get(API_URL + '/backup/get', { params: { tag: tagUpdate, chainId: $web3.mainChainId } })).data 
            backups.value[idx] = bk      
        }     
    } catch (error) {
        console.log(error)
    }       
}

const scan = async () => {  
    $loader.show()
    try {  
        backups.value = []
        const bk = (await axios.get(API_URL + '/backup/getAll', { params: { wallet: address.value, chainId: $web3.mainChainId } })).data
               
        for (let index = 0; index < bk.length; index++) {
            const backup = bk[index];

            for (let i=0; i < backup.shares.length; i++) {
                const share = backup.shares[i];
                const stealthAddr = $web3.bukitupClient.getStealthAddressFromEphemeral($user.account.metaPrivateKey, share.ephemeralPubKey);
                
                if (stealthAddr.toLowerCase() === share.stealthAddress.toLowerCase()) {
                    backups.value.push(backup)
                    break;
                }
            }
        }       
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Scan error',
            footer: error.toString(),
            timer: 30000,
        });
    } 
    $loader.hide()
}

</script>
