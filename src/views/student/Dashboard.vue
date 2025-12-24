<template>
  <div class="student-dashboard">
    <!-- 页头组件（正确闭合） -->
    <el-page-header @back="handleBack" content="我的成绩查询"></el-page-header>

    <!-- 卡片组件（正确闭合） -->
    <el-card style="margin-top: 20px;">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
            v-model="courseName"
            placeholder="输入课程名称搜索"
            style="width: 300px;"
            clearable
            @clear="handleClear"
        ></el-input> <!-- 闭合 el-input -->
        <el-button type="primary" @click="loadScores" style="margin-left: 10px;">搜索</el-button>
      </div>

      <!-- 表格组件（正确闭合） -->
      <el-table
          :data="scoreList"
          border
          style="margin-top: 10px;"
          v-loading="loading"
          empty-text="暂无成绩数据"
      >
        <el-table-column prop="courseName" label="课程名称" width="200"></el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="scope">
            <!-- 兼容分数为字符串/数字格式，处理NaN情况 -->
            <span :style="{ color: Number(scope.row.score) < 60 && !isNaN(scope.row.score) ? 'red' : '' }">
              {{ isNaN(Number(scope.row.score)) ? '无效分数' : scope.row.score }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="examTime" label="考试时间" width="200">
          <!-- 格式化考试时间，兼容时间戳/字符串 -->
          <template #default="scope">
            {{ scope.row.examTime ? new Date(scope.row.examTime).toLocaleDateString() : '暂无' }}
          </template>
        </el-table-column>
        <el-table-column prop="teacherName" label="授课教师"></el-table-column>
      </el-table> <!-- 闭合 el-table -->

      <!-- 分页组件（正确闭合，仅当有数据时显示） -->
      <el-pagination
          @current-change="handlePageChange"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          style="margin-top: 10px; text-align: right;"
          v-show="total > 0"
      ></el-pagination> <!-- 闭合 el-pagination -->
    </el-card> <!-- 闭合 el-card -->
  </div> <!-- 闭合最外层 div -->
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
  // 1. 初始化状态，避免残留数据
  loading.value = true;
  scoreList.value = [];
  total.value = 0;
  ElMessage.closeAll();

  try {
    // 2. 调用接口（传参）
    const res = await getStudentScores(pageNum.value, pageSize.value, courseName.value);
    console.log("后端返回数据：", res); // 必看！确认返回{total, list}

    // 3. 极端防错：res为null/undefined时直接兜底
    if (!res || typeof res !== "object") {
      ElMessage.info("暂无成绩数据");
      return;
    }

    // 4. 解析total和list（全量判空）
    const totalNum = Number(res.total) || 0;
    const listData = Array.isArray(res.list) ? res.list : [];

    // 5. 赋值给响应式变量
    scoreList.value = listData;
    total.value = totalNum;

    // 6. 友好提示
    if (listData.length > 0) {
      ElMessage.success(`加载成功，共 ${totalNum} 条成绩`);
    } else {
      ElMessage.info("暂无匹配的成绩数据");
    }

  } catch (err) {
    // 7. 异常处理（全量判空，避免includes报错）
    console.error("成绩加载异常：", err);
    const errMsg = err?.message || ""; // 判空！
    // 仅对网络错误提示，其他错误静默
    if (errMsg && (errMsg.includes("Network Error") || errMsg.includes("404") || errMsg.includes("500"))) {
      ElMessage.error("加载失败：网络异常，请重试");
    }
    // 兜底清空
    scoreList.value = [];
    total.value = 0;
  } finally {
    // 8. 结束加载（必执行）
    loading.value = false;
  }
};

const handlePageChange = (val) => {
  pageNum.value = val;
  loadScores();
};

const handleClear = () => {
  courseName.value = '';
  pageNum.value = 1; // 清空搜索后重置页码
  loadScores();
};

const handleBack = () => {
  router.back();
};

// 页面加载时初始化数据
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

/* 优化分页组件样式，避免文字重叠 */
:deep(.el-pagination) {
  padding: 10px 0;
}
</style>