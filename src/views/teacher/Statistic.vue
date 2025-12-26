<template>
  <div class="score-container">
    <div class="teacher-nav">
      <el-menu mode="horizontal" :default-active="activeMenu" router>
        <el-menu-item index="/teacher/score-manage">成绩管理</el-menu-item>
        <el-menu-item index="/teacher/statistic">成绩统计</el-menu-item>
        <el-menu-item index="/teacher/file-upload">成绩导入</el-menu-item>
      </el-menu>
    </div>

    <!-- 成绩统计模块 -->
    <div class="score-statistic">
      <h2>成绩统计</h2>

      <div class="stat-toolbar">
        <el-select
            v-model="selectedCourseId"
            placeholder="选择课程"
            :disabled="loadingStat || loadingCourses || !courseList.length"
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getTeacherCourses } from '@/api/score';
import { getScoreSegment } from '@/api/stat';

const route = useRoute();
const activeMenu = computed(() => route.path);

const loadingCourses = ref(false);
const loadingStat = ref(false);
const courseList = ref([]);

const selectedCourseId = ref(null);
const avgScore = ref(null);
const maxScore = ref(null);
const minScore = ref(null);
const totalCount = ref(0);
const scoreDistribution = ref([]);

const maxCount = computed(() =>
    scoreDistribution.value.reduce((max, item) => Math.max(max, item.count), 0)
);

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--';
  }
  return Number(value).toFixed(1);
};

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

const getBarWidth = (count) => {
  if (!maxCount.value) {
    return '0%';
  }
  return `${Math.round((Number(count) / maxCount.value) * 100)}%`;
};

const resetStatistic = () => {
  scoreDistribution.value = [];
  totalCount.value = 0;
  avgScore.value = null;
  maxScore.value = null;
  minScore.value = null;
};

const fetchCourses = async () => {
  if (loadingCourses.value || loadingStat.value) return;
  loadingCourses.value = true;
  try {
    const res = await getTeacherCourses();
    courseList.value = res.data || res || [];
    if (courseList.value.length > 0) {
      selectedCourseId.value = courseList.value[0].id;
      await loadStatistic();
    } else {
      selectedCourseId.value = null;
      resetStatistic();
    }
  } catch (err) {
    console.error('获取课程列表失败:', err);
    ElMessage.error('获取课程列表失败：' + (err.message || '网络异常'));
    courseList.value = [];
    selectedCourseId.value = null;
    resetStatistic();
  } finally {
    loadingCourses.value = false;
  }
};

const loadStatistic = async () => {
  if (!selectedCourseId.value) {
    resetStatistic();
    return;
  }

  if (loadingStat.value) return;
  loadingStat.value = true;
  try {
    const segmentRes = await getScoreSegment(selectedCourseId.value);
    const segmentData = segmentRes.data || segmentRes || {};

    avgScore.value = segmentData.avgScore ?? segmentData.average ?? null;
    maxScore.value = segmentData.maxScore ?? segmentData.max ?? null;
    minScore.value = segmentData.minScore ?? segmentData.min ?? null;

    const distribution = segmentData.distribution || segmentData.list || segmentData.records || [];
    const total = Number(segmentData.total ?? distribution.reduce((sum, item) => sum + Number(item.count || 0), 0));
    totalCount.value = Number.isNaN(total) ? 0 : total;

    scoreDistribution.value = normalizeDistribution(distribution, totalCount.value);
  } catch (error) {
    console.error('加载统计失败:', error);
    ElMessage.error('加载统计失败，请稍后再试');
    resetStatistic();
  } finally {
    loadingStat.value = false;
  }
};

onMounted(() => {
  fetchCourses();
});
</script>

<style scoped>
/* 整体容器 */
.score-container {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.teacher-nav {
  margin: 16px 0;
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
