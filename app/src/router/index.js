import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: '/backup',
  },  
  {
    path: '/backup',
    name: 'backup',
    component: () => import('../views/Backup.vue'),
    meta: { name: 'Backup' }
  },
  {
    path: '/backups',
    name: 'backups',
    component: () => import('../views/Backups.vue'),
    meta: { name: 'Backups' }
  },
  {
    path: '/find',
    name: 'find',
    component: () => import('../views/Find.vue'),
    meta: { name: 'Find' }
  },
  {
    path: '/recover',
    name: 'recover',
    component: () => import('../views/Recover.vue'),
    meta: { name: 'Recover' }
  },
  {
    path: '/secret',
    name: 'secret',
    component: () => import('../views/Secret.vue'),
    meta: { name: 'Secret' }
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('../views/Contacts.vue'),
    meta: { name: 'Contacts' }
  },

  
 
  {
    path: '/:pathMatch(.*)*',
    redirect: '/backup',
  },
];

const router = createRouter({
  //history: createWebHistory(BASE_URL),
  history: createWebHistory(),
  routes,
  
});



export default router;
