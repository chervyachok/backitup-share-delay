<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex justify-content-center">
        <router-link to="/register" custom v-slot="{ isActive, navigate }">
          <div class="px-2 pointer" :class="{ 'fw-bold': isActive }" @click="navigate()">
            Register
          </div>          
        </router-link>

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

      <div class="text-info" >Demo works on ETH Sepolia</div>
      <appkit-button />
    </div>

    <div>
      <router-view />
    </div>
  </div>

</template>

<script setup>
import { createAppKit, useAppKitAccount } from '@reown/appkit/vue'
import { wagmiAdapter, networks, projectId } from './config/index'
import { ref, provide, watch, onMounted } from 'vue';

import { getWalletClient, getConnectorClient } from '@wagmi/core'
import { useAccount } from '@wagmi/vue'
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { BuckItUpClient } from 'buckitup-sdk';


const walletClient = ref()
provide('$walletClient', walletClient)
const litClient = new LitNodeClient({
  litNetwork: LIT_NETWORK.DatilDev,
})
provide('$litClient', litClient)
const account = useAccount()
provide('$account', account)

const bukitupClient = new BuckItUpClient()
provide('$bukitupClient', bukitupClient)


const accountData = useAppKitAccount()

watch(() => account?.address?.value, async (n, o) => {
  if (n && n != o && accountData.value.isConnected) {
    console.log(n, o, wagmiAdapter.wagmiConfig)
    walletClient.value = await getWalletClient(wagmiAdapter.wagmiConfig)
  }
})


watch(() => accountData.value.isConnected, async (n, o) => {
  if (accountData.value.isConnected) {
    walletClient.value = await getWalletClient(wagmiAdapter.wagmiConfig)
    console.log('connected +', walletClient.value)
  }
})


const timestamp = ref()
provide('$timestamp', timestamp)
onMounted(async () => {
  setTimeout(function tick() {
        timestamp.value = Math.floor(Date.now().valueOf() / 1000)
        //console.log(timestamp.value)
        setTimeout(tick, 1000)
    }, 1000)
  await litClient.connect();
})



const tab = ref('register')

const metadata = {
  name: 'Buckitup',
  description: 'Buckitup Example',
  url: 'https://buckitup.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})
</script>

<style scoped></style>
