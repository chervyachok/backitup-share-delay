<template>
    <!-- Header -->                                
    <div class="p-2">
        <Account_Info :account-in="account" @update="updateAccount" class="mb-3" v-if="account?.address"/>
        <div class="row justify-content-center gx-2 mt-3">
            <div class="col-lg-12 col-xl-10">                        
                <button type="button" class="btn btn-dark w-100" @click="create()">Create</button>
            </div>            
        </div> 
    </div>    
</template>

<style lang="scss" scoped>

</style>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import { Wallet } from 'ethers';
import Account_Info from '@/components/Account_Info.vue';

const $web3 = inject('$web3')
const $user = inject('$user')
const $mitt = inject('$mitt')
const $enigma = inject('$enigma')
const $router = inject('$router')
const $encryptionManager = inject('$encryptionManager')

const account = ref()

onMounted(async () => {
    const keys = $enigma.generateKeypair()
    const privateKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.privateKey)
    const publicKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.publicKey)

    const wallet = new Wallet(privateKeyHex);
    const signature = await wallet.signMessage(privateKeyHex)
    const meta = await $web3.bukitupClient.generateKeysFromSignature(signature)

    const acc = {
        address: wallet.address,
        privateKey: privateKeyHex,
        privateKeyB64: keys.privateKey,
        publicKey: publicKeyHex,
        publicKeyB64: keys.publicKey,
        metaPublicKey: meta.spendingKeyPair.account.publicKey,
        metaPrivateKey: meta.spendingKeyPair.privatekey,
        rooms: [],
        contacts: [],
    }

    account.value = acc
})

const updateAccount = (c) => {
    account.value = c 
}

const create = async () => {   
    $user.account = account.value
    $user.vaults.push(account.value)
    
    $mitt.emit('modal::close')
    $router.push({ name: 'account_info'})
    
    return
     
    await $encryptionManager.createVault({
        keyOptions: {
            username: account.value.name,
            displayName: account.value.name,
        },
        address: account.value.address
    })

    await $encryptionManager.setData($user.toVaultFormat(account.value))
    $user.account = account.value
    vaults.value = await $encryptionManager.getVaults()

    closeModal()
    mode.value = null
}

</script>
