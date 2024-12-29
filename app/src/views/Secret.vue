<template>
    <div>
        <div class="mb-2 fw-bold">Provide required shares</div>

        <div class="mb-2" v-for="(share, idx) in shares">
            <label class=" ">Share #{{ idx + 1 }}</label>
            <textarea class="form-control" rows="3" v-model="shares[idx]"></textarea>
        </div>

        <div class="d-flex">
            <button class="btn btn-primary mb-2 me-2" @click="shares.push('')">
                Add share
            </button>
            <button class="btn btn-primary mb-2 me-2" @click="recover()" v-if="shares.find(v => v?.trim().length)">
                Restore secret
            </button>
        </div>

        <div class="form-floating mb-3 " v-if="secretText">
            <input type="text" v-model="secretText" class="form-control" id="secretText" placeholder="secretText">
            <label for="secretText">Secret Text</label>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed  } from 'vue';

const shares = ref([''])
const secretText = ref()
const $web3 = inject('$web3')
const $swal = inject('$web3')

const recover = () => {
    try {
        secretText.value = $web3.bukitupClient.recoverSecret(shares.value.filter(v => v?.trim().length));
    } catch (error) {
        console.log(error)
        $swal.fire({
            icon: 'error',
            title: 'Recover error',
            footer: error.toString(),
            timer: 30000,
        });
    }    
}
</script>