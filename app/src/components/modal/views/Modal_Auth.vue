<template> 
    
    <!-- Header -->                                
    <div class="d-flex align-items-center justify-content-between mb-2">                    
        <div class="d-flex align-items-center">
            <div class=" fs-5">
                Accounts                
            </div>
        </div>

        <div class="d-flex">
            <a href="#" target="_blank" @click.prevent="closeModal()" rel="noopener noreferrer">
                X
            </a>
        </div>
    </div>

    <div class="border rounded mb-2 p-2 px-3" 
        v-for="(vault, index) in vaults"
        :class="{ 'border-primary' : $user.account?.address === vault.address }"
        >
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <div>
                    {{ vault.displayName }}
                </div>
                <div>
                    {{ vault.username }}
                </div>    
            </div>
            
            <button class="btn btn-outline-primary " @click="signin(vault.id)" v-if="$user.account?.address !== vault.address">
                Connect 
            </button>
            <button class="btn btn-outline-primary " @click="disconnect()" v-if="$user.account?.address === vault.address">
                Disconnect 
            </button>   
            
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <a :href="$web3.blockExplorer + '/address/' + vault.address" target="_blank" rel="noopener noreferrer">
                    {{ $filters.addressShort(vault.address)  }}
                </a>
                <a href="#" @click.prevent="copyToClipboard(vault.address)" class="ms-3">Copy</a>
            </div>
             
            <div v-if="$user.account?.address === vault.address">
                <a href="#" target="_blank" @click.prevent="backupSet(index)" rel="noopener noreferrer" class="me-3">
                    Backup
                </a>
                <a href="#" target="_blank" @click.prevent="remove()" rel="noopener noreferrer">
                    Remove
                </a>
            </div>
        </div>
        <div v-if="index == backupSelected && $user.account?.address === vault.address">
            <div class="mb-2">
                <label for="exampleFormControlInput1" class="form-label">
                    Password                 
                </label>
                <input                
                    class="form-control"
                    placeholder="Enter your password"
                    type="text"                
                    v-model="backupPassword"  
                />  
            </div>
            <button class="btn btn-outline-primary " @click="backup()">
                Backup 
            </button>
        </div>
    </div>

    <div class="d-flex justify-content-center align-items-center">
        <button class="btn  mx-1" :class="[mode === 'register' ? 'btn-primary' : 'btn-outline-primary' ]" @click="setMode('register')">Register new account</button>
        <input type="file" ref="fileInput" accept=".data" style="height: 0px; width: 0px;"  @change="handleRestore()"/>
        <button class="btn btn-outline-primary mx-1" @click="$refs.fileInput.click()">Restore from backup</button>
    </div>   

    <div v-if="mode === 'restore' && !account">
        <div class="mb-2">
            <label for="exampleFormControlInput1" class="form-label">
                Password                 
            </label>
            <input                
                class="form-control"
                placeholder="Enter your password"
                type="text"                
                v-model="restorePassword"  
            />  
        </div>
        <button class="btn btn-outline-primary " @click="decrypt()">
            Decrypt 
        </button>
    </div>
    
    <div v-if="mode === 'register' || (mode === 'restore' && account)" class="mt-3">
        <div class="mb-2">
            <label for="exampleFormControlInput1" class="form-label">
                Public name (Passkey)                     
            </label>
            <input                
                class="form-control"
                placeholder="Enter your Public name"
                type="text"                
                v-model="account.displayName"  
            />  
        </div>
        
        <div class="mb-2">
            <label for="exampleFormControlInput1" class="form-label">
                Username                 
            </label>
            <input                
                class="form-control"
                placeholder="Enter your Username"
                type="text"                
                v-model="account.username"  
            />  
        </div>
        
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <label for="exampleFormControlInput1" class="form-label">
                    Address                
                </label>
                <a href="#" @click="generate()" v-if="mode === 'register'">Regenerate</a>
            </div>            
            <input                
                class="form-control"
                disabled
                type="text"                
                v-model="account.address"                   
            />  
        </div>        

        <div class="d-flex justify-content-center align-items-center">
            <button class="btn btn-primary mx-1" @click="createIdentity()">
                <span v-if="mode === 'register'">Create account</span>
                <span v-if="mode === 'restore'">Restore account</span>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped> 
	    
</style>

<script setup> 
import { clearLockKeyCache } from "@lo-fi/local-data-lock";   
import copyToClipboard from '@/libs/copyToClipboard';    
    import { computed, inject, ref, onMounted, onUnmounted, watch } from 'vue';
    import { Wallet } from 'ethers';
    import { Client } from '@dxos/client';

    // create a client
    const client = new Client();
     
    const { inputData } = defineProps({ inputData: { type: Object, required: true } })
    const $mitt = inject('$mitt')
    const $loader = inject('$loader')
    const $web3 = inject('$web3')
    const $user = inject('$user')
    const $swal = inject('$swal')    
    
    const $enigma = inject('$enigma')  
    const $encryptionManager = inject('$encryptionManager')  

    const mode = ref()
    const account = ref({})
    const vaults = ref([])

    const fileInput = ref()
 
    onMounted(async () => {   
        vaults.value = await $encryptionManager.getVaults() 

        await client.initialize();
    })
    
    const generate = async () => {
        const keys = $enigma.generateKeypair()
        const privateKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.privateKey)
        const publicKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.publicKey)
       
        const wallet = new Wallet(privateKeyHex);
        const signature = await wallet.signMessage(privateKeyHex)  
        const meta = await $web3.bukitupClient.generateKeysFromSignature(signature)
        
        account.value.address = wallet.address

        account.value.privateKey = privateKeyHex
        account.value.privateKeyB64 = keys.privateKey

        account.value.publicKey = publicKeyHex
        account.value.publicKeyB64 = keys.publicKey
        
        account.value.metaPublicKey = meta.spendingKeyPair.account.publicKey
        account.value.metaPrivateKey = meta.spendingKeyPair.privatekey
        account.value.rooms = []
        account.value.contacts = []
       
        console.log('account.value', account.value)

        let  idtt = client.halo.identity.get()
        if (!idtt) {
            idtt = await client.halo.createIdentity();
        }
        console.log('idtt', client.halo.credentials)
        // get a list of all spaces
        const spaces = client.spaces.get();
        console.log('spaces', spaces)
    }
    
    const createIdentity = async () => {
        await disconnect()
        await $encryptionManager.createVault({
            keyOptions: {
               username: account.value.username,
               displayName: account.value.displayName,
            },
            address: account.value.address
        })
               
        await $encryptionManager.setData($user.toVaultFormat(account.value))     
        $user.account = account.value
        vaults.value = await $encryptionManager.getVaults()  
        
        closeModal()
        mode.value = null
    }

    const signin = async (vaultID) => {
        $loader.show()
        try {
            await disconnect()
            await $encryptionManager.connectToVault(vaultID)
            if ($encryptionManager.isAuth) {
                $user.account = await $user.fromVaultFormat(await $encryptionManager.getData()) 
                console.log($user.account)
            
                const info = vaults.value.find(v => v.id === vaultID)
                $user.account.username = info?.username
                $user.account.displayName = info?.displayName
            }
            
            closeModal()
        } catch (error) {
            console.log('signin', error)
        }
        $loader.hide()
    }


    const backupSelected = ref(null)
    const backupPassword = ref(null)
    const backupSet = async (index) => {
        if (backupSelected.value === null) {
            backupSelected.value = index
        } else {
            backupSelected.value = null
        }        
        backupPassword.value = null       
    }

    const backup = async () => {
        const backup = {
            account: $user.account
        }
        const jsonString = JSON.stringify(backup, null, 2);
        let backupString
        if (backupPassword.value) {
            const base64PlainData = btoa(jsonString);
            const base64Password = btoa(backupPassword.value);
            backupString = $enigma.encryptData(base64PlainData, base64Password);
        } else {
            backupString = jsonString
        }
        
        const blob = new Blob([backupString], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = $user.account.displayName + `.data`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        backupSelected.value = null                
        backupPassword.value = null       
    }

    const fileString = ref()
    const restorePassword = ref()
    const handleRestore = async () => {
        account.value = null
        fileString.value = null
        const file = Array.from(event.target.files)[0];
        const reader = new FileReader();

        // When the file is loaded, attempt decryption.
        reader.onload = (event) => {
            fileString.value = event.target.result;
            let data
            try {
                data = JSON.parse(fileString)
                console.log(data)
                account.value = data.account
            } catch (error) {
                console.log(error)
            }
            mode.value = 'restore'
        };

        // Read the file as text (which should be a Base64 string).
        reader.readAsText(file);     
    }
    
    const decrypt = async () => {
        
        
        // Convert the entered password to Base64.
        const base64Password = btoa(restorePassword.value);
        try {
            // Derive key and IV from the Base64 password.
            const decryptedBase64 = $enigma.decryptData(fileString.value, base64Password);
            
            // Convert Base64-encoded JSON back to a plain JSON string.
            const jsonString = atob(decryptedBase64);
            // Parse the JSON string into an object.
            const data = JSON.parse(jsonString);
            account.value = data.account
            
        } catch (err) {
            console.error(err);
            
        }
  
    }

    const disconnect = async () => {
        await $encryptionManager.disconnect()
        clearLockKeyCache()
        $user.account = null        
    }

    const remove = async () => {        
        await $encryptionManager.removeVault()
        clearLockKeyCache()
        $user.account = null       
        vaults.value = await $encryptionManager.getVaults()           
    }

    function setMode(m) {  
        if (mode.value === m) return mode.value = null
        mode.value = m
        if (m === 'register') {
            generate()
        }
    }
    
    function closeModal() {  
        $mitt.emit('modal::close')
    }
</script>
