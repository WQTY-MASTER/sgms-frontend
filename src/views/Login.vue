<template>
  <div class="login-container">
    <div class="login-box">
      <h1>学生成绩管理系统</h1>

      <!-- 登录/注册标签页 -->
      <div class="tabs">
        <span
            class="tab"
            :class="{ active: activeTab === 'login' }"
            @click="activeTab = 'login'"
        >登录</span>
        <span
            class="tab"
            :class="{ active: activeTab === 'register' }"
            @click="activeTab = 'register'"
        >注册</span>
      </div>

      <!-- 登录表单 -->
      <el-form class="form" v-if="activeTab === 'login'">
        <div class="form-item">
          <label>用户名</label>
          <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              clearable
              maxlength="20"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
              maxlength="20"
          />
        </div>

        <el-button
            type="primary"
            class="submit-btn"
            @click="handleLogin"
            :loading="loginLoading"
        >
          登录
        </el-button>
      </el-form>

      <!-- 注册表单 -->
      <el-form class="form" v-if="activeTab === 'register'">
        <div class="form-item">
          <label>用户名</label>
          <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              clearable
              maxlength="20"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
              maxlength="20"
          />
        </div>

        <div class="form-item">
          <label>确认密码</label>
          <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              clearable
              maxlength="20"
          />
        </div>

        <div class="form-item">
          <label>角色</label>
          <el-select
              v-model="registerForm.role"
              placeholder="请选择角色"
              clearable
          >
            <el-option label="学生" value="student"></el-option>
            <el-option label="教师" value="teacher"></el-option>
          </el-select>
        </div>

        <div class="form-item" v-if="registerForm.role === 'student'">
          <label>学号</label>
          <el-input
              v-model="registerForm.studentId"
              placeholder="请输入学号"
              clearable
          />
        </div>

        <div class="form-item" v-if="registerForm.role === 'teacher'">
          <label>教师编号</label>
          <el-input
              v-model="registerForm.teacherId"
              placeholder="请输入教师编号"
              clearable
          />
        </div>

        <el-button
            type="primary"
            class="submit-btn"
            @click="handleRegister"
            :loading="registerLoading"
        >
          注册
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
// 确保api/auth.js存在且导出了对应的函数
import { login, studentRegister, teacherRegister } from '@/api/auth';

// 控制表单切换（登录/注册）
const activeTab = ref('login');
// 路由实例
const router = useRouter();

// 登录表单数据
const loginForm = ref({
  username: '',
  password: ''
});
// 注册表单数据
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'student', // 默认学生角色
  studentId: '',
  teacherId: ''
});

// 加载状态（防止重复提交）
const loginLoading = ref(false);
const registerLoading = ref(false);

// 登录逻辑
const handleLogin = async () => {
  // 表单验证
  if (!loginForm.value.username.trim()) {
    return ElMessage.warning('请输入用户名');
  }
  if (!loginForm.value.password.trim()) {
    return ElMessage.warning('请输入密码');
  }

  loginLoading.value = true; // 显示加载中
  try {
    // 调用登录接口
    const res = await login(loginForm.value);
    console.log('登录接口返回数据:', res); // 调试信息

    // 验证接口返回格式（兼容两种常见格式：{code, data} 或 直接返回data）
    const responseData = res.code ? res.data : res;
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('登录失败：服务器返回数据格式错误');
    }

    // 提取token和role（兼容不同字段名 + 统一转为小写）
    const token = responseData.token || responseData.accessToken;
    let role = (responseData.role || responseData.userRole)?.toLowerCase();

    // 校验token和role有效性
    if (!token) {
      throw new Error('登录失败：未获取到登录凭证');
    }
    if (!role || !['student', 'teacher'].includes(role)) {
      throw new Error(`登录失败：无效的角色类型【${role}】，仅支持学生/教师`);
    }

    // 🌟 关键：存储用户信息（与路由守卫逻辑完全对齐）
    const userInfo = { token, role };
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('token', token);
    localStorage.setItem('role', role); // 确保存储为小写

    // 🌟 核心修正：教师默认跳成绩管理页，学生跳自己的首页
    const targetPath = role === 'student'
        ? '/student/dashboard'
        : '/teacher/score-manage'; // 教师跳成绩管理页（而非dashboard）

    // 执行跳转（优化体验：先提示成功，再跳转）
    ElMessage.success(`欢迎${role === 'student' ? '同学' : '老师'}，登录成功！`);
    await router.push(targetPath);

  } catch (err) {
    console.error('登录错误详情:', err); // 调试信息
    // 细化错误提示，提升用户体验
    let errorMsg = '登录失败，请重试';
    if (err.message) {
      errorMsg = err.message;
    } else if (err.response?.data?.msg) {
      errorMsg = err.response.data.msg;
    } else if (err.response?.status === 401) {
      errorMsg = '用户名或密码错误';
    } else if (err.response?.status === 500) {
      errorMsg = '服务器内部错误，请联系管理员';
    }
    ElMessage.error(errorMsg);
  } finally {
    loginLoading.value = false; // 关闭加载中
  }
};

// 注册逻辑
const handleRegister = async () => {
  // 表单验证（增强版）
  const { username, password, confirmPassword, role, studentId, teacherId } = registerForm.value;
  if (!username.trim()) return ElMessage.warning('请输入用户名');
  if (!password.trim()) return ElMessage.warning('请输入密码');
  if (password.length < 6) return ElMessage.warning('密码长度不能少于6位');
  if (password !== confirmPassword) return ElMessage.warning('两次密码输入不一致');
  if (!role) return ElMessage.warning('请选择角色（学生/教师）');
  if (role === 'student' && !studentId.trim()) return ElMessage.warning('请输入学号');
  if (role === 'teacher' && !teacherId.trim()) return ElMessage.warning('请输入教师编号');

  registerLoading.value = true;
  try {
    // 根据角色调用不同注册接口
    const registerData = {
      username,
      password,
      ...(role === 'student' ? { studentId } : { teacherId })
    };
    const res = role === 'student'
        ? await studentRegister(registerData)
        : await teacherRegister(registerData);

    // 兼容注册接口返回格式
    if (res.code && res.code !== 200) {
      throw new Error(res.msg || '注册失败');
    }

    ElMessage.success('注册成功！请使用新账号登录');
    activeTab.value = 'login'; // 切换到登录表单
    // 自动填充用户名，清空密码
    loginForm.value = { username, password: '' };
    // 清空注册表单
    registerForm.value = {
      username: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      studentId: '',
      teacherId: ''
    };
  } catch (err) {
    console.error('注册错误详情:', err); // 调试信息
    const errorMsg = err.response?.data?.msg || err.message || '注册失败，请检查信息后重试';
    ElMessage.error(errorMsg);
  } finally {
    registerLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.login-box {
  width: 420px;
  padding: 36px 40px 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.login-box h1 {
  margin: 0 0 24px;
  text-align: center;
  font-size: 24px;
  color: #1d2129;
}

.tabs {
  display: flex;
  margin-bottom: 28px;
  border-bottom: 1px solid #f2f3f5;
}

.tab {
  padding: 0 12px 11px;
  margin: 0 12px;
  cursor: pointer;
  font-size: 16px;
  color: #86909c;
  position: relative;
  flex: 1;
  text-align: center;
  transition: color 0.2s;
}

.tab.active {
  color: #1890ff;
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 2px;
  background: #1890ff;
}

.form {
  width: 100%;
}

.form-item {
  margin-bottom: 20px;
  text-align: left;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #4e5969;
}

.submit-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

/* 适配Element Plus组件样式 */
:deep(.el-input), :deep(.el-select) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

/* 优化加载按钮样式 */
:deep(.el-button--loading .el-button__text) {
  visibility: visible;
}
</style>