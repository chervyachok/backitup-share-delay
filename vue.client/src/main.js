import { createApp } from 'vue'

import App from './App.vue'

// Import our custom CSS
import './scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

import { WagmiPlugin } from '@wagmi/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { wagmiAdapter } from './config/index'
const queryClient = new QueryClient()

const app = createApp(App)

app.use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig })
app.use(VueQueryPlugin, { queryClient })
// router
import router from "./router";
app.use(router)

app.mount('#app')
