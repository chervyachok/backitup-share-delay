<template>
    <div>
        <p>Saved backups</p>
        
        <div v-if="tagsData">            
            <BackupItem v-for="tag in tagsData" :tag="tag"/>
        </div>
    </div>
</template>

<script setup>
import BackupItem from './BackupItem.vue';
import { ref, onMounted, watch, inject, computed, nextTick } from 'vue';
import { useReadContract } from '@wagmi/vue'
import { bc } from '../config/index'

const $account = inject('$account')

onMounted(async () => {
   
})

const { data: tagsData, isPending: tagsDataPending, refetch: tagsDataGet } = useReadContract({
    address: bc.vault.address,
    abi: JSON.parse(bc.vault.abijson),
    functionName: 'getTags',
    args: computed(() => [$account.address?.value]),
    enabled: computed(() => !!$account.address?.value)
});

</script>
