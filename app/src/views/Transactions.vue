<template>
    <div class="small mt-2" v-if="transactionsList.length">        
       <div class="d-flex justify-content-between">
            <div  class="fw-bold">Latest transactions</div>
            
            <a href="#" @click.prevent="expand()">{{ expanded ? 'Hide' : 'More...' }}</a>
        </div>
        
        <div v-for="tx in transactionsList" class="border-top py-2">
            <div class="d-flex justify-content-between">
                <div class="fw-bold">
                    <div v-if="tx.method === 'registerWithSign'">Meta address registered</div>
                    <div v-if="tx.method === 'addBackup'">Backup created</div>
                    <div v-if="tx.method === 'updateBackupDisabled'">Bacukp {{tx.methodData.disabled ? 'disabled' : 'enabled'}}</div>
                    <div v-if="tx.method === 'updateShareDisabled'">Bacukp share {{tx.methodData.disabled ? 'disabled' : 'enabled'}}</div>
                    <div v-if="tx.method === 'updateShareDelay'">Bacukp share delay</div>
                    <div v-if="tx.method === 'requestRecover'">Backup recover requested</div>            
                    <router-link v-if="tx.methodData.tag" :to="'/recover?t='+tx.methodData.tag" class="fw-bold">
                        {{ tx.methodData.tag }}
                    </router-link>
                </div>
                <div class="fw-bold text-end">
                    <div class="">{{ $date(tx.updatedAt).format('DD MMM HH:mm:ss ') }}</div>  
                    
                    <a :href="$web3.blockExplorer + '/tx/' + tx.txHash" target="_blank" rel="noopener noreferrer">{{ $filters.txHashShort(tx.txHash) }}</a>
                   
                    <div class="text-danger" v-if="tx.status === 'PROCESSING'">Confirming...</div>                  
                </div>                
            </div> 
            
            
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed, onUnmounted } from 'vue';
import axios from 'axios';

const $user = inject('$user')
const $mitt = inject('$mitt')
const $web3 = inject('$web3')
const expanded = ref(false)
const transactions = ref([])

onMounted(async () => {
   $mitt.on('WALLET_UPDATE', update)
   if ($user.account?.address) update()   
})

onUnmounted(async () => {
   $mitt.off('WALLET_UPDATE', update)
})

watch(() => $user.account?.address, async (n, o) => {
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
            wallet: $user.account.address, 
            chainId: $web3.mainChainId
        }})
        transactions.value = resp.data.results
    } catch (error) {
        console.log('transactins update', error)
    }    
}
</script>
