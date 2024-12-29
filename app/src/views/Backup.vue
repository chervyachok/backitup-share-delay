<template>
    <div>
        <div class="mb-2 fw-bold">Backup secret</div>

        <div class="mb-2 fw-bold">1. Insert a secret</div>

        <div class="form-floating mb-3 ">
            <textarea type="text" 
                v-model="secret" 
                class="form-control"                 
                placeholder="secret, max 300 letters"
                :class="[ secretDirty && (secretInvalid ? 'is-invalid': 'is-valid') ]"
                style="min-height: 5rem;"
                >
            </textarea>
            <label>Secret for trusted wallets</label>
            <div class="invalid-feedback">
                {{ secretInvalid }}
            </div>
        </div>
        <div class="form-floating mb-3 ">
            <textarea type="text" 
                v-model="comment" 
                class="form-control"                 
                placeholder="comment, max 300 letters"
                rows="3"
                style="min-height: 8rem;"
                >
            </textarea>
            <label>Comment (visible only for you)</label>
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
            :data="{ length: wallets.length, wallets, idx }"
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
    </div>
</template>

<script setup>
import BackupWalletItem from './BackupWalletItem.vue';
import { ref, onMounted, watch, inject, computed, nextTick, onUnmounted } from 'vue';
import { useReadContract, useSignTypedData } from '@wagmi/vue'
import { encryptString } from "@lit-protocol/encryption"
import { utils, constants } from 'ethers';
import { encryptWithPublicKey, cipher } from 'eth-crypto';
import axios from 'axios';

const $account = inject('$account')
const $timestamp = inject('$timestamp')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $socket = inject('$socket')
const $loader = inject('$loader')

const secret = ref(location.origin.includes('loc') ? '0x9f489378530d12beecbcf5a756183cab35f12aabe054a3ad1b99' : null) 
const comment = ref(location.origin.includes('loc') ? 'My wallet key 0x9f489378530d12beecbcf5a756183cab35f12aabe054a3ad1b99 \n1-Bob 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \n2-Elis 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' : null) 
const secretDirty = ref() 

watch(() => secret.value, (newValue) => {
    secretDirty.value = true    
    if (newValue && newValue.length > 300) {
        secret.value = newValue.slice(0, 300); // Truncate to 300 characters
    }
})

watch(() => comment.value, (newValue) => {
    if (newValue && newValue.length > 300) {
        comment.value = newValue.slice(0, 300); // Truncate to 300 characters
    }
});

const tag = ref() 
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
        message: null,
        delay: 0,
        valid: false,
    })
}

onMounted(async () => {
    $socket.on('BACKUP_UPDATE', updateData)
    generateTag()
    if (location.origin.includes('loc')) {
        // 0xEc44b418139Fa30bdAe165a7D8484f6d7F471445
        // 0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38
        // 0x242B39E000A1F6B509DAe48965D27eb93464F970        
        if (IS_PRODUCTION) {
            wallets.value.push({
                address: "0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38",
                stealth: "0x0467985d6389e2e9892833e029d23463016e9b92db167ce04b11ece5dc5eb48212bf2f68ba23bf5dd0fcac96a07a54e39bfe789bc292f1e81932ed2c45265f0d79",
                message: "Hey Bob, it's your share of my wallet. Recover it with Alice in case I'm gone",
                delay: 600,
                valid: true,
            })
            wallets.value.push({
                address: "0x242B39E000A1F6B509DAe48965D27eb93464F970",
                stealth: "0x0442562b908ffbc36b35d73706de70520a55736e178bbb87630aca7979a731e984107a5915abd8de7ab4c2e8e11f2e5a3ee3969e23d3aa2cc8101291b59acdae52",
                message: "Hey Alice, it's your share of my wallet. Recover it with Bob in case I'm gone",
                delay: 600,
                valid: true,
            })
        } else {
            wallets.value.push({
                address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                stealth: "0x04a7069e0f966c58bcf3d4478ee3d9873768c50d8c9c00866f8a64c3d9f2a683a5bf4e8af815e8c9c084f950f7d79a1f4ad8e669e08fcb71d72b75a49a0a62eb3b",
                message: "Hey Bob, it's your share of my wallet. Recover it with Alice in case I'm gone",
                delay: 600,
                valid: true,
            })
            wallets.value.push({
                address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                stealth: "0x04d9ae17030e248c745849f144cbfd2da86cf45d46df75a76c5d63db7fcd0eb8e98f7e99bca6abf9b06dfe8fe1bbbd51f58691404ce939bfc778e1a92c3bde9277",
                message: "Hey Alice, it's your share of my wallet. Recover it with Bob in case I'm gone",
                delay: 600,
                valid: true,
            })  
        }          
    } else {
        addWallet()
    }
})

onUnmounted(async () => {
   $socket.off('BACKUP_UPDATE', updateData)
})

const updateData = async (tagUpdate) => {
    if (tag.value?.trim() === tagUpdate) {
        reset()        
    }    
}

const { data: backupData, isPending: backupDataPending } = useReadContract({
    address: $web3.bc.vault.address,
    abi: JSON.parse($web3.bc.vault.abijson),
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
    if (backupData.value && backupData.value.owner !== constants.AddressZero) return 'Tag already exist, choose another'
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
    comment.value = null
    tag.value = null    
    treshold.value = 1
    generateTag()
    nextTick(() => {
        secretDirty.value = false
        tagDirty.value = false
        addWallet()
    })
}

const { signTypedDataAsync } = useSignTypedData()

const backup = async () => {
    try {
        if (!await $web3.walletClient()) return;
        
        $loader.show()
        
        const commentEncrypted = await encryptWithPublicKey(
            $web3.keyPair.spendingKeyPair.account.publicKey.slice(2),
            comment.value,
        )
        const backup = {
            owner: $account.address.value,
            disabled: 0,
            treshold: treshold.value,
            commentEncrypted: '0x' + cipher.stringify(commentEncrypted),
            shares: []
        }
        const stealthPublicKeys = []

        console.log('trustedAddressDecrypted', $web3.keyPair)

        for (const wallet of wallets.value) {
            const SA = $web3.bukitupClient.generateStealthAddress(wallet.stealth);
            stealthPublicKeys.push(SA.publicKey);

            const messageEncrypted = await encryptWithPublicKey(
                SA.publicKey.slice(2),
                wallet.message,
            )
                        
            backup.shares.push({            
                stealthAddress: SA.address,
                messageEncrypted: '0x' + cipher.stringify(messageEncrypted),
                ephemeralPubKey: SA.ephemeralPubKey,
                shareEncrypted: '0x',
                shareEncryptedHash: '0x',
                delay: wallet.delay,
                request: 0,
                disabled: 0,
            })
        }

        const shares = await $web3.bukitupClient.generateSharesEncrypted(
            secret.value,
            stealthPublicKeys.length,
            treshold.value,
            stealthPublicKeys
        )
        
        const sessionSig = await $web3.getSessionSigs()
        if (!sessionSig) {
            return $loader.hide()
        }
        
        for (let i = 0; i < shares.length; i++) {
            const share = shares[i]            
            const unifiedAccessControlConditions = $web3.getAccessControlConditions(tag.value, i)                        
            const litEncrypted = await encryptString({ unifiedAccessControlConditions, dataToEncrypt: share }, $web3.litClient)
            backup.shares[i].shareEncrypted += Buffer.from(litEncrypted.ciphertext, "base64").toString("hex") 
            backup.shares[i].shareEncryptedHash += litEncrypted.dataToEncryptHash
        }
            
        const expire = $timestamp.value + 300                        
        const signature = await signTypedDataAsync({
            domain: {
                name: "BuckitUpVault",
                version: "1",
                chainId: $web3.mainChainId,
                verifyingContract: $web3.bc.vault.address,
            },
            types: {
                Share: [
                    { name: "stealthAddress", type: "address" },
                    { name: "messageEncrypted", type: "bytes" },
                    { name: "ephemeralPubKey", type: "bytes" },
                    { name: "shareEncrypted", type: "bytes" },
                    { name: "shareEncryptedHash", type: "bytes" },
                    { name: "delay", type: "uint40" },
                    { name: "request", type: "uint40" },
                    { name: "disabled", type: "uint8" },
                ],
                Backup: [
                    { name: "owner", type: "address" },                    
                    { name: "disabled", type: "uint8" },
                    { name: "treshold", type: "uint8" },
                    { name: "commentEncrypted", type: "bytes" },
                    { name: "shares", type: "Share[]" },
                ],
                AddBackup: [
                    { name: "tag", type: "string" },
                    { name: "backup", type: "Backup" },
                    { name: "expire", type: "uint40" },
                ],
            },
            primaryType: 'AddBackup',
            message: {
                tag: tag.value,
                backup,
                expire,
            },
        })

        //return $loader.hide()   
        const resp = await axios.post(API_URL + '/dispatch/addBackup', {
            wallet: $account.address.value, 
            chainId: $web3.mainChainId,
            tag: tag.value, 
            backup, 
            expire, 
            signature
        })
        $swal.fire({
            icon: 'success',
            title:  'Backup',
            footer: 'Please wait for transaction confirmation',
            timer: 5000,
        });
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Backup error',
            footer: error.toString(),
            timer: 30000,
        });
    }   
    $loader.hide()   
}

function generateTag() {    
    const randomArray = window.crypto.getRandomValues(new Uint8Array(8));
    const nonce = Array.from(randomArray)
        .map((b) => b.toString(16).padStart(2, "0")) // Convert each byte to hex
        .join(""); // Join all hex values into a single string
    
    console.log(nonce)
    // Create a keccak256 hash of the public key and nonce
    const hash = utils.keccak256(
        utils.defaultAbiCoder.encode(["address", "uint256"], [$account.address.value, parseInt(nonce, 16).toString()])
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
