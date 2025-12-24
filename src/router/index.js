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

// 🌟 核心优化1：安全解析userInfo，防止JSON格式错误导致页面崩溃
const safeParseUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch (error) {
    console.warn('解析userInfo失败，已重置缓存', error);
    localStorage.removeItem('userInfo');
    return {};
  }
};

// 路由守卫：控制页面访问权限
router.beforeEach((to, from, next) => {
  // 🌟 核心优化2：使用安全解析函数，提升容错性
  let userInfo = safeParseUserInfo();
  let { token, role } = userInfo;

  // 兼容多存储方式：单独存储的token/role优先级兜底
  if (!token) token = localStorage.getItem('token');
  if (!role) role = localStorage.getItem('role');

  // 🌟 核心优化3：角色统一格式化（小写+去空格），避免匹配失败
  if (role) role = role.toLowerCase().trim();

  // 1. 无需登录的页面直接放行（如登录页）
  if (!to.meta.requireAuth) {
    next();
    return;
  }

  // 2. 未登录/无token：强制跳转登录页
  if (!token) {
    ElMessage.warning('请先登录后再访问');
    next('/login');
    return;
  }

  // 3. 已登录但角色不匹配：跳转对应角色首页
  if (to.meta.role && to.meta.role !== role) {
    const target = role === 'student' ? '/student/dashboard' : '/teacher/dashboard';
    // 优化体验：仅当目标路径与当前访问路径不同时才提示
    if (to.path !== target) {
      ElMessage.warning('无权限访问该页面，已为您跳转首页');
      next(target);
      return;
    }
    next();
    return;
  }

  // 4. 所有校验通过：正常放行
  next();
});

export default router