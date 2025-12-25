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

      <!-- 注册表单（新增姓名输入框+完善验证） -->
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
          <label>姓名</label>
          <el-input
              v-model="registerForm.realName"
              placeholder="请输入姓名"
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
import { login, studentRegister, teacherRegister } from '@/api/auth';

const activeTab = ref('login');
const router = useRouter();

const loginForm = ref({ username: '', password: '' });
const registerForm = ref({
  username: '',
  password: '',
  realName: '', // 新增：姓名字段
  confirmPassword: '',
  role: 'student',
  studentId: '',
  teacherId: ''
});
const loginLoading = ref(false);
const registerLoading = ref(false);

// 登录逻辑（最终适配版）
const handleLogin = async () => {
  // 基础验证
  if (!loginForm.value.username.trim()) {
    return ElMessage.warning('请输入用户名');
  }
  if (!loginForm.value.password.trim()) {
    return ElMessage.warning('请输入密码');
  }

  loginLoading.value = true;
  try {
    // 调用登录接口（request已处理响应，直接返回data）
    const resData = await login(loginForm.value);
    console.log('登录接口返回数据:', resData);

    // 提取核心字段（匹配后端返回的result）
    const { token, role: rawRole, username } = resData;

    // 校验Token
    if (!token) {
      throw new Error('未获取到登录凭证，请重试');
    }

    // 角色标准化（后端返回STUDENT/TEACHER → 转小写）
    const role = rawRole?.toLowerCase() || '';
    if (!['student', 'teacher'].includes(role)) {
      throw new Error(`无效的角色类型：${rawRole}，仅支持学生/教师`);
    }

    // 存储用户信息（统一角色为小写，避免路由守卫误判）
    const userInfo = { ...resData, role };
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    // 跳转对应角色页面
    const targetPath = role === 'student'
        ? '/student/dashboard'
        : '/teacher/score-manage';

    ElMessage.success(`欢迎${username}，登录成功！`);
    await router.push(targetPath);

  } catch (err) {
    console.error('登录失败详情:', err);
    ElMessage.error(err.message || '登录失败，请检查用户名/密码');
  } finally {
    loginLoading.value = false;
  }
};

// 注册逻辑（适配后端格式，新增姓名字段验证）
const handleRegister = async () => {
  const { username, password, realName, confirmPassword, role, studentId, teacherId } = registerForm.value;

  // 表单验证（新增姓名非空校验）
  if (!username.trim()) return ElMessage.warning('请输入用户名');
  if (!password.trim()) return ElMessage.warning('请输入密码');
  if (!realName.trim()) return ElMessage.warning('请输入姓名'); // 新增：姓名验证
  if (password.length < 6) return ElMessage.warning('密码长度不能少于6位');
  if (password !== confirmPassword) return ElMessage.warning('两次密码输入不一致');
  if (!role) return ElMessage.warning('请选择角色');
  if (role === 'student' && !studentId.trim()) return ElMessage.warning('请输入学号');
  if (role === 'teacher' && !teacherId.trim()) return ElMessage.warning('请输入教师编号');

  registerLoading.value = true;
  try {
    // 构造注册参数（新增realName字段）
    const registerData = { username, password, realName };
    if (role === 'student') registerData.studentId = studentId;
    if (role === 'teacher') registerData.teacherId = teacherId;

    // 调用注册接口
    await (role === 'student' ? studentRegister(registerData) : teacherRegister(registerData));

    ElMessage.success('注册成功！请使用新账号登录');
    activeTab.value = 'login';
    // 清空表单
    loginForm.value = { username, password: '' };
    registerForm.value = {
      username: '',
      password: '',
      realName: '',
      confirmPassword: '',
      role: 'student',
      studentId: '',
      teacherId: ''
    };
  } catch (err) {
    ElMessage.error(err.message || '注册失败，请重试');
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