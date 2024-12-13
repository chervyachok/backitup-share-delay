<template>
    <div class="row gx-2" v-if="wallet">
        <div class="col-md-6">
            <div class="form-floating mb-3 ">
                
                <input type="text" 
                    v-model="wallet.address" 
                    class="form-control" 
                    id="secretText" 
                    placeholder="secretText"
                    :class="[ isAddressDirty && (isAddressInValid ? 'is-invalid': 'is-valid') ]"
                    >
                <label for="secretText">Trusted wallet address #{{ data.idx + 1 }}</label>
                <div class="invalid-feedback">
                    {{isAddressInValid}}
                </div>
            </div>
        </div>
        <div class="col-md-2">
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
        <div class="col-md-2 ">
            <button class="btn btn-outline-primary" @click="emit('removeWallet')" v-if="data.length > 1">
                X
            </button> 
        </div>        
    </div>   
  </template>
  
  <script setup>    
    import { ref, onMounted, watch, inject, computed } from 'vue';    
    import { isAddress } from 'viem';    
    import { useReadContract  } from '@wagmi/vue'
    import { bc } from '../config/index'

    const isAddressDirty = ref()
    
    const { data: metaStealthPubKey, refetch, isError, isPending  } = useReadContract({
        address: bc.registry.address,
        abi: JSON.parse(bc.registry.abijson),
        functionName: 'stealthMetaAddressOf',
        args: computed(() => [wallet.address, BigInt(0)]),
        enabled: computed(() => !!(wallet.address && isAddress(wallet.address)))
    });

    const { wallet, data } = defineProps({
        wallet: { typ: Object, required: true },
        data:  { typ: Object, required: true },
    })
    

    const emit = defineEmits(['setWallet', 'removeWallet'])

    const setWallet = () => {
        //console.log('setWallet valid', !isAddressInValid.value && !isDelayInValid.value)
        emit('setWallet', {
            ...wallet,
            valid: !isAddressInValid.value && !isDelayInValid.value,
            stealth: metaStealthPubKey.value
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

    onMounted(async () => {
        
    })

    watch(() => wallet.address, async () => {
        isAddressDirty.value = true
        setWallet()
    })
    
    // 0x242B39E000A1F6B509DAe48965D27eb93464F970
    // 0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38
    //  0x1df2674903208dfa0590B7664Fa3B25da5009194
    watch(() => metaStealthPubKey.value, async () => {
        //console.log('address ch', metaStealthPubKey.value)
        isAddressDirty.value = true
        setWallet()
    })
  
  </script>
  
  