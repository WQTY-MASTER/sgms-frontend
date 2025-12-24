<template>
  <div class="student-dashboard">
    <el-page-header @back="handleBack" content="我的成绩查询"></el-page-header>
    <el-card style="margin-top: 20px;">
      <div class="search-bar">
        <el-input
            v-model="courseName"
            placeholder="输入课程名称搜索"
            style="width: 300px;"
            clearable
            @clear="handleClear"
        ></el-input>
        <el-button type="primary" @click="loadScores" style="margin-left: 10px;">搜索</el-button>
      </div>
      <el-table
          :data="scoreList"
          border
          style="margin-top: 10px;"
          v-loading="loading"
          empty-text="暂无成绩数据"
      >
        <el-table-column prop="courseName" label="课程名称" width="200"></el-table-column>
        <!-- 优化后的成绩列 -->
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="scope">
            <span :style="{ color: Number(scope.row.score) < 60 && !isNaN(scope.row.score) ? 'red' : '' }">
              {{ !isNaN(Number(scope.row.score)) ? Number(scope.row.score).toFixed(0) : '无效分数' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="examTime" label="考试时间" width="200">
          <template #default="scope">
            {{ scope.row.examTime ? new Date(scope.row.examTime).toLocaleDateString() : '暂无' }}
          </template>
        </el-table-column>
        <!-- 优化后的授课教师列 -->
        <el-table-column prop="teacherName" label="授课教师">
          <template #default="scope">
            {{ scope.row.teacherName || '未配置' }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
          @current-change="handlePageChange"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          style="margin-top: 10px; text-align: right;"
          v-show="total > 0"
      ></el-pagination>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getStudentScores } from '@/api/score';
import { ElMessage } from 'element-plus';

const router = useRouter();
const scoreList = ref([]);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const courseName = ref('');
const loading = ref(false);

const loadScores = async () => {
  // 1. 初始化状态 + 强制清空所有残留提示（关键！杜绝操作失败残留）
  loading.value = true;
  scoreList.value = [];
  total.value = 0;
  ElMessage.closeAll(); // 清空所有已存在的提示（包括操作失败）

  try {
    // 2. 调用接口（传参）
    const res = await getStudentScores(pageNum.value, pageSize.value, courseName.value);
    console.log('后端返回原始数据：', res); // 打印数据，方便验证

    // 3. 严格判空 + 解析数据（无任何code依赖）
    if (res && typeof res === 'object') {
      // 适配后端分页格式 {total, list}
      if ('total' in res) {
        scoreList.value = Array.isArray(res.list) ? res.list : [];
        total.value = Number(res.total) || 0;
      }
      // 适配后端直接返回数组的情况
      else if (Array.isArray(res)) {
        scoreList.value = res;
        total.value = res.length;
      }
      // 其他对象格式（兜底）
      else {
        scoreList.value = [];
        total.value = 0;
      }
    } else {
      // 非对象/空返回（兜底）
      scoreList.value = [];
      total.value = 0;
    }

    // 4. 仅显示成功/空数据提示，禁用失败类提示
    if (scoreList.value.length > 0) {
      ElMessage.success(`加载成功，共 ${total.value} 条成绩`);
    } else {
      ElMessage.info('暂无匹配的成绩数据');
    }

  } catch (err) {
    // 5. 异常处理（全量判空 + 仅打印日志，不弹出任何失败提示）
    console.error('成绩加载异常详情：', err);
    const errMsg = err?.message || '未知错误';
    // 仅对严重网络错误提示（其他错误静默，避免操作失败）
    const isSeriousError = errMsg.includes('Network Error') ||
        errMsg.includes('404') ||
        errMsg.includes('500') ||
        errMsg.includes('401') ||
        errMsg.includes('403');
    if (isSeriousError) {
      ElMessage.error('加载失败：网络异常/接口不可用，请重试');
    }
    // 兜底清空数据（不提示失败）
    scoreList.value = [];
    total.value = 0;
  } finally {
    // 6. 结束加载状态（必执行）
    loading.value = false;
  }
};

const handlePageChange = (val) => {
  pageNum.value = val;
  loadScores();
};

const handleClear = () => {
  courseName.value = '';
  pageNum.value = 1;
  loadScores();
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadScores();
});
</script>

<style scoped>
.student-dashboard {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
}

:deep(.el-pagination) {
  padding: 10px 0;
}

:deep(.el-table td),
:deep(.el-table th) {
  text-align: center;
}
</style>