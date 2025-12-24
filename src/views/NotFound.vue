<template>
  <div class="not-found">
    <div class="content">
      <h1 class="code">404</h1>
      <p class="msg">抱歉，你访问的页面不存在</p>
      <div class="actions">
        <el-button
            type="primary"
            @click="goBack"
        >
          返回上一页
        </el-button>
        <el-button
            @click="goHome"
        >
          回到首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const router = useRouter();

// 返回上一页
const goBack = () => {
  window.history.back();
};

// 回到首页（根据登录状态跳转）
const goHome = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (userInfo.role === 'student') {
    router.push('/student/dashboard');
  } else if (userInfo.role === 'teacher') {
    router.push('/teacher/dashboard');
  } else {
    router.push('/login');
  }
};

// 记录错误路径（调试用）
onMounted(() => {
  console.log('访问不存在的路径：', window.location.pathname);
});
</script>

<style scoped>
.not-found {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.content {
  text-align: center;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.code {
  font-size: 80px;
  font-weight: bold;
  color: #1890ff;
  margin: 0 0 20px 0;
}

.msg {
  font-size: 18px;
  color: #666;
  margin: 0 0 30px 0;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>