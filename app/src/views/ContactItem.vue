<template>
    <div class="border rounded d-flex justify-content-between align-items-center mb-2 p-2 px-3">
        <div>
            <div>
                {{ contact.displayName }}
            </div>            
            <div>
                <a :href="$web3.blockExplorer + '/address/' + contact.address" target="_blank" rel="noopener noreferrer">
                    {{ $filters.addressShort(contact.address)  }}
                </a>
            </div>
        </div>
        <div class="d-flex flex-column align-items-end">
            <a href="#" @click.prevent="edit()">
                Edit
            </a>
            <a href="#" @click.prevent="remove()">
                Remove
            </a>            
        </div>
        
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import { useRoute } from 'vue-router';

const $user = inject('$user')
const $web3 = inject('$web3')
const $swal = inject('$swal')
const $route = useRoute()
const $loader = inject('$loader')

const { contact, mode } = defineProps({
    contact: { type: Object, required: true },
    mode: { type: String, default: true },
})

onMounted(async () => {
})

const remove = async () => {
    try {     
        const idx = $user.account.contacts.findIndex(e => e.address === contact.address)
        if (idx > -1) {
            $user.account.contacts.splice(idx, 1);
            await $encryptionManager.setData($user.toVaultFormat($user.account))
        }
    } catch (error) {
        console.log(error)        
    }   
}

const edit = async () => {
     
}

</script>