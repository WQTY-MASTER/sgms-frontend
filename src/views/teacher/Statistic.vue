<template>
  <div class="score-container">
    <!-- 成绩管理模块 -->
    <div class="score-manage">
      <h2>成绩管理</h2>

      <!-- 成绩录入表单 -->
      <el-form :model="scoreForm" inline @submit.prevent>
        <el-form-item label="课程">
          <el-select
              v-model="scoreForm.courseId"
              placeholder="选择课程"
              @change="onCourseChange"
              :disabled="loading || loadingStat"
          >
            <el-option
                v-for="course in courseList"
                :key="course.id"
                :label="course.courseName || course.label || course.name || course.text"
                :value="course.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="学生">
          <el-select
              v-model="scoreForm.studentId"
              placeholder="选择学生"
              :disabled="loading || loadingStat || !courseList.length"
              @change="onStudentChange"
          >
            <el-option
                v-for="student in studentList"
                :key="student.id"
                :label="student.name"
                :value="student.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <!-- 修正：el-input 正确写法 -->
        <el-form-item label="分数">
          <el-input
              v-model.number="scoreForm.score"
              placeholder="输入0-100的分数"
              :disabled="loading || loadingStat"
              type="number"
              min="0"
              max="100"
          />
        </el-form-item>

        <el-form-item label="考试时间">
          <el-date-picker
              v-model="scoreForm.examTime"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled="loading || loadingStat"
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              @click="saveScore"
              :loading="loading || loadingStat"
          >
            {{ scoreForm.id ? '更新成绩' : '保存成绩' }}
          </el-button>
          <el-button
              v-if="scoreForm.id"
              type="default"
              @click="resetForm"
              :disabled="loading || loadingStat"
          >
            取消编辑
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 学生姓名搜索表单 -->
      <el-form :model="searchForm" inline @submit.prevent class="score-filter">
        <el-form-item label="学生姓名">
          <el-input
              v-model="searchForm.studentName"
              placeholder="输入学生姓名搜索"
              clearable
              :disabled="loading || loadingStat || !courseList.length"
              @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="loading || loadingStat" @click="handleSearch">搜索</el-button>
          <el-button :disabled="loading || loadingStat" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 成绩列表展示 -->
      <el-table
          :data="filteredScoreList"
          border
          style="margin-top: 20px;"
          v-loading="loading || loadingStat"
          empty-text="暂无成绩数据，请先录入成绩"
      >
        <el-table-column prop="courseName" label="课程" min-width="120" />
        <el-table-column prop="studentName" label="学生" min-width="120" />
        <el-table-column prop="score" label="分数" width="80">
          <template #default="scope">
            <span :class="scope.row.score < 60 ? 'score-fail' : ''">
              {{ scope.row.score }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="examTime" label="考试时间" width="120" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="editScore(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteScore(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="score-pagination">
        <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :current-page="pagination.pageNum"
            :page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
            :disabled="loading || loadingStat"
        />
      </div>
    </div>

    <!-- 成绩统计模块 -->
    <div class="score-statistic">
      <h2>成绩统计</h2>

      <div class="stat-toolbar">
        <el-select
            v-model="selectedCourseId"
            placeholder="选择课程"
            :disabled="loadingStat || !courseList.length"
            @change="loadStatistic"
        >
          <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="`${course.courseName || course.label || course.name || course.text}(${course.courseCode || '-'})`"
              :value="course.id"
          />
        </el-select>
      </div>

      <div class="stat-summary">
        <div class="stat-card">
          <p class="stat-label">平均分</p>
          <p class="stat-value">{{ formatScore(avgScore) }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">最高分</p>
          <p class="stat-value">{{ formatScore(maxScore) }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">最低分</p>
          <p class="stat-value">{{ formatScore(minScore) }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">总人数</p>
          <p class="stat-value">{{ totalCount }}</p>
        </div>
      </div>

      <el-card class="stat-card-panel">
        <h3>分数段分布（图表）</h3>
        <div v-if="scoreDistribution.length" class="score-chart">
          <div v-for="item in scoreDistribution" :key="item.range" class="score-chart-item">
            <div class="score-chart-label">{{ item.range }}</div>
            <div class="score-chart-bar">
              <div class="score-chart-bar-fill" :style="{ width: getBarWidth(item.count) }"></div>
            </div>
            <div class="score-chart-value">
              {{ item.count }}人（{{ item.rate }}）
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无统计数据" />
      </el-card>

      <el-card class="stat-card-panel mt-4">
        <h3>分数段分布（表格）</h3>
        <el-table :data="scoreDistribution" border>
          <el-table-column prop="range" label="分数段" />
          <el-table-column prop="count" label="人数" />
          <el-table-column prop="rate" label="占比" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// 引入必要依赖
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 接口导入：请确保实际项目中接口路径和名称正确
import {
  getTeacherScores, addScore, updateScore,
  deleteScore as deleteScoreApi, getTeacherCourses
} from '@/api/score';
import { getScoreSegment, getScoreStatistic } from '@/api/stat'; // 统计相关接口

// ===================== 基础状态 & 通用变量 =====================
const loading = ref(false); // 成绩管理加载状态
const loadingStat = ref(false); // 统计加载状态
const courseList = ref([]); // 课程列表（共用）

// ===================== 成绩管理模块变量 =====================
const scoreForm = ref({
  id: null,          // 编辑时的成绩ID
  courseId: null,    // 课程ID
  studentId: '',     // 学生ID
  score: null,       // 分数
  examTime: ''       // 考试时间
});
const searchForm = ref({
  studentName: ''    // 学生姓名搜索关键词
});
const scoreList = ref([]); // 成绩列表
const studentList = ref([]); // 学生列表
const pagination = ref({
  pageNum: 1,        // 当前页码
  pageSize: 10,      // 每页条数
  total: 0           // 总条数
});

// 按选中学生筛选成绩列表
const filteredScoreList = computed(() => {
  const selectedStudentId = scoreForm.value.studentId;
  if (!selectedStudentId) {
    return scoreList.value;
  }
  return scoreList.value.filter((item) =>
      String(item.studentId) === String(selectedStudentId)
  );
});

// ===================== 成绩统计模块变量 =====================
const selectedCourseId = ref(null); // 统计选中的课程ID
const avgScore = ref(null); // 平均分
const maxScore = ref(null); // 最高分
const minScore = ref(null); // 最低分
const totalCount = ref(0); // 统计总人数
const scoreDistribution = ref([]); // 分数段分布（统一定义，移除重复声明）

// 分数段图表最大人数（计算属性）
const maxCount = computed(() =>
    scoreDistribution.value.reduce((max, item) => Math.max(max, item.count), 0)
);

// ===================== 通用工具函数 =====================
// 格式化分数显示
const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--';
  }
  return Number(value).toFixed(1);
};

// 标准化分数段数据格式
const normalizeDistribution = (distribution, total) =>
    distribution.map((item) => {
      const count = Number(item.count ?? item.value ?? 0);
      const range = item.range ?? item.segment ?? item.label ?? '未知';
      const rateValue = item.rate ?? (total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%');
      return {
        range,
        count,
        rate: String(rateValue)
      };
    });

// 获取分数段图表宽度
const getBarWidth = (count) => {
  if (!maxCount.value) {
    return '0%';
  }
  return `${Math.round((Number(count) / maxCount.value) * 100)}%`;
};

// ===================== 成绩管理模块方法 =====================
// 获取课程列表（共用）
const fetchCourses = async () => {
  if (loading.value || loadingStat.value) return;
  loading.value = true;
  try {
    const res = await getTeacherCourses();
    courseList.value = res.data || res || [];
    // 默认选中第一个课程
    if (courseList.value.length > 0) {
      scoreForm.value.courseId = courseList.value[0].id;
      selectedCourseId.value = courseList.value[0].id;
      await Promise.all([onCourseChange(), loadStatistic()]); // 同时加载管理数据和统计数据
    }
  } catch (err) {
    console.error('获取课程列表失败:', err);
    ElMessage.error('获取课程列表失败：' + (err.message || '网络异常'));
    courseList.value = [];
  } finally {
    loading.value = false;
  }
};

// 课程切换（成绩管理）
const onCourseChange = async () => {
  if (!scoreForm.value.courseId) {
    studentList.value = [];
    scoreList.value = [];
    pagination.value.total = 0;
    return;
  }

  loading.value = true;
  try {
    // 重置搜索、分页、学生选择
    scoreForm.value.studentId = '';
    searchForm.value.studentName = '';
    pagination.value.pageNum = 1;

    // 加载成绩数据
    await fetchScores({ keepLoading: true });

    // 提取学生列表（去重）
    const studentMap = new Map();
    scoreList.value.forEach(item => {
      if (item.studentId && item.studentName) {
        studentMap.set(item.studentId, {
          id: item.studentId,
          name: item.studentName
        });
      }
    });
    studentList.value = Array.from(studentMap.values());
  } catch (err) {
    console.error('加载课程数据失败:', err);
    ElMessage.error('获取学生和成绩失败：' + (err.message || '网络异常'));
    studentList.value = [];
    scoreList.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value = false;
  }
};

// 刷新成绩列表
const fetchScores = async ({ keepLoading = false } = {}) => {
  if (!scoreForm.value.courseId) return;
  if (!keepLoading) {
    loading.value = true;
  }

  try {
    const courseId = scoreForm.value.courseId;
    const { pageNum, pageSize } = pagination.value;
    // 传递分页+搜索参数
    const res = await getTeacherScores(pageNum, pageSize, searchForm.value.studentName, courseId);

    // 兼容后端分页格式
    const scoreData = res.data?.list || res.data?.records || res.list || res.records || [];
    scoreList.value = scoreData;
    pagination.value.total = res.data?.total ?? res.total ?? scoreData.length;

    // 同步更新学生列表
    const studentMap = new Map();
    scoreData.forEach(item => {
      if (item.studentId && item.studentName) {
        studentMap.set(item.studentId, { id: item.studentId, name: item.studentName });
      }
    });
    studentList.value = Array.from(studentMap.values());
  } catch (err) {
    console.error('刷新成绩列表失败:', err);
    ElMessage.error('刷新成绩失败：' + (err.message || '网络异常'));
  } finally {
    if (!keepLoading) {
      loading.value = false;
    }
  }
};

// 搜索
const handleSearch = async () => {
  pagination.value.pageNum = 1;
  await fetchScores();
};

// 重置搜索
const handleReset = async () => {
  searchForm.value.studentName = '';
  scoreForm.value.studentId = '';
  pagination.value.pageNum = 1;
  await fetchScores();
};

// 学生选择切换
const onStudentChange = () => {
  pagination.value.pageNum = 1;
};

// 分页页码切换
const handlePageChange = async (page) => {
  pagination.value.pageNum = page;
  await fetchScores();
};

// 分页条数切换
const handleSizeChange = async (size) => {
  pagination.value.pageSize = size;
  pagination.value.pageNum = 1;
  await fetchScores();
};

// 保存/更新成绩
const saveScore = async () => {
  // 基础验证
  if (!scoreForm.value.courseId) return ElMessage.warning('请选择课程');
  if (!scoreForm.value.studentId) return ElMessage.warning('请选择学生');
  if (scoreForm.value.score === null || scoreForm.value.score === '') return ElMessage.warning('请输入分数');
  if (scoreForm.value.score < 0 || scoreForm.value.score > 100) return ElMessage.warning('分数必须在0-100之间');
  if (!scoreForm.value.examTime) return ElMessage.warning('请选择考试时间');

  // 新增重复校验
  if (!scoreForm.value.id) {
    const isDuplicate = scoreList.value.some(item =>
        item.courseId === scoreForm.value.courseId &&
        item.studentId === scoreForm.value.studentId &&
        item.examTime === scoreForm.value.examTime
    );
    if (isDuplicate) return ElMessage.warning('该学生该课程的该日期成绩已存在，请勿重复录入');
  }

  loading.value = true;
  try {
    if (scoreForm.value.id) {
      await updateScore(scoreForm.value.id, scoreForm.value);
      ElMessage.success('成绩更新成功');
    } else {
      await addScore(scoreForm.value);
      ElMessage.success('成绩录入成功');
    }
    await fetchScores(); // 刷新成绩列表
    await loadStatistic(); // 同步刷新统计数据
    resetForm();
  } catch (err) {
    console.error('保存成绩失败:', err);
    ElMessage.error('操作失败：' + (err.response?.data?.msg || err.message || '服务器异常'));
  } finally {
    loading.value = false;
  }
};

// 编辑成绩
const editScore = (row) => {
  scoreForm.value = { ...row }; // 深拷贝避免污染原数据
};

// 删除成绩
const deleteScore = async (id) => {
  if (!id) return;
  try {
    await ElMessageBox.confirm(
        '确定要删除该条成绩吗？删除后无法恢复！',
        '删除确认',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );

    loading.value = true;
    await deleteScoreApi(id);
    ElMessage.success('成绩删除成功');
    await fetchScores(); // 刷新成绩列表
    await loadStatistic(); // 同步刷新统计数据
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除成绩失败:', err);
      ElMessage.error('删除失败：' + (err.message || '服务器异常'));
    }
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  const currentCourseId = scoreForm.value.courseId;
  scoreForm.value = {
    id: null,
    courseId: currentCourseId,
    studentId: '',
    score: null,
    examTime: ''
  };
};

// ===================== 成绩统计模块方法 =====================
// 加载统计数据
const loadStatistic = async () => {
  if (!selectedCourseId.value) {
    scoreDistribution.value = [];
    totalCount.value = 0;
    avgScore.value = null;
    maxScore.value = null;
    minScore.value = null;
    return;
  }

  if (loadingStat.value) return;
  loadingStat.value = true;
  try {
    // 优先调用统计接口获取核心数据
    const statRes = await getScoreStatistic(selectedCourseId.value);
    const statData = statRes.data || statRes || {};

    // 补充分数段详细数据
    const segmentRes = await getScoreSegment(selectedCourseId.value);
    const segmentData = segmentRes.data || segmentRes || {};

    // 赋值核心统计指标
    avgScore.value = statData.avgScore ?? segmentData.avgScore ?? null;
    maxScore.value = statData.maxScore ?? segmentData.maxScore ?? null;
    minScore.value = statData.minScore ?? segmentData.minScore ?? null;

    // 处理分数段数据
    const distribution = segmentData.distribution || segmentData.list || segmentData.records || statData.distribution || [];
    const total = Number(statData.total ?? segmentData.total ?? distribution.reduce((sum, item) => sum + Number(item.count || 0), 0));
    totalCount.value = Number.isNaN(total) ? 0 : total;

    // 标准化分数段格式
    scoreDistribution.value = normalizeDistribution(distribution, totalCount.value);
  } catch (error) {
    console.error('加载统计失败:', error);
    ElMessage.error('加载统计失败，请稍后再试');
    scoreDistribution.value = [];
    totalCount.value = 0;
    avgScore.value = null;
    maxScore.value = null;
    minScore.value = null;
  } finally {
    loadingStat.value = false;
  }
};

// ===================== 初始化 =====================
onMounted(() => {
  fetchCourses(); // 初始化加载课程列表，同时触发管理和统计数据加载
});
</script>

<style scoped>
/* 整体容器 */
.score-container {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 成绩管理样式 */
.score-manage {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.score-manage h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.score-filter {
  margin-bottom: 12px;
}

.el-form {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.score-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.score-fail {
  color: #ef4444;
  font-weight: 500;
}

:deep(.el-table) {
  --el-table-header-text-color: #4b5563;
  --el-table-row-hover-bg-color: #f3f4f6;
}

:deep(.el-table__empty-text) {
  color: #9ca3af;
  font-size: 14px;
}

/* 成绩统计样式 */
.score-statistic h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.stat-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.stat-label {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.stat-value {
  margin: 8px 0 0 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.stat-card-panel {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 16px !important;
}

.score-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.score-chart-item {
  display: grid;
  grid-template-columns: 120px 1fr 140px;
  align-items: center;
  gap: 12px;
}

.score-chart-label {
  font-size: 14px;
  color: #374151;
}

.score-chart-bar {
  height: 10px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.score-chart-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.score-chart-value {
  text-align: right;
  font-size: 13px;
  color: #6b7280;
}
</style>