<template>
    <div>
        

        <div v-if="metaStealthPubKey?.length > 2">
            You registered <br>
            Meta Stealth Public Key: 
            {{ metaStealthPubKey.substring(0, 16) }}...{{ metaStealthPubKey.substring(metaStealthPubKey.length - 16, metaStealthPubKey.length)}}
        </div>

        <div v-else>
            <p>Register Meta address. Demo works on ETH Sepolia</p>

            
            <div class="mb-2">
                <div class="fw-bold">1. Type pincode for address generation</div>
                <div class="small">It will be required for share recovery</div>
            </div>
            
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
            </div>

            <div class="mb-2 fw-bold">2. Generate signature and submit transaction to store it</div>
            
            <button class="btn btn-primary mb-2" @click="register()" :disabled="pinInvalid || isMSARegisterLoading">
                Register
            </button>

            <div>
                {{ isMSARegisterLoading ? "Registration in progress..." : "" }}
            </div>  
            
            <div v-if="registerTxHash && registerTxResult.data">
                Tx:  
                <a :href="$walletClient.chain?.blockExplorers.default.url + '/tx/' + registerTxHash" target="_blank" rel="noopener noreferrer">{{ registerTxHash }}</a>
                {{ registerTxResult.status }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import { useWaitForTransactionReceipt, useWriteContract, useReadContract, useSignTypedData } from '@wagmi/vue'
import { bc, mainChainId } from '../config/index'
import { ethers } from 'ethers';
const $account = inject('$account')
const $walletClient = inject('$walletClient')
const $bukitupClient = inject('$bukitupClient')

const { isPending: isMSARegisterLoading, writeContractAsync: MSAregister, isSuccess: MSASuccessRegistered } = useWriteContract()

const { data: metaStealthPubKey, refetch: refetchMetaStealthPubKey } = useReadContract({
    address: bc.registry.address,
    abi: JSON.parse(bc.registry.abijson),
    functionName: 'stealthMetaAddressOf',
    args: computed(() => [$account.address.value, '0']),
    enabled: computed(() => !!$account.address.value)
});

onMounted(async () => {
    console.log('MSASuccessRegistered', MSASuccessRegistered.value)
    if ($account.address) {
        console.log('stealthMetaAddressOf', metaStealthPubKey)
    }
})

const pin = ref('1234') //'mytag1'
const pinDirty = ref(true)
watch(() => pin.value, () => {
    pinDirty.value = true
})

const pinInvalid = computed(() => {
    if (!pin.value) return 'Pin is required'
    if (pin.value.length < 4) return 'Min 4 characters'
})

watch(() => MSASuccessRegistered.value, () => {
    if (MSASuccessRegistered.value) refetchMetaStealthPubKey()
})

const registerTxHash = ref()
const registerTxResult = useWaitForTransactionReceipt({
    hash: computed(() => registerTxHash.value), 
    enabled: computed(() => !!registerTxHash.value)
})
watch(() => registerTxResult, (newResult, oldResult) => {
    console.log('watch registerTxResult', newResult )
    if (newResult?.status?.value === 'success') {
        refetchMetaStealthPubKey()
        pin.value = null
        pinDirty.value = false
    }     
      
},
{ deep: true })

const { signTypedDataAsync } = useSignTypedData()

const register = async () => {
    try {
        if (!$walletClient.value) return;
        const maSignature = await $bukitupClient.generateBaseSignature(pin.value, $walletClient.value);
        const keyPair = await $bukitupClient.generateKeysFromSignature(maSignature);
        registerTxHash.value = null     

        const signature = await signTypedDataAsync({
            domain: {
                name: "BuckitUpRegistry",
                version: "1",
                chainId: mainChainId,
                verifyingContract: bc.registry.address,
            },
            types: {
                RegisterKeysOnBehalf: [
                    { name: "registrant", type: "address" },
                    { name: "scheme", type: "uint256" },
                    { name: "stealthMetaAddress", type: "bytes" },
                ],
            },
            primaryType: 'RegisterKeysOnBehalf',
            message: {
                registrant: $account.address.value,
                scheme: 0, // Your scheme ID
                stealthMetaAddress: keyPair.spendingKeyPair.account.publicKey,
            },
        })

        console.log("Signature:", signature);

	    //const signature = await signer.signMessage(ethers.utils.arrayify(toSignData));
       
        const tx = await MSAregister({
            address: bc.registry.address,
            abi: JSON.parse(bc.registry.abijson),
            functionName: 'registerKeysOnBehalf',
            args: [ $account.address.value, '0', keyPair.spendingKeyPair.account.publicKey, signature ]
        })
        registerTxHash.value = tx
   
    } catch (error) {
        console.log(error)
    }
    
}

const register3 = async () => {
    try {
        const maSignature = await $bukitupClient.generateBaseSignature(pin.value, $walletClient.value);
        const keyPair = await $bukitupClient.generateKeysFromSignature(maSignature);
        registerTxHash.value = null     
        
        const toSignData = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode( [ 
            'address', 'uint256', 'bytes' ], 
            [ $account.address.value, '0', keyPair.spendingKeyPair.account.publicKey ] 
        ))	
        
        
        if (!$walletClient.value) return;
        const { transport } = $walletClient.value;
        const provider = new ethers.providers.Web3Provider(transport, 'any');
        const signer = provider.getSigner($account.address.value);
      
        console.log('signer', signer)
	    const signature = await signer.signMessage(ethers.utils.arrayify(toSignData));
       
        const tx = await MSAregister({
            address: bc.registry.address,
            abi: JSON.parse(bc.registry.abijson),
            functionName: 'registerKeysOnBehalf',
            args: [ $account.address.value, '0', keyPair.spendingKeyPair.account.publicKey, signature ]
        })
        registerTxHash.value = tx
   
    } catch (error) {
        console.log(error)
    }
    
};

const register2 = async () => {
    try {
        const signature = await $bukitupClient.generateBaseSignature(pin.value, $walletClient.value);
        const keyPair = await $bukitupClient.generateKeysFromSignature(signature);
        registerTxHash.value = null      
                
        const tx = await MSAregister({
            address: bc.registry.address,
            abi: JSON.parse(bc.registry.abijson),
            functionName: 'registerKeys',
            args: ['0', keyPair.spendingKeyPair.account.publicKey]
        })
        registerTxHash.value = tx
   

    } catch (error) {
        console.log(error)
    }
    
};
</script>