<template>
  <div class="score-manage">
    <h2>成绩管理</h2>

    <!-- 成绩录入表单 -->
    <el-form :model="scoreForm" inline @submit.prevent>
      <el-form-item label="课程">
        <el-select
            v-model="scoreForm.courseId"
            placeholder="选择课程"
            @change="onCourseChange"
            :disabled="loading"
        >
          <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.name"
              :value="course.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="学生">
        <el-select
            v-model="scoreForm.studentId"
            placeholder="选择学生"
            :disabled="loading || !courseList.length"
        >
          <el-option
              v-for="student in studentList"
              :key="student.id"
              :label="student.name"
              :value="student.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="分数">
        <el-input
            v-model.number="scoreForm.score"
            placeholder="输入0-100的分数"
            :disabled="loading"
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
            :disabled="loading"
        />
      </el-form-item>
      <el-form-item>
        <el-button
            type="primary"
            @click="saveScore"
            :loading="loading"
        >
          {{ scoreForm.id ? '更新成绩' : '保存成绩' }}
        </el-button>
        <el-button
            v-if="scoreForm.id"
            type="default"
            @click="resetForm"
            :disabled="loading"
        >
          取消编辑
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 成绩列表 -->
    <el-table
        :data="scoreList"
        border
        style="margin-top: 20px;"
        v-loading="loading"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getTeacherScores, addScore, updateScore, deleteScore as deleteScoreApi, getTeacherCourses } from '@/api/score';

// 加载状态（全局防抖）
const loading = ref(false);

// 表单数据 - 严格类型定义
const scoreForm = ref({
  id: null,          // 编辑时的成绩ID
  courseId: null,    // 课程ID（Number）
  studentId: '',     // 学生ID（String/Number）
  score: null,       // 分数（Number，初始为null避免空字符串）
  examTime: ''       // 考试时间（String，YYYY-MM-DD）
});

// 列表数据
const scoreList = ref([]);
const courseList = ref([]);
const studentList = ref([]);

// 页面初始化
onMounted(async () => {
  await fetchCourses(); // 优先加载课程列表
});

// 获取教师课程列表（独立封装）
const fetchCourses = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    console.log('开始获取教师课程列表');
    const res = await getTeacherCourses();
    // 兼容后端返回格式：res.data 或直接返回数组
    courseList.value = res.data || res || [];
    console.log('课程列表加载完成:', courseList.value);

    // 默认选中第一个课程
    if (courseList.value.length > 0) {
      scoreForm.value.courseId = courseList.value[0].id;
      await onCourseChange(); // 加载对应学生和成绩
    }
  } catch (err) {
    console.error('获取课程列表失败:', err);
    ElMessage.error('获取课程列表失败：' + (err.message || '网络异常'));
    courseList.value = [];
  } finally {
    loading.value = false;
  }
};

// 课程切换 - 加载对应学生和成绩
const onCourseChange = async () => {
  if (loading.value || !scoreForm.value.courseId) {
    studentList.value = [];
    scoreList.value = [];
    return;
  }

  loading.value = true;
  try {
    const courseId = scoreForm.value.courseId;
    console.log('课程切换，加载课程ID:', courseId, '的成绩数据');

    // 调用成绩接口（兼容分页参数）
    const res = await getTeacherScores(1, 100, '', courseId); // 每页100条，减少分页问题
    // 兼容后端分页结构：list 或 records（MyBatis-Plus 分页默认records）
    const scoreData = res.data?.list || res.data?.records || res.list || res.records || [];
    console.log('成绩数据加载完成:', scoreData);

    // 更新成绩列表
    scoreList.value = scoreData;

    // 提取唯一学生列表（去重）
    const studentMap = new Map();
    scoreData.forEach(item => {
      if (item.studentId && item.studentName) {
        studentMap.set(item.studentId, {
          id: item.studentId,
          name: item.studentName
        });
      }
    });
    studentList.value = Array.from(studentMap.values());
    console.log('学生列表提取完成:', studentList.value);

  } catch (err) {
    console.error('加载课程数据失败:', err);
    ElMessage.error('获取学生和成绩失败：' + (err.message || '网络异常'));
    studentList.value = [];
    scoreList.value = [];
  } finally {
    loading.value = false;
  }
};

// 刷新成绩列表（独立封装）
const fetchScores = async () => {
  if (loading.value || !scoreForm.value.courseId) return;
  loading.value = true;
  try {
    const courseId = scoreForm.value.courseId;
    const res = await getTeacherScores(1, 100, '', courseId);
    const scoreData = res.data?.list || res.data?.records || [];
    scoreList.value = scoreData;

    // 同步更新学生列表（防止新增成绩后学生列表缺失）
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
    loading.value = false;
  }
};

// 保存/更新成绩
const saveScore = async () => {
  // 基础验证
  if (!scoreForm.value.courseId) {
    return ElMessage.warning('请选择课程');
  }
  if (!scoreForm.value.studentId) {
    return ElMessage.warning('请选择学生');
  }
  if (scoreForm.value.score === null || scoreForm.value.score === '') {
    return ElMessage.warning('请输入分数');
  }
  // 分数范围验证
  if (scoreForm.value.score < 0 || scoreForm.value.score > 100) {
    return ElMessage.warning('分数必须在0-100之间');
  }
  if (!scoreForm.value.examTime) {
    return ElMessage.warning('请选择考试时间');
  }

  // 重复录入校验（新增时）
  if (!scoreForm.value.id) {
    const isDuplicate = scoreList.value.some(item =>
        item.courseId === scoreForm.value.courseId &&
        item.studentId === scoreForm.value.studentId &&
        item.examTime === scoreForm.value.examTime
    );
    if (isDuplicate) {
      return ElMessage.warning('该学生该课程的该日期成绩已存在，请勿重复录入');
    }
  }

  loading.value = true;
  try {
    if (scoreForm.value.id) {
      // 更新成绩
      await updateScore(scoreForm.value.id, scoreForm.value);
      ElMessage.success('成绩更新成功');
    } else {
      // 新增成绩
      await addScore(scoreForm.value);
      ElMessage.success('成绩录入成功');
    }
    // 刷新列表 + 重置表单
    await fetchScores();
    resetForm();
  } catch (err) {
    console.error('保存成绩失败:', err);
    ElMessage.error('操作失败：' + (err.response?.data?.msg || err.message || '服务器异常'));
  } finally {
    loading.value = false;
  }
};

// 编辑成绩 - 回显数据（修复时间格式、ID保留）
const editScore = (row) => {
  console.log('编辑成绩，回显数据:', row);
  // 深拷贝避免修改原数据，确保时间格式正确
  scoreForm.value = {
    id: row.id,
    courseId: row.courseId,
    studentId: row.studentId,
    score: row.score,
    examTime: row.examTime // 确保是YYYY-MM-DD格式
  };
};

// 删除成绩 - 增加确认弹窗
const deleteScore = async (id) => {
  if (!id) return;
  try {
    // 确认弹窗
    await ElMessageBox.confirm(
        '确定要删除该条成绩吗？删除后无法恢复！',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );

    loading.value = true;
    await deleteScoreApi(id);
    ElMessage.success('成绩删除成功');
    await fetchScores(); // 刷新列表
  } catch (err) {
    // 取消删除时不提示错误
    if (err !== 'cancel') {
      console.error('删除成绩失败:', err);
      ElMessage.error('删除失败：' + (err.message || '服务器异常'));
    }
  } finally {
    loading.value = false;
  }
};

// 重置表单（保留当前课程选择）
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
</script>

<style scoped>
.score-manage {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.el-form {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

/* 不及格分数样式 */
.score-fail {
  color: #ef4444;
  font-weight: 500;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-header-text-color: #4b5563;
  --el-table-row-hover-bg-color: #f3f4f6;
}

:deep(.el-table__empty-text) {
  color: #9ca3af;
  font-size: 14px;
}
</style>