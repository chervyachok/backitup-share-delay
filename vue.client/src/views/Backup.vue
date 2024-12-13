<template>
    <div>
        <p>Backup secret</p>

        <div class="mb-2 fw-bold">1. Insert a secret</div>

        <div class="form-floating mb-3 ">
            <input type="text" 
                v-model="secret" 
                class="form-control"                 
                placeholder="secret"
                :class="[ secretDirty && (secretInvalid ? 'is-invalid': 'is-valid') ]"
                >
            <label>Secret</label>
            <div class="invalid-feedback">
                {{ secretInvalid }}
            </div>
        </div>

        <div class="mb-2 fw-bold">2. Type unique tag</div>
        
        <div class="row gx-2">
            <div class="col-md-4">
                <div class="form-floating mb-3 ">
                    <input type="text" 
                        v-model="tag" 
                        class="form-control"                        
                        placeholder="tag"                        
                        :class="[ tagDirty && !tagDataPending && (tagInvalid ? 'is-invalid': 'is-valid') ]"
                    >
                    <label for="secretTag">Tag</label>
                    <div class="invalid-feedback">
                        {{ tagInvalid }}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mb-2">
            <div class="fw-bold">3. Add at least one trusted wallet and set delay for restore</div>
            <div class="small">Wallet must have registered Meta address</div>
            <div class="small">No delay allow to restore share without any restrictions</div>
            <div class="small">When wallet requested for restore you will have time to reject it</div>
        </div>
        
        <BackupWalletItem 
            v-for="(wallet, idx) in wallets" 
            :wallet="wallet" 
            :data="{ length: wallets.length, idx }"
            @set-wallet="(p) => wallets[idx] = p" 
            @remove-wallet="() => wallets.splice(idx, 1)"             
        />

        <div>
            <button class="btn btn-primary mb-2" @click="addWallet()">
                Add trusted wallet
            </button>
        </div>
       
        <div class="mb-2">
            <div class="fw-bold">4. Set restore treshold</div>
            <div class="small">Number of wallets that must provide their shares to recover secret</div>
        </div>

        <div class="row g-2">
            <div class="col-md-3">
                <div class="form-floating mb-3 ">
                    <input type="number" 
                        v-model="treshold" 
                        min="1" :max="wallets.length" 
                        class="form-control"
                        :class="[ tresholdInvalid ? 'is-invalid': 'is-valid' ]"
                        placeholder="treshold">
                    <label>Treshold</label>
                    <div class="invalid-feedback">
                        {{ tresholdInvalid }}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mb-2">
            <div class="fw-bold">5. Submit transaction</div>
        </div>

        <div>
            <button class="btn btn-primary mb-2" @click="backup()" :disabled="isInvalid">
                Backup
            </button>
        </div>
       
        <div v-if="backupTxHash && backupTxResult.data">
            <div>
                Tx: <a :href="$walletClient.chain?.blockExplorers.default.url + '/tx/' + backupTxHash" target="_blank" rel="noopener noreferrer">{{ backupTxHash }}</a>
            </div>
            <div class="mb-3 fw-bold" v-if="backupTxResult.status">
                {{ backupTxResult.status }}
            </div> 
            
        </div>

        <div v-if="tagsData">
            <div class="mb-2 fw-bold">6. Share tag with trusted wallets</div>
            <div></div>
        </div>


    </div>
</template>

<script setup>
import BackupWalletItem from './BackupWalletItem.vue';
import BackupItem from './BackupItem.vue';
import { ref, onMounted, watch, inject, computed, nextTick } from 'vue';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useSignTypedData } from '@wagmi/vue'
import { getTransactionCount } from '@wagmi/core'
import { bc, mainChainId, wagmiAdapter } from '../config/index'
import { LIT_ABILITY } from "@lit-protocol/constants";
import { LitAccessControlConditionResource, createSiweMessage, generateAuthSig } from "@lit-protocol/auth-helpers";
import { encryptString } from "@lit-protocol/encryption"
import { ethers } from 'ethers';


const $account = inject('$account')
const $timestamp = inject('$timestamp')
const $walletClient = inject('$walletClient')
const $bukitupClient = inject('$bukitupClient')
const $litClient = inject('$litClient')

const secret = ref('My secret text') //
const secretDirty = ref() //'My secret text'
watch(() => secret.value, () => {
    secretDirty.value = true    
})

const tag = ref() //'mytag1'
const tagDirty = ref()
watch(() => tag.value, () => {
    tagDirty.value = true
})

const treshold = ref(1)

const wallets = ref([])
const addWallet = () => {
    wallets.value.push({
        address: null,
        stealth: null,
        delay: 0,
        valid: false,
    })
    // 0x30b1B9A703269F36Bc322FddaD4Cd0a4295602F8
    
    // 0x08021d30461edc1ac82b560aa8e0ec5ad18e54264e413e8417807810a8862793cf30
}

onMounted(async () => {
    generateTag()
    addWallet()
    //wallets.value.push({
    //    address: "0x242B39E000A1F6B509DAe48965D27eb93464F970",
    //    stealth: "0x0442562b908ffbc36b35d73706de70520a55736e178bbb87630aca7979a731e984107a5915abd8de7ab4c2e8e11f2e5a3ee3969e23d3aa2cc8101291b59acdae52",
    //    delay: 10,
    //    valid: true,
    //})
    //wallets.value.push({
    //    address: "0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38",
    //    stealth: "0x0467985d6389e2e9892833e029d23463016e9b92db167ce04b11ece5dc5eb48212bf2f68ba23bf5dd0fcac96a07a54e39bfe789bc292f1e81932ed2c45265f0d79",
    //    delay: 0,
    //    valid: true,
    //})
})

const { data: backupData, isPending: backupDataPending } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getBackup',
    args: computed(() => [tag.value?.trim()]),
    enabled: computed(() => !!tag.value)
});

const secretInvalid = computed(() => {
    if (!secret.value?.trim()) return 'Secret is required'
    if (secret.value.length > 300) return 'Secret max 300 chars length'
})

const tagInvalid = computed(() => {
    if (!tag.value) return 'Tag is required'
    if (!backupData.value) return 'Tag data not available'
    if (backupData.value && backupData.value.owner !== ethers.constants.AddressZero) return 'Tag already exist, choose another'
})

const walletsInvalid = computed(() => {
    if (wallets.value.find(w => !w.valid)) return true    
})

const tresholdInvalid = computed(() => {
    if (treshold.value < 1) return 'Must be > 1'
    if (treshold.value > wallets.value.length) return 'Must be less or equal to wallets number'
})

const isInvalid = computed(() => {
    if (secretInvalid.value) return true
    if (tagInvalid.value) return true
    if (walletsInvalid.value) return true
    if (tresholdInvalid.value) return true    
})

const reset = () => {
    wallets.value = []    
    secret.value = null    
    tag.value = null    
    treshold.value = 1

    nextTick(() => {
        secretDirty.value = false
        tagDirty.value = false
        addWallet()
    })
}

let sessionSignatures
const getSessionSigs = async () => {
    try {
        const resourceAbilityRequests = [
            {
            resource: new LitAccessControlConditionResource("*"),
            ability: LIT_ABILITY.AccessControlConditionDecryption,
            },
        ]    
        sessionSignatures = await $litClient.getSessionSigs({
            chain: "ethereum",
            expiration: new Date(Date.now() + 1000 * 30 ).toISOString(), // 10 minutes
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
                    walletAddress: $account.address.value,
                    nonce: await $litClient.getLatestBlockhash(),
                    litNodeClient: $litClient,
                }
                if (!location.origin.includes('local')) {
                    d.domain = location.host
                }
                console.log('to sign', d)
                const toSign = await createSiweMessage(d);                
                const signer = {
                    signMessage: (toSign) => {
                        return $walletClient.value.signMessage({
                            message: toSign
                        })
                    }
                }
                return await generateAuthSig({
                    address: $account.address.value,
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

const backupTxHash = ref()
const backupTag = ref()
const backupTxResult = useWaitForTransactionReceipt({
    hash: computed(() => backupTxHash.value), 
    enabled: computed(() => !!backupTxHash.value)
})

watch(() => backupTxResult, (newResult, oldResult) => {
    console.log('watch backupTxResult', newResult )
    if (newResult?.status?.value === 'success') {
        backupTag.value = tag.value
        reset()
        
    } 
},
{ deep: true })

const { signTypedDataAsync } = useSignTypedData()
const { writeContractAsync: addBackup } = useWriteContract()
const backup = async () => {
    if (!$walletClient.value) return;
    
    try {
    
        const backup = {
            owner: $account.address.value,
            disabled: 0,
            treshold: treshold.value,
            portions: []
        }
        const stealthPublicKeys = []

        for (const wallet of wallets.value) {
            const SA = $bukitupClient.generateStealthAddress(wallet.stealth);
            stealthPublicKeys.push(SA.publicKey);
            backup.portions.push({            
                stealthAddress: SA.address,
                ephemeralPubKey: SA.ephemeralPubKey,
                share: '0x',
                shareEncryptHash: '0x',
                delay: wallet.delay,
                request: 0,
                disabled: 0,
            })
        }

        const shares = await $bukitupClient.generateSharesEncrypted(
            secret.value,
            stealthPublicKeys.length,
            treshold.value,
            stealthPublicKeys
        )

        console.log('shares', shares)
        
        const sessionSig = await getSessionSigs()
        if (!sessionSig) return
        
        for (let i = 0; i < shares.length; i++) {
            const share = shares[i]

            //if (!backup.portions[i].delay) {
            //    backup.portions[i].share = share
            //    backup.portions[i].shareEncryptHash += '00'
            //} else {
            const unifiedAccessControlConditions = [{
                conditionType: "evmContract",
                contractAddress: bc.vault.address,
                functionName: "granted",
                functionParams: [tag.value.toString(), i.toString(), ":userAddress"],
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
            
            const litEncrypted = await encryptString({ unifiedAccessControlConditions, dataToEncrypt: share }, $litClient)
            backup.portions[i].share += Buffer.from(litEncrypted.ciphertext, "base64").toString("hex") 
            backup.portions[i].shareEncryptHash += litEncrypted.dataToEncryptHash
            //}        
        }

        console.log('backup', backup)

        

        const currNonce = await getTransactionCount(wagmiAdapter.wagmiConfig, {
            address: $account.address.value,
        })
        const nonce = currNonce + 1
    
        const deadline = $timestamp.value + 300                        
        const signature = await signTypedDataAsync({
            domain: {
                name: "BuckitUpVault",
                version: "1",
                chainId: mainChainId,
                verifyingContract: bc.vault.address,
            },
            types: {
                Portion: [
                    { name: "stealthAddress", type: "address" },
                    { name: "ephemeralPubKey", type: "bytes" },
                    { name: "share", type: "bytes" },
                    { name: "shareEncryptHash", type: "bytes" },
                    { name: "delay", type: "uint40" },
                    { name: "request", type: "uint40" },
                    { name: "disabled", type: "uint8" },
                ],
                Backup: [
                    { name: "owner", type: "address" },
                    { name: "disabled", type: "uint8" },
                    { name: "treshold", type: "uint8" },
                    { name: "portions", type: "Portion[]" },
                ],
                AddBackup: [
                    { name: "tag", type: "string" },
                    { name: "backup", type: "Backup" },
                    { name: "deadline", type: "uint40" },
                    { name: "nonce", type: "uint40" },
                ],
            },
            primaryType: 'AddBackup',
            message: {
                tag: tag.value,
                backup,
                deadline,
                nonce
            },
        })

        console.log('signature', signature)

        const tx = await addBackup({
            address: bc.vault.address,
            abi: JSON.parse(bc.vault.abijson),
            functionName: 'addBackup',
            args: [ tag.value, backup, deadline, nonce, signature ]
        })
        backupTxHash.value = tx
    } catch (error) {
        console.log(error)
    }      
}

function generateTag() {    
    const randomArray = window.crypto.getRandomValues(new Uint8Array(8));
    const nonce = Array.from(randomArray)
        .map((b) => b.toString(16).padStart(2, "0")) // Convert each byte to hex
        .join(""); // Join all hex values into a single string
    
    console.log(nonce)
    // Create a keccak256 hash of the public key and nonce
    const hash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [$account.address.value, parseInt(nonce, 16).toString()])
    );

    // Convert the hash to a Buffer
    const hashBuffer = Buffer.from(hash.slice(2), "hex"); // Remove '0x' and convert to Buffer
    const truncatedBuffer = hashBuffer.subarray(0, 8); // Only use the first 16 bytes
    
    const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let value = BigInt("0x" + truncatedBuffer.toString("hex")); // Convert buffer to BigInt
    let result = "";
    
    while (value > 0) {
        const remainder = value % 62n;
        result = BASE62_CHARS[Number(remainder)] + result;
        value = value / 62n;
    }

    tag.value = result

}
</script>
