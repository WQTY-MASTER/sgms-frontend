<template>
  <div class="score-manage">
    <div class="teacher-nav">
      <el-menu mode="horizontal" :default-active="activeMenu" router>
        <el-menu-item index="/teacher/score-manage">成绩管理</el-menu-item>
        <el-menu-item index="/teacher/statistic">成绩统计</el-menu-item>
        <el-menu-item index="/teacher/file-upload">成绩导入</el-menu-item>
      </el-menu>
    </div>
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
              :label="course.courseName || course.label || course.name || course.text"
              :value="course.id"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="学生">
        <el-select
            v-model="scoreForm.studentId"
            placeholder="选择学生"
            :disabled="loading || !courseList.length"
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

    <!-- 学生姓名搜索表单 -->
    <el-form :model="searchForm" inline @submit.prevent class="score-filter">
      <el-form-item label="学生姓名">
        <el-input
            v-model="searchForm.studentName"
            placeholder="输入学生姓名搜索"
            clearable
            :disabled="loading || !courseList.length"
            @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="loading" @click="handleSearch">搜索</el-button>
        <el-button :disabled="loading" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 成绩列表展示 -->
    <el-table
        :data="filteredScoreList"
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
      />
    </div>
  </div>
</template>

<script setup>
// 引入必要依赖
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getTeacherScores, addScore, updateScore, deleteScore as deleteScoreApi, getTeacherCourses } from '@/api/score';

const route = useRoute();
const activeMenu = computed(() => route.path);
// 加载状态（全局防抖）
const loading = ref(false);

// 表单数据 - 包含成绩录入和搜索表单
const scoreForm = ref({
  id: null,          // 编辑时的成绩ID
  courseId: null,    // 课程ID（Number）
  studentId: '',     // 学生ID（String/Number）
  score: null,       // 分数（Number，初始为null避免空字符串）
  examTime: ''       // 考试时间（String，YYYY-MM-DD）
});
const searchForm = ref({
  studentName: ''    // 学生姓名搜索关键词
});

// 列表数据 + 分页配置
const scoreList = ref([]);
const courseList = ref([]);
const studentList = ref([]);
const pagination = ref({
  pageNum: 1,        // 当前页码
  pageSize: 10,      // 每页条数
  total: 0           // 总条数
});

// 按选中学生筛选成绩列表（计算属性）
const filteredScoreList = computed(() => {
  const selectedStudentId = scoreForm.value.studentId;
  if (!selectedStudentId) {
    return scoreList.value;
  }
  return scoreList.value.filter((item) =>
      String(item.studentId) === String(selectedStudentId)
  );
});

// 页面初始化：优先加载课程列表
onMounted(async () => {
  await fetchCourses();
});

// 获取教师课程列表（独立封装）
const fetchCourses = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await getTeacherCourses();
    // 兼容后端返回格式：res.data 或直接返回数组
    courseList.value = res.data || res || [];

    // 默认选中第一个课程并加载对应数据
    if (courseList.value.length > 0) {
      scoreForm.value.courseId = courseList.value[0].id;
      await onCourseChange();
    }
  } catch (err) {
    console.error('获取课程列表失败:', err);
    ElMessage.error('获取课程列表失败：' + (err.message || '网络异常'));
    courseList.value = [];
  } finally {
    loading.value = false;
  }
};

// 课程切换：重置状态 + 加载对应成绩/学生数据
const onCourseChange = async () => {
  if (!scoreForm.value.courseId) {
    studentList.value = [];
    scoreList.value = [];
    pagination.value.total = 0;
    return;
  }

  loading.value = true;
  try {
    // 切换课程时重置搜索、分页、学生选择
    scoreForm.value.studentId = '';
    searchForm.value.studentName = '';
    pagination.value.pageNum = 1;

    // 调用分页版fetchScores加载数据
    await fetchScores({ keepLoading: true });

    // 提取唯一学生列表（去重）
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

// 刷新成绩列表：支持分页、搜索、loading控制
const fetchScores = async ({ keepLoading = false } = {}) => {
  if (!scoreForm.value.courseId) return;
  if (!keepLoading) {
    loading.value = true;
  }

  try {
    const courseId = scoreForm.value.courseId;
    const { pageNum, pageSize } = pagination.value;
    // 传递分页+搜索参数给接口
    const res = await getTeacherScores(pageNum, pageSize, searchForm.value.studentName, courseId);

    // 兼容后端不同分页返回格式
    const scoreData = res.data?.list || res.data?.records || res.list || res.records || [];
    scoreList.value = scoreData;
    pagination.value.total = res.data?.total ?? res.total ?? scoreData.length;

    // 同步更新学生列表（防止新增成绩后列表缺失）
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

// 搜索：重置页码 + 刷新列表
const handleSearch = async () => {
  pagination.value.pageNum = 1;
  await fetchScores();
};

// 重置：清空搜索/学生选择 + 重置页码 + 刷新列表
const handleReset = async () => {
  searchForm.value.studentName = '';
  scoreForm.value.studentId = '';
  pagination.value.pageNum = 1;
  await fetchScores();
};

// 学生选择切换：重置页码
const onStudentChange = () => {
  pagination.value.pageNum = 1;
};

// 分页：页码切换
const handlePageChange = async (page) => {
  pagination.value.pageNum = page;
  await fetchScores();
};

// 分页：条数切换（重置页码）
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

  // 新增时重复校验
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
    await fetchScores();
    resetForm();
  } catch (err) {
    console.error('保存成绩失败:', err);
    ElMessage.error('操作失败：' + (err.response?.data?.msg || err.message || '服务器异常'));
  } finally {
    loading.value = false;
  }
};

// 编辑成绩：回显数据
const editScore = (row) => {
  scoreForm.value = { ...row }; // 深拷贝避免修改原数据
};

// 删除成绩：确认弹窗 + 接口调用
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
    await fetchScores();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除成绩失败:', err);
      ElMessage.error('删除失败：' + (err.message || '服务器异常'));
    }
  } finally {
    loading.value = false;
  }
};

// 重置表单：保留课程选择，清空其他字段
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
.teacher-nav {
  margin-bottom: 16px;
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

/* 搜索表单样式 */
.score-filter {
  margin-bottom: 12px;
}

/* 分页组件样式 */
.score-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 不及格分数标红 */
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