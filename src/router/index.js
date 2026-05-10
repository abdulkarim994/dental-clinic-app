/**
 * Vue Router — tab-based navigation matching original app behavior
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/add'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/add',
    name: 'add',
    component: () => import('../pages/AddPage.vue'),
    meta: { requiresAuth: true, tab: 'add' }
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('../pages/RecordsPage.vue'),
    meta: { requiresAuth: true, tab: 'records' }
  },
  {
    path: '/treasury',
    name: 'treasury',
    component: () => import('../pages/TreasuryPage.vue'),
    meta: { requiresAuth: true, tab: 'treasury' }
  },
  {
    path: '/archive',
    name: 'archive',
    component: () => import('../pages/ArchivePage.vue'),
    meta: { requiresAuth: true, tab: 'archive' }
  },
  {
    path: '/debts',
    name: 'debts',
    component: () => import('../pages/DebtsPage.vue'),
    meta: { requiresAuth: true, tab: 'debts' }
  },
  {
    path: '/profits',
    name: 'profits',
    component: () => import('../pages/ProfitsPage.vue'),
    meta: { requiresAuth: true, tab: 'profits' }
  },
  {
    path: '/patients',
    name: 'patients',
    component: () => import('../pages/PatientsPage.vue'),
    meta: { requiresAuth: true, tab: 'patients' }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('../pages/CalendarPage.vue'),
    meta: { requiresAuth: true, tab: 'calendar' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
