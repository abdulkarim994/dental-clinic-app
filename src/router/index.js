import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

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

// Auth guard: redirect unauthenticated users away from protected routes
let _authGuardReady = false
export function enableAuthGuard() { _authGuardReady = true }

router.beforeEach((to) => {
  if (!_authGuardReady) return true
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  if (!requiresAuth) return true
  try {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return { name: 'login' }
  } catch {
    // Store not yet initialized
  }
  return true
})

// Prefetch adjacent tab modules after initial navigation settles
let _prefetched = false
router.afterEach(() => {
  if (_prefetched) return
  _prefetched = true
  const ric = globalThis.requestIdleCallback || ((cb) => setTimeout(cb, 100))
  ric(() => {
    import('@/modules/records/RecordsTab.vue')
    import('@/modules/patients/PatientsTab.vue')
    import('@/modules/debts/DebtsTab.vue')
  }, { timeout: 5000 })
})

export default router
