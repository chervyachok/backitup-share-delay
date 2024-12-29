<template>
    <div v-if="data">
        <div class="d-flex align-items-center justify-content-between mb-2" v-if="data.query">            
            <div class="small text-center opacity-50" v-if="!data.fetching && data.fetched && !data.items.length">
                <span v-if="noRecordsText">
                    {{ noRecordsText }}
                </span>
                <trn k="publication_copies.no_records" v-else>
                    No records
                </trn>
            </div>            

            <div class="d-flex">
                <a href="#" class="d-flex align-items-center  small" @click.prevent="getList()">
                    <span v-if="!data.fetching">
                        <trn k="publication_copies.reload">
                            Reload
                        </trn>
                    </span>
                    <span v-if="data.fetching">
                        <trn k="publication_copies.loading">
                            Loading...
                        </trn>
                    </span>
                </a>
            </div>
        </div>

        <div class="small" v-if="data.fetched">
            <BackupItem :backup="backup" v-for="(backup, $index) in data.items" :key="backup.id" />
        </div>

        <Paginate :page-count="parseInt(data.totalPages)" :click-handler="setPage"
            :force-page="parseInt(data.query.page)">
        </Paginate>
    </div>
</template>

<script setup>
import BackupItem from './BackupItem.vue';
import Paginate from '../components/Paginate.vue'

import { ref, onMounted, inject, onUnmounted } from 'vue';
import axios from 'axios';

const $web3 = inject('$web3')
const $account = inject('$account')
const $socket = inject('$socket')

const dataDefault = {
    query: { sort: 'desc', page: 1, limit: 10 },
    items: [],
    totalPages: 0,
    totalResults: 0,
    fetching: false,
    fetched: false
}

const data = ref(JSON.parse(JSON.stringify(dataDefault)))

onMounted(() => {
    $socket.on('BACKUP_UPDATE', updateData)
    data.value = JSON.parse(JSON.stringify(dataDefault))
    getList()
})

onUnmounted(async () => {
   $socket.off('BACKUP_UPDATE', updateData)
})

const updateData = async (tagUpdate) => {
    try {
        const idx = data.value.items.findIndex(b => b.tag === tagUpdate)
        if (idx > -1) {
            const bk = (await axios.get(API_URL + '/backup/get', { params: { tag: tagUpdate, chainId: $web3.mainChainId } })).data 
            data.value.items[idx] = bk      
        }     
    } catch (error) {
        console.log(error)
    }    
}

function setPage(page) {
    data.value.query.page = page
    getList()
}

async function getList() {
    data.value.fetching = true
    try {
        const res = (await axios.get(API_URL + '/backup/getList', { params: { ...data.value.query, wallet: $account.address?.value, chainId: $web3.mainChainId } })).data
        data.value.items = res.results
        data.value.totalPages = res.totalPages
        data.value.totalResults = res.totalResults
    } catch (error) {
        console.log(error)
    }
    data.value.fetched = true
    data.value.fetching = false
}

</script>
