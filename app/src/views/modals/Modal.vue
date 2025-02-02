<template>
    <div class="modal fade " ref="modalElement" id="modalElement" tabindex="-1" aria-labelledby="modalElement"
        aria-hidden="true">
        <div class="modal-dialog" :class="{ 'modal-dialog-scrollable': scrollable }">
            <div class="modal-content">
                <div class="modal-header" v-if="$slots.header">
                    <slot name="header"></slot>
                </div>
                <div class="modal-body" v-if="modalId && component">
                    <template v-if="currentModal.header">
                        <!-- Header -->
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <div class="d-flex align-items-center">
                                <div class="bg-black me-2" :class="[currentModal.icon]"></div>
                                <div>
                                    <div class="fs-5">{{ currentModal.title }}</div>
                                </div>
                            </div>
                            <div class="d-flex">
                                <div class="btn _i_times bg-secondary" @click="closeModal()"></div>
                            </div>
                        </div>
                        <div class="border-bottom w-100 mt-3 mb-2"></div>
                    </template>

                    <component :is="component" :input-data="inputData"></component>
                </div>
                <div class="modal-footer" v-if="$slots.footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

</style>

<script setup>
import { Modal } from 'bootstrap';
import { ref, shallowRef, onMounted, defineAsyncComponent, inject, watch, computed } from 'vue';

//const $user = inject('$user')
const $mitt = inject('$mitt')

const scrollable = ref(null)
const modal = ref(null)
const modalId = ref(null)
const modalElement = ref(null)
const modalSizes = ['modal-sm', 'modal-lg', 'modal-xl']
let resolvePromise;

const modalRegistry = {
    'signin': {
        header: false,
        component: 'Modal_SignIn',
        modalClass: 'modal-md',
        //modalStatic: true
    },  
    'handshake': {
        header: false,
        component: 'Modal_AddContact',
        modalClass: 'modal-md',
        modalStatic: true
    },    
}

onMounted(() => {
    $mitt.on("modal::open", open);
    $mitt.on("modal::close", close);
})

const component = shallowRef(null)
const inputData = ref({})

const currentModal = computed(() => {
    return modalId.value ? modalRegistry[modalId.value] : null
})

async function open(data) {
    let id = data.id
    const registry = modalRegistry[id]

    //if ($user.auth && id === 'login') return
    //if (modalRegistry[id]?.auth && !$user.auth) {
    //    id = 'login'
    //} else {
    //    inputData.value = data
    //}

    const options = { keyboard: true, focus: false }

    if (registry.modalStatic) {
        options.backdrop = 'static'
        options.keyboard = false
    }

    modal.value = Modal.getOrCreateInstance(modalElement.value, options)
    modalElement.value.addEventListener('hidden.bs.modal', () => close())

    component.value = await defineAsyncComponent(() => import(`./registry/${registry.component}.vue`))
    modalElement.value?.classList.remove(...modalSizes)
    if (registry.modalClass) {
        modalElement.value?.classList.add(registry.modalClass)
    }

    if (!modalId.value) {
        modal.value.show()
    } else {
        modal.value.handleUpdate()
    }
    inputData.value = data
    modalId.value = id

    return new Promise((resolve) => {
        modal.value.show();
        resolvePromise = resolve; 
    });
}

const close = (res) => {
    resolvePromise(res);
    inputData.value = {}
    if (modalId.value) {
        modalId.value = null
        modal.value.hide()
    }
}
defineExpose({ open, close });
</script>
