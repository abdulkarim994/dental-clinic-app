import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'app',
    component: () => import('@/pages/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/add' },
      {
        path: 'add',
        name: 'add',
        component: () => import('@/modules/records/AddRecord.vue'),
      },
      {
        path: 'records',
        name: 'records',
        component: () => import('@/modules/records/RecordsTab.vue'),
      },
      {
        path: 'treasury',
        name: 'treasury',
        component: () => import('@/modules/treasury/TreasuryTab.vue'),
      },
      {
        path: 'archive',
        name: 'archive',
        component: () => import('@/modules/archive/ArchiveTab.vue'),
      },
      {
        path: 'debts',
        name: 'debts',
        component: () => import('@/modules/debts/DebtsTab.vue'),
      },
      {
        path: 'profits',
        name: 'profits',
        component: () => import('@/modules/profits/ProfitsTab.vue'),
      },
      {
        path: 'patients',
        name: 'patients',
        component: () => import('@/modules/patients/PatientsTab.vue'),
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/modules/calendar/CalendarTab.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
