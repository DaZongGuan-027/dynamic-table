import Vue from 'vue'
import VueRouter from 'vue-router'
import UserManagement from '../views/UserManagement.vue'
import AccountingQuery from '../views/AccountingQuery.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/user'
  },
  {
    path: '/user',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: '用户管理' }
  },
  {
    path: '/accounting',
    name: 'AccountingQuery',
    component: AccountingQuery,
    meta: { title: '核算数据查询' }
  }
]

const router = new VueRouter({
  routes
})

export default router