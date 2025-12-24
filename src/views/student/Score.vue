<template>
  <div class="student-score">
    <h2>我的成绩</h2>

    <!-- 搜索框（按课程名称筛选） -->
    <el-input
        v-model="searchCourseName"
        placeholder="输入课程名称搜索"
        style="width: 300px; margin-bottom: 20px;"
        @keyup.enter="fetchScores"
    >
      <template #append>
        <el-button type="primary" @click="fetchScores">搜索</el-button>
      </template>
    </el-input>

    <!-- 成绩列表 -->
    <el-table
        :data="scoreList"
        border
        stripe
        style="width: 100%;"
        empty-text="暂无成绩数据"
    >
      <el-table-column prop="courseName" label="课程名称" width="200" />
      <el-table-column prop="score" label="分数" width="100" />
      <el-table-column
          prop="examTime"
          label="考试时间"
          width="200"
          :formatter="formatDate"
      />
      <!-- 优化：统一使用格式化后的teacherName，简化模板逻辑 -->
      <el-table-column prop="teacherName" label="授课教师" min-width="140" />
      <el-table-column label="成绩等级" width="120">
        <template #default="scope">
          <span :class="getLevelClass(scope.row.score)">
            {{ getScoreLevel(scope.row.score) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getStudentScores } from '@/api/score';

// 搜索关键词
const searchCourseName = ref('');
// 成绩列表数据
const scoreList = ref([]);

// 页面加载时获取成绩
onMounted(() => {
  fetchScores();
});

// 格式化日期（增强容错：处理无效日期）
const formatDate = (row) => {
  if (!row.examTime) return '暂无';
  let time;
  if (typeof row.examTime === 'number') {
    time = row.examTime;
  } else {
    const date = new Date(row.examTime);
    time = date.getTime(); // 无效日期会返回NaN
  }
  // 容错：无效日期返回"暂无"
  if (isNaN(time)) return '暂无';
  return new Date(time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 标准化教师名称（兼容多字段）
const normalizeTeacherName = (row) => {
  return row?.teacherName || row?.teacher || row?.teacherRealName || '暂无';
};

// 获取成绩列表（核心优化：统一格式化teacherName，兼容多响应格式）
const fetchScores = async () => {
  try {
    const res = await getStudentScores(1, 10, searchCourseName.value);
    let list = [];
    // 兼容不同响应格式
    if (res?.code === 200) {
      list = res.data?.list || res.data?.records || [];
    } else if (Array.isArray(res)) {
      list = res;
    }
    // 统一格式化：为每条数据补充标准化的teacherName
    scoreList.value = list.map((item) => ({
      ...item,
      teacherName: normalizeTeacherName(item)
    }));
    // 优化：移除重复提示（表格empty-text已覆盖空数据场景）
    // if (scoreList.value.length === 0) {
    //   ElMessage.info('暂无匹配的成绩数据');
    // }
  } catch (err) {
    const errorMsg = err?.response?.data?.msg || err?.msg || '网络错误，无法获取成绩';
    ElMessage.error(errorMsg);
    console.error('成绩获取失败详情：', err);
    scoreList.value = [];
  }
};

// 根据分数计算等级（增强容错：处理非数字分数）
const getScoreLevel = (score) => {
  const numScore = Number(score) || NaN;
  if (isNaN(numScore)) return '无效分数';
  if (numScore >= 90) return '优秀（A）';
  if (numScore >= 80) return '良好（B）';
  if (numScore >= 60) return '及格（C）';
  return '不及格（D）';
};

// 给不同等级添加样式（增强容错：处理非数字分数）
const getLevelClass = (score) => {
  const numScore = Number(score) || NaN;
  if (isNaN(numScore)) return '';
  if (numScore >= 90) return 'level-excellent';
  if (numScore >= 80) return 'level-good';
  if (numScore >= 60) return 'level-pass';
  return 'level-fail';
};
</script>

<style scoped>
.student-score {
  padding: 20px;
}

/* 成绩等级样式 */
.level-excellent {
  color: #52c41a;
  font-weight: 500;
}
.level-good {
  color: #1890ff;
  font-weight: 500;
}
.level-pass {
  color: #faad14;
  font-weight: 500;
}
.level-fail {
  color: #f5222d;
  font-weight: 500;
}
</style>