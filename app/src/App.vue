<template>
  <div class="container">
    
    <div class="d-flex justify-content-center mb-2 pt-2">
      
      <div>
        <button type="button" class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            {{ $route.meta.name }}
        </button>
        <div class="dropdown-menu">
          <router-link to="/backup" custom v-slot="{ isActive, navigate }">
            <a class="dropdown-item" href="#" :class="{ 'fw-bold': isActive }" @click.prevent="navigate()">
              Backup
            </a>
          </router-link>
          <router-link to="/backups" custom v-slot="{ isActive, navigate }">
            <a class="dropdown-item" href="#" :class="{ 'fw-bold': isActive }" @click.prevent="navigate()">
              Backups
            </a>
          </router-link>
          <router-link to="/find" custom v-slot="{ isActive, navigate }">
            <a class="dropdown-item" href="#" :class="{ 'fw-bold': isActive }" @click.prevent="navigate()">
              Find
            </a>
          </router-link>
          <router-link to="/recover" custom v-slot="{ isActive, navigate }">
            <a class="dropdown-item" href="#" :class="{ 'fw-bold': isActive }" @click.prevent="navigate()">
              Recover
            </a>
          </router-link>
          <router-link to="/secret" custom v-slot="{ isActive, navigate }">
            <a class="dropdown-item" href="#" :class="{ 'fw-bold': isActive }" @click.prevent="navigate()">
              Secret
            </a>
          </router-link>
          <router-link to="/contacts" custom v-slot="{ isActive, navigate }">
            <a class="dropdown-item" href="#" :class="{ 'fw-bold': isActive }" @click.prevent="navigate()">
              Contacts
            </a>
          </router-link>
        </div>
      </div>
      
        

      <button class="btn btn-primary ms-3" @click="$modal.open({ id: 'signin' })">
        {{ $user.account ? $user.account.displayName + ' - ' + $filters.addressShort($user.account.address) : 'Connect' }}          
      </button>
   </div>

    <div class="d-flex justify-content-center mb-2">
      
    </div>

    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-12 col-lg-8">
          <Register v-if="$user.account" />
    
          <div v-if="$user.account || ['secret'].includes($route.name)">
            <router-view />
          </div>

          <div class="text-warning text-center">Demo works on ETH Sepolia</div>
          </div>

        </div>
      </div>

    

    <Loader />
    <Modal  ref="$modal" />

  </div>
</template>

<script setup>
import Loader from './components/Loader.vue';
import Register from "./views/Register.vue"
import Modal from './views/modals/Modal.vue';
import { ref, provide, watch, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';

const $route = useRoute()
const $socket = inject('$socket')
const $mitt = inject('$mitt')
const $user = inject('$user')

const $modal = ref()
provide('$modal', $modal);

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
  if ($user.account?.address && $user.account?.address.toLowerCase() === wallet.toLowerCase()) {
    $mitt.emit('WALLET_UPDATE')
  }
}

</script>

