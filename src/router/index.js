import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus' // 添加这行导入
// 引入组件（确保文件存在）
import Login from '@/views/Login.vue'
import StudentDashboard from '@/views/student/Dashboard.vue'
import StudentScore from '@/views/student/Score.vue'
import TeacherDashboard from '@/views/teacher/Dashboard.vue'
import ScoreManage from '@/views/teacher/ScoreManage.vue'
import FileUpload from '@/views/teacher/FileUpload.vue'
import Statistic from '@/views/teacher/Statistic.vue'
import NotFound from '@/views/NotFound.vue' // 直接引入404组件（避免懒加载报错）

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requireAuth: false
    }
  },
  // 学生相关路由
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: {
      requireAuth: true,
      role: 'student'
    }
  },
  {
    path: '/student/score',
    name: 'StudentScore',
    component: StudentScore,
    meta: {
      requireAuth: true,
      role: 'student'
    }
  },
  // 教师相关路由
  {
    path: '/teacher/dashboard',
    name: 'TeacherDashboard',
    component: TeacherDashboard,
    meta: {
      requireAuth: true,
      role: 'teacher'
    }
  },
  {
    path: '/teacher/score-manage',
    name: 'ScoreManage',
    component: ScoreManage,
    meta: {
      requireAuth: true,
      role: 'teacher'
    }
  },
  {
    path: '/teacher/file-upload',
    name: 'FileUpload',
    component: FileUpload,
    meta: {
      requireAuth: true,
      role: 'teacher'
    }
  },
  {
    path: '/teacher/statistic',
    name: 'Statistic',
    component: Statistic,
    meta: {
      requireAuth: true,
      role: 'teacher'
    }
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 🌟 新增：安全解析userInfo，防止JSON解析报错
const safeParseUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch (error) {
    console.warn('解析userInfo失败，将重置缓存', error);
    localStorage.removeItem('userInfo');
    return {};
  }
};

// 路由守卫：控制权限
router.beforeEach((to, from, next) => {
  // 🌟 优化：使用安全解析函数，增加容错
  let userInfo = safeParseUserInfo();
  let { token, role } = userInfo;
  // 若userInfo中无数据，从单独的存储中取
  if (!token) token = localStorage.getItem('token');
  if (!role) role = localStorage.getItem('role');

  // 🌟 新增：角色统一小写+去空格，避免大小写/空格导致的匹配失败
  if (role) role = role.toLowerCase().trim();

  // 1. 不需要登录的页面直接放行
  if (!to.meta.requireAuth) {
    next();
    return;
  }

  // 2. 需要登录但未登录：跳转登录页
  if (!token) {
    ElMessage.warning('请先登录'); // 增加提示（需引入ElMessage）
    next('/login');
    return;
  }

  // 3. 已登录但角色不匹配：跳转自己的首页
  if (to.meta.role && to.meta.role !== role) {
    const target = role === 'student' ? '/student/dashboard' : '/teacher/dashboard';
    // 🌟 优化：避免重复跳转提示（仅当目标路径与当前要访问的路径不同时提示）
    if (to.path !== target) {
      ElMessage.warning('无权限访问该页面，已为您跳转首页');
      next(target);
      return;
    }
    next();
    return;
  }

  // 4. 所有校验通过：放行
  next();
});

export default router