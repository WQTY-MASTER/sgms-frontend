<!-- 统计卡片增加课程信息 -->
<el-select v-model="selectedCourseId" placeholder="选择课程" @change="loadStatistic">
<el-option v-for="course in courseList" :key="course.id" :label="`${course.courseName}(${course.courseCode})`" :value="course.id" />
</el-select>

<!-- 分数段分布 -->
<el-card class="mt-4">
<h3>分数段分布</h3>
<el-table :data="scoreDistribution" border>
  <el-table-column prop="range" label="分数段" />
  <el-table-column prop="count" label="人数" />
  <el-table-column prop="rate" label="占比" />
</el-table>
</el-card>

<script setup>
// 分数段数据结构
const scoreDistribution = ref([
  { range: '0-60', count: 0, rate: '0%' },
  { range: '60-80', count: 0, rate: '0%' },
  { range: '80-100', count: 0, rate: '0%' }
]);

// 加载统计时，后端返回分数段数据
const loadStatistic = async () => {
  try {
    const res = await getScoreStatistic(selectedCourseId);
    // 平均分、最高分等
    avgScore.value = res.data.avgScore;
    maxScore.value = res.data.maxScore;
    minScore.value = res.data.minScore;
    // 分数段
    scoreDistribution.value = res.data.distribution;
  } catch (err) { /* 错误处理 */ }
};
</script>