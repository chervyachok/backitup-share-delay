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
  },
  {
    path: '/backups',
    name: 'backups',
    component: () => import('../views/Backups.vue'),
  },
  {
    path: '/find',
    name: 'find',
    component: () => import('../views/Find.vue'),
  },
  {
    path: '/recover',
    name: 'recover',
    component: () => import('../views/Recover.vue'),
  },
  {
    path: '/secret',
    name: 'secret',
    component: () => import('../views/Secret.vue'),
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
