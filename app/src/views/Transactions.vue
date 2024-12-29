<template>
    <div class="small mt-2" v-if="transactionsList.length">        
       <div class="d-flex justify-content-between">
            <div  class="fw-bold">Latest transactions</div>
            
            <a href="#" @click.prevent="expand()">{{ expanded ? 'Hide' : 'More...' }}</a>
        </div>
        
        <div v-for="tx in transactionsList" class="border-top py-2">
            <div class="d-flex justify-content-between">
                <div class="fw-bold d-flex ">
                    <span v-if="tx.method === 'registerWithSign'">Meta address registered</span>
                    <span v-if="tx.method === 'addBackup'">Backup created</span>
                    <span v-if="tx.method === 'updateBackupDisabled'">Bacukp {{tx.methodData.disabled ? 'disabled' : 'enabled'}}</span>
                    <span v-if="tx.method === 'updateShareDisabled'">Bacukp share {{tx.methodData.disabled ? 'disabled' : 'enabled'}}</span>
                    <span v-if="tx.method === 'updateShareDelay'">Bacukp share delay</span>
                    <span v-if="tx.method === 'requestRecover'">Backup recover requested</span>

                    <router-link v-if="tx.methodData.tag" :to="'/recover?t='+tx.methodData.tag" class="fw-bold ms-3">
                        {{ tx.methodData.tag }}
                    </router-link> 
                </div>
                <div class="fw-bold">
                    
                    <span class="me-3" v-if="tx.status === 'PROCESSING'">Confirming...</span>
                    
                    <span class="mx-2">{{ $date(tx.updatedAt).format('DD MMM HH:mm:ss ') }}</span>  
                    
                    <a :href="$web3.blockExplorer + '/tx/' + tx.txHash" target="_blank" rel="noopener noreferrer">{{ $filters.txHashShort(tx.txHash) }}</a>
                   
                                      
                </div>                
            </div>          
            
            <div class="text-end"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed, onUnmounted } from 'vue';
import axios from 'axios';

const $account = inject('$account')
const $mitt = inject('$mitt')
const $web3 = inject('$web3')
const expanded = ref(false)
const transactions = ref([])

onMounted(async () => {
   $mitt.on('WALLET_UPDATE', update)
   if ($account?.address?.value) update()   
})

onUnmounted(async () => {
   $mitt.off('WALLET_UPDATE', update)
})

watch(() => $account?.address?.value, async (n, o) => {
    transactions.value = []
    if (n) update()
})

const transactionsList = computed(() => {
    if (!expanded.value) {
        return transactions.value.length > 0 ? [transactions.value[0]] : [];
    } else {
        return transactions.value
    }
})

const expand = () => {
    expanded.value = !expanded.value
    if (expanded.value) update()
}

const update = async () => {
    try {
        const resp = await axios.get(API_URL + '/dispatch/getList', { params: {
            wallet: $account.address.value, 
            chainId: $web3.mainChainId
        }})
        transactions.value = resp.data.results
    } catch (error) {
        console.log('transactins update', error)
    }    
}
</script>
