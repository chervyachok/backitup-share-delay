<template>
    <div class="border rounded p-3 mb-2">
        <div class="d-flex justify-content-between" >
            <div class="fw-bold mb-1" >
                Trusted wallet #{{ data.idx + 1 }}
            </div>
            <a href="#" @click="emit('removeWallet')" class="" v-if="data.length > 1" >Remove</a>
        </div>
        
        <div class="row gx-2">
            <div class="col-md-8">
                <div class="form-floating mb-3 ">
                    
                    <input type="text" 
                        v-model="wallet.address" 
                        class="form-control" 
                        id="secretText" 
                        placeholder="secretText"
                        :class="[ isAddressDirty && (isAddressInValid ? 'is-invalid': 'is-valid') ]"
                        >
                    <label for="secretText">Address </label>
                    <div class="invalid-feedback">
                        {{isAddressInValid}}
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="form-floating mb-3 ms-2">
                    <input type="number" 
                        v-model="wallet.delay" 
                        @change="setWallet()" 
                        class="form-control" 
                        id="restoreDelay" 
                        placeholder="restoreDelay"
                        min="0" 
                        :class="[ isDelayInValid ? 'is-invalid': 'is-valid' ]"
                        >
                    <label for="restoreDelay">Restore delay</label>
                    <div class="invalid-feedback">
                        {{isDelayInValid}}
                    </div>
                </div>     
            </div>
            
            <div class="col-md-12">
                <div class="form-floating">
                    <input type="text" 
                        v-model="wallet.message" 
                        class="form-control" 
                        id="restoreDelay" 
                        placeholder="Hey! Bob it's yor share of my wallet. Recover it with alice in case I gone"
                        >
                    <label for="restoreDelay">Message to trusted wallet (visible immediately)</label>                    
                </div>     
            </div>       
        </div>   
    </div>    
</template>
  
<script setup>    
import { ref, watch, inject, computed } from 'vue';    
import { isAddress } from 'viem';    
import { useReadContract } from '@wagmi/vue'

const $web3 = inject('$web3')
const isAddressDirty = ref()

const { data: metaStealthPubKey, refetch, isError, isPending  } = useReadContract({
    address: $web3.bc.registry.address,
    abi: JSON.parse($web3.bc.registry.abijson),
    functionName: 'stealthMetaAddresses',
    args: computed(() => [wallet.address]),
    enabled: computed(() => !!(wallet.address && isAddress(wallet.address)))
});

const { wallet, data } = defineProps({
    wallet: { typ: Object, required: true },
    data:  { typ: Object, required: true },
})

const emit = defineEmits(['setWallet', 'removeWallet'])

const setWallet = () => {      
    console.log(wallet.address, metaStealthPubKey.value)  
    emit('setWallet', {
        ...wallet,
        valid: !isAddressInValid.value && !isDelayInValid.value,
        stealth: metaStealthPubKey.value,
    })
}

const isDelayInValid = computed(() => {
    if (wallet.delay < 0 || !Number.isInteger(wallet.delay)) return 'Wrong delay'
})

const isAddressInValid = computed(() => {
    if (!wallet.address) return 'Address required'
    if (!isAddress(wallet.address)) return 'Address not valid'
    if (!metaStealthPubKey.value || metaStealthPubKey.value.length <= 2) return 'Meta address not registered for this wallet'
})

watch(() => wallet.address, async () => {
    isAddressDirty.value = true
    setWallet()
})

watch(() => metaStealthPubKey.value, async () => {
    isAddressDirty.value = true
    setWallet()
})
  
watch(() => wallet.message, (newValue) => {
    if (newValue && newValue.length > 100) {
        wallet.message = newValue.slice(0, 100); // Truncate to 100 characters
    }
    setWallet()
})

</script>