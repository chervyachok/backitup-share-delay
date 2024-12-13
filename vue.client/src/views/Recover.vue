<template>
    <div>
        <p>Recover share</p>

        <div class="mb-2 fw-bold">1. Insert a tag and pin from your Meta address</div>
               
        <div class="row gx-2">
            <div class="col-md-4">
                <div class="form-floating mb-3 ">
                    <input type="text" 
                        v-model="tag" 
                        class="form-control"                        
                        placeholder="tag"                        
                    >
                    <label for="secretTag">Tag</label>                   
                </div>
            </div>

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

        <div v-if="tag && backupData?.owner === ethers.constants.AddressZero">
            Backup not found
        </div>

        <template v-if="backupData?.owner && backupData.owner !== ethers.constants.AddressZero">
            
            <BackupItem :tag="tag" :backup-data-in="backupData" :stealth-addr="stealthAddr" class="mb-2"/>

            <div>
                <button class="btn btn-primary mb-2 me-2" @click="recover()">
                    Check access and recover
                </button>
            </div>

            <div v-if="requestTxHash && requestTxResult.data">
                <div>
                    Tx: <a :href="$walletClient.chain?.blockExplorers.default.url + '/tx/' + requestTxHash" target="_blank" rel="noopener noreferrer">{{ requestTxHash }}</a>
                </div>
                <div class="mb-3 fw-bold" v-if="requestTxResult.status">
                    {{ requestTxResult.status }}
                </div> 
            </div>

            <div v-if="result.status" >
                <div class="mb-2 fw-bold">{{ result.msg }}  </div>
                <div v-if="isRequestRequired">
                    <button class="btn btn-primary mb-2 me-2" @click="request()">
                        Request restore
                    </button>
                </div>  
            </div>
            
            <div class="mb-3" v-if="secretText">
                <label for="exampleFormControlTextarea1" class="form-label">Your recovered share</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="5" v-model="secretText"></textarea>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed, onUnmounted } from 'vue';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useSignTypedData  } from '@wagmi/vue'
import { getTransactionCount } from '@wagmi/core'
import { bc, mainChainId, wagmiAdapter, mainChain } from '../config/index'
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts'
import { LIT_ABILITY } from "@lit-protocol/constants";
import { decryptToString } from "@lit-protocol/encryption"
import { ethers } from 'ethers';
import { LitAccessControlConditionResource, createSiweMessage, generateAuthSig } from "@lit-protocol/auth-helpers";
import { useRoute } from 'vue-router';
import BackupItem from './BackupItem.vue';

const $account = inject('$account')
const $walletClient = inject('$walletClient')
const $bukitupClient = inject('$bukitupClient')
const $litClient = inject('$litClient')
const $timestamp = inject('$timestamp')

const position = ref(null)
const stealthAddr = ref()
const result = ref({})
const secretText = ref()
const tag = ref()
const delay = ref()

watch(() => tag.value, () => {
    reset()
})

watch(() => $account.address?.value, () => {
    //reset()
})

let  mounted = true

onMounted(() => {
    if (useRoute().query.t) {
        tag.value = useRoute().query.t
    }
    mounted = true
    
})

onUnmounted(() => {
    mounted = false
})

const pin = ref('1234') //'mytag1'
const pinDirty = ref()
watch(() => pin.value, () => {
    pinDirty.value = true
})

const requestTxHash = ref()

watch(() => $account?.address?.value, async (n, o) => {
    requestTxHash.value = null
    reset()
})


const requestTxResult = useWaitForTransactionReceipt({
    hash: computed(() => requestTxHash.value), 
    enabled: computed(() => !!requestTxHash.value)
})

watch(() => requestTxResult, (newResult, oldResult) => {
    console.log('watch requestTxResult', newResult )
    if (newResult?.status?.value === 'success') {
        getBackup()
    } 
},
{ deep: true })

const reset = () => {
    secretText.value = null
    position.value = null
    stealthAddr.value = null
    result.value = {}
}

const pinInvalid = computed(() => {
    if (!pin.value) return 'Pin is required'
    if (pin.value.length < 4) return 'Min 4 characters'
})


const { data: backupData, isPending: backupDataPending, refetch: getBackup } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getBackup',
    args: computed(() => [tag.value?.trim()]),
    enabled: computed(() => !!tag.value)
});

//const { data: metaStealthPubKey, refetch: refetchMetaStealthPubKey } = useReadContract({
//    address: bc.registry.address,
//    abi: JSON.parse(bc.registry.abijson),
//    functionName: 'stealthMetaAddressOf',
//    args: computed(() => [$account.address.value, '0']),
//    enabled: computed(() => !!$account.address.value)
//});



const { data: grantedData, refetch: getGranted } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'granted',
    args: computed(() => [tag.value, position.value, stealthAddr.value]),  
    enabled: false  
});

const timeLeft = computed(() => {
    if (!backupData.value || !$walletClient.value || position.value === null) return null;
    if (backupData.value.portions[position.value].request == 0) return null
    return Math.max(0, (backupData.value.portions[position.value].request + backupData.value.portions[position.value].delay) - $timestamp.value) 
})

const isRocoverable = computed(() => {
    if (!backupData.value || !$walletClient.value || position.value === null) return null;
    if (backupData.value.disabled) return false
    if (backupData.value.portions[position.value].disabled) return 'Share is disabled'
    if (backupData.value.portions[position.value].delay == 0) return true
    if (backupData.value.portions[position.value].request == 0) return 'Request required'
    if (backupData.value.portions[position.value].request + backupData.value.portions[position.value].delay > Math.floor(Date.now().valueOf() / 1000) ) return 'Dalay not past'
    return true
})

const isRequestRequired = computed(() => {
    if (!backupData.value || position.value === null) return null;
    if (backupData.value.disabled) return null
    if (backupData.value.portions[position.value].disabled) return null
    if (backupData.value.portions[position.value].delay > 0 && backupData.value.portions[position.value].request == 0) return true    
})


let sessionSignatures
const getSessionSigs = async (signer) => {
    try {
        const resourceAbilityRequests = [
            {
                resource: new LitAccessControlConditionResource("*"),
                ability: LIT_ABILITY.AccessControlConditionDecryption,
            },
        ]
//0x08013747aa9c37d940b18d1cda1c1444a0c1a57e60bc2006594e5ab83287038c4425
        sessionSignatures = await $litClient.getSessionSigs({
            chain: "sepolia",
            expiration: new Date(Date.now() + 1000 * 15).toISOString(), // 10 minutes
            //capabilityAuthSigs: [capacityDelegationAuthSig], // Unnecessary on datil-dev
            resourceAbilityRequests,
            authNeededCallback: async ({
                uri,
                expiration,
                resourceAbilityRequests,
            }) => {
                const d = {
                    uri,
                    expiration,
                    resources: resourceAbilityRequests,
                    walletAddress: signer.address,
                    nonce: await $litClient.getLatestBlockhash(),
                    litNodeClient: $litClient,
                };
                if (!location.origin.includes('local')) {
                    console.log(location)
                    d.domain = location.host
                }
                console.log('toSign', d)
                const toSign = await createSiweMessage(d);  

                return await generateAuthSig({
                    address: signer.address,
                    signer,
                    toSign,
                });
            },
        })
        console.log('sessionSignatures', sessionSignatures)
        return sessionSignatures
    } catch (error) {
        console.log('sessionSignatures', error)
    }

};

const privateKey = ref()
const recover = async () => {
    if (!backupData.value) return

    const signature = await $bukitupClient.generateBaseSignature(pin.value, $walletClient.value);
    const keyPair = await $bukitupClient.generateKeysFromSignature(signature);

    let stAddress, pos = -1;
    for (let i=0; i < backupData.value.portions.length; i++) {
      stAddress = $bukitupClient.getStealthAddressFromEphemeral(keyPair.spendingKeyPair.privatekey, backupData.value.portions[i].ephemeralPubKey);
      console.log('Address', stAddress.toLowerCase(), backupData.value.portions[i].stealthAddress.toLowerCase())
      if (stAddress.toLowerCase() === backupData.value.portions[i].stealthAddress.toLowerCase()) {
        pos = i;
        privateKey.value = $bukitupClient.generateStealthPrivateKey(keyPair.spendingKeyPair.privatekey, backupData.value.portions[i].ephemeralPubKey);
        break;
      }
    }
    if (pos === -1) {
        result.value.status = 1
        result.value.msg = 'Address not found'
        return;
    }

    position.value = pos
    stealthAddr.value = stAddress;
    console.log('stealthAddr', stealthAddr.value, position.value )

    const checkAccess = await getGranted()
    console.log('grantedData111', checkAccess, checkAccess.data)
    if (!checkAccess.data) {
        result.value.status = 2
        result.value.msg = 'Not granted'
        return;
    }
    
    const signer = new ethers.Wallet(privateKey.value)
    console.log('signer', signer)
    const sessionSigs = await getSessionSigs(signer)
    console.log('sessionSigs', sessionSigs)

    const unifiedAccessControlConditions = [{
        conditionType: "evmContract",
        contractAddress: bc.vault.address,
        functionName: "granted",
        functionParams: [tag.value.toString(), pos.toString(), ":userAddress"],
        functionAbi: {
            type: "function",
            name: "granted",
            constant: true,
            stateMutability: "view",
            inputs: [
                {
                    type: "string",
                    name: "tag"
                },
                {
                    type: "uint8",
                    name: "idx"
                },
                {
                    type: "address",
                    name: "stealthAddress"
                }
            ],
            outputs: [
                {
                    type: "bool",
                    name: "result"
                }
            ]
        },
        chain: "sepolia",
        returnValueTest: {
            key: "result",
            comparator: "=",
            value: "true",
        },
    }]

    const ciphertext = Buffer.from(backupData.value.portions[pos].share.slice(2), "hex")
    console.log('---', ciphertext)
    console.log('base64', ciphertext.toString("base64"))

    const decodedShare = await decryptToString(
        {
            unifiedAccessControlConditions,
            chain: 'sepolia',
            ciphertext: ciphertext.toString("base64"),//
            dataToEncryptHash: backupData.value.portions[pos].shareEncryptHash.slice(2),//
            sessionSigs,
        },
        $litClient,
    )
    console.log('-decodedShare-', decodedShare)

    secretText.value = await $bukitupClient.decryptShare(decodedShare, privateKey.value);

    console.log('-secretText.value-', secretText.value)
}
// 0x08024c678943b8e369b331a537d26d38a2e9051f36827c43ef403fcff7fc6b5e8c2c

const { writeContractAsync: requestRestore } = useWriteContract()
const { signTypedDataAsync } = useSignTypedData()
const request = async () => {    
    try {
        //const signer = new ethers.Wallet(privateKey.value)

        // Convert private key into an account
        const account = privateKeyToAccount(privateKey.value);
        console.log('---------', account)
        // Create a wallet client using the account
        const walletClient = createWalletClient({
            chain: mainChain,
            transport: http(),
            account,
        });

        
        const currNonce = await getTransactionCount(wagmiAdapter.wagmiConfig, {
            address: $account.address.value,
        })
        const nonce = currNonce + 1        
        const deadline = $timestamp.value + 300           
        
        
        
        const signature = await walletClient.signTypedData({
            domain: {
                name: "BuckitUpVault",
                version: "1",
                chainId: mainChainId,
                verifyingContract: bc.vault.address,
            },
            types: {
                RestoreBackup: [
                    { name: "tag", type: "string" },                    
                    { name: "idx", type: "uint8" },                    
                    { name: "deadline", type: "uint40" },
                    { name: "nonce", type: "uint40" },
                ],
            },
            primaryType: 'RestoreBackup',
            message: {
                tag: tag.value,
                idx: position.value,
                deadline,
                nonce
            },
        })

        console.log('signature', signature)

       
        const tx = await requestRestore({
            address: bc.vault.address,
            abi: JSON.parse(bc.vault.abijson),
            functionName: 'requestRestore',
            args: [ tag.value, position.value, deadline, nonce, signature ]
        })
        requestTxHash.value = tx
    } catch (error) {
        console.log(error)
    }

};


</script>
