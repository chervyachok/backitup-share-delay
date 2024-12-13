<template>
    <div>
        <p>Secret restore</p>

        <div class="mb-2 fw-bold">Provide required shares</div>

        <div class="mb-3" v-for="(share, idx) in shares">
            <label class="form-label">Share #{{ idx + 1 }}</label>
            <textarea class="form-control" rows="3" v-model="shares[idx]"></textarea>
        </div>

        <div>
            <button class="btn btn-primary mb-2 me-2" @click="shares.push('')">
                Add share
            </button>
        </div>

        <div v-if="shares.find(v => v?.trim().length)">
            <button class="btn btn-primary mb-2 me-2" @click="recover()">
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
const $bukitupClient = inject('$bukitupClient')

const recover = () => {
    try {
        secretText.value = $bukitupClient.recoverSecret(shares.value.filter(v => v?.trim().length));
    } catch (error) {
        console.log(error)
    }
    
}


</script>