<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-2 pt-2">
      <div class="d-flex justify-content-center">


        <router-link to="/backup" custom v-slot="{ isActive, navigate }">
          <div class="px-2 pointer" :class="{ 'fw-bold': isActive }" @click="navigate()">
            Backup
          </div>
        </router-link>

        <router-link to="/backups" custom v-slot="{ isActive, navigate }">
          <div class="px-2 pointer" :class="{ 'fw-bold': isActive }" @click="navigate()">
            Backups
          </div>
        </router-link>

        <router-link to="/find" custom v-slot="{ isActive, navigate }">
          <div class="px-2 pointer" :class="{ 'fw-bold': isActive }" @click="navigate()">
            Find
          </div>
        </router-link>

        <router-link to="/recover" custom v-slot="{ isActive, navigate }">
          <div class="px-2 pointer" :class="{ 'fw-bold': isActive }" @click="navigate()">
            Recover
          </div>
        </router-link>

        <router-link to="/secret" custom v-slot="{ isActive, navigate }">
          <div class="px-2 pointer" :class="{ 'fw-bold': isActive }" @click="navigate()">
            Secret
          </div>
        </router-link>
      </div>
      <appkit-button />
    </div>

    <Register v-if="account?.address?.value" />
    
    <div v-if="($web3.keyPair && $web3.registered) || ['secret'].includes($route.name)">
      <router-view />
    </div>

    <div class="text-warning text-center">Demo works on ETH Sepolia</div>

    <Loader />

  </div>
</template>

<script setup>
import Loader from './components/Loader.vue';
import Register from "./views/Register.vue"

import { createAppKit, useAppKitAccount } from '@reown/appkit/vue'
import { ref, provide, watch, onMounted, inject } from 'vue';
import { useAccount } from '@wagmi/vue'
import { useRoute } from 'vue-router';

const $route = useRoute()
const $socket = inject('$socket')
const $mitt = inject('$mitt')
const $web3 = inject('$web3')

const account = useAccount()
watch(() => account?.address?.value, async (n, o) => {
  console.log('app watch account?.address?.value')
  $web3.setKeyPair(null)
})
provide('$account', account)

createAppKit($web3.appKitConfig)

const accountData = useAppKitAccount()  
watch(() => accountData.value.isConnected, async (n, o) => {
  console.log('app watch accountData.value.isConnected')
  $web3.setKeyPair(null)
})

const timestamp = ref()
provide('$timestamp', timestamp)
onMounted(async () => {
  $socket.on('WALLET_UPDATE', walletUpdateListener)
  setTimeout(function tick() {
    timestamp.value = Math.floor(Date.now().valueOf() / 1000)
    //console.log(timestamp.value)
    setTimeout(tick, 1000)
  }, 1000)
  
})

const walletUpdateListener = async (wallet) => {
  if (account?.address?.value && account?.address?.value.toLowerCase() === wallet.toLowerCase()) {
    $mitt.emit('WALLET_UPDATE')
  }
}

</script>

