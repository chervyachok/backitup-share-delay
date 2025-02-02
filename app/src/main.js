import { createApp } from 'vue'

import App from './App.vue'

// Import our custom CSS
import './scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

import { WagmiPlugin } from '@wagmi/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import { web3Store } from "./store/web3.store.js";
import { userStore } from "./store/user.store.js";
import { createPinia } from 'pinia'
import $socket from './libs/socket';
import $mitt from './libs/emitter';	
import { useLoader } from "./store/loader.store.js";
import $swal from './libs/swal'

// dayjs
import dayjs from "dayjs"; 
import relativeTime from "dayjs/plugin/relativeTime"; 
dayjs.locale('en')
dayjs.extend(relativeTime)

// globalFilters
import globalFilters from "./libs/filters"
import * as $enigma from './libs/enigma';
import { EncryptionManager } from './libs/EncryptionManager';

const queryClient = new QueryClient()
const app = createApp(App)

// Pinia
app.use(createPinia())

// mitt
app.provide('$mitt', $mitt)
app.config.globalProperties.$mitt = $mitt;

app.config.globalProperties.$date = dayjs
app.provide('$date', dayjs)

app.provide('$isProd', !location.origin.includes("localhost") )
app.config.globalProperties.$isProd = !location.origin.includes("localhost")

app.config.globalProperties.$filters = globalFilters
app.config.globalProperties.$location = window.location

app.provide('$socket', $socket)

// web3Store
app.config.globalProperties.$web3 = web3Store()
app.provide('$web3', web3Store())

app.config.globalProperties.$user = userStore()
app.provide('$user', userStore())


app.config.globalProperties.$loader = useLoader();
app.provide('$loader', useLoader())

app.provide('$enigma', $enigma);
app.provide('$encryptionManager', new EncryptionManager);


app.config.globalProperties.$swal = $swal;
app.provide('$swal', $swal)

app.use(WagmiPlugin, { config: web3Store().wagmiAdapter.wagmiConfig })
app.use(VueQueryPlugin, { queryClient })
// router
import router from "./router";
app.use(router)

app.mount('#app')
