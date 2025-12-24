<template>
  <div class="teacher-score-manage">
    <h2>成绩管理</h2>

    <!-- 成绩录入表单 -->
    <el-form :model="scoreForm" inline @submit.prevent="handleSave" label-width="80px">
      <el-form-item label="课程">
        <el-select
            v-model="scoreForm.courseId"
            placeholder="选择课程"
            @change="handleCourseChange"
            clearable
            :disabled="isSubmitting"
        >
          <!-- 修复：课程显示courseName而非name -->
          <el-option v-for="course in courseList" :key="course.id" :label="course.courseName" :value="course.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="学生">
        <el-select
            v-model="scoreForm.studentId"
            placeholder="选择学生"
            clearable
            :disabled="isSubmitting"
        >
          <!-- 修复：学生显示studentName而非name -->
          <el-option v-for="student in studentList" :key="student.id" :label="student.studentName" :value="student.id" />
          </el-option>
      </el-form-item>
      <el-form-item label="分数">
        <el-input
            v-model.number="scoreForm.score"
            placeholder="输入分数（0-100）"
            type="number"
            min="0"
            max="100"
            :disabled="isSubmitting"
        />
      </el-form-item>
      <el-form-item label="考试时间">
        <el-date-picker
            v-model="scoreForm.examTime"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            :disabled="isSubmitting"
        />
      </el-form-item>
      <el-form-item>
        <el-button
            type="primary"
            @click="handleSave"
            :disabled="isSubmitting"
            :loading="isSubmitting"
        >
          {{ scoreForm.id ? '修改成绩' : '保存成绩' }}
        </el-button>
        <el-button
            v-if="scoreForm.id"
            type="default"
            @click="resetForm"
            :disabled="isSubmitting"
        >
          取消编辑
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 批量操作按钮 -->
    <div class="batch-operation" style="margin: 10px 0;">
      <el-button
          type="danger"
          icon="el-icon-delete"
          @click="handleBatchDelete"
          :disabled="selectedScores.length === 0 || isSubmitting"
      >
        批量删除选中成绩
      </el-button>
    </div>

    <!-- 成绩列表 -->
    <el-table
        :data="scoreList"
        border
        style="width: 100%; margin-top: 10px;"
        @selection-change="handleSelectionChange"
        v-loading="loading"
        empty-text="暂无成绩数据"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="studentName" label="学生姓名" min-width="120" />
      <el-table-column prop="courseName" label="课程名称" min-width="120" />
      <el-table-column prop="score" label="分数" width="100">
        <template #default="scope">
          <span :style="{ color: Number(scope.row.score) < 60 && !isNaN(scope.row.score) ? 'red' : '' }">
            {{ !isNaN(Number(scope.row.score)) ? Number(scope.row.score).toFixed(0) : '无效分数' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="examTime" label="考试时间" width="120">
        <template #default="scope">
          {{ scope.row.examTime ? new Date(scope.row.examTime).toLocaleDateString() : '暂无' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
              :disabled="isSubmitting"
          >
            编辑
          </el-button>
          <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row.id)"
              :disabled="isSubmitting"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageNum"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 20px; text-align: right;"
        :disabled="isSubmitting"
    >
    </el-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getTeacherScores,
  addScore,
  updateScore,
  deleteScore,
  getTeacherCourses,
  checkScoreUnique
} from '@/api/score';
// 替换为teacher.js的接口
import { getStudentsByCourse } from '@/api/teacher';

// 表单数据
const scoreForm = ref({
  id: '',
  studentId: '',
  courseId: '',
  score: '',
  examTime: ''
});
// 列表/分页数据
const scoreList = ref([]);
const courseList = ref([]);
const studentList = ref([]);
const selectedScores = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const isSubmitting = ref(false);

// 页面加载时获取数据
onMounted(async () => {
  try {
    loading.value = true;
    // 获取教师负责的课程
    const courseRes = await getTeacherCourses();
    if (Array.isArray(courseRes)) {
      courseList.value = courseRes;
    } else if (courseRes?.code === 200) {
      courseList.value = courseRes.data || [];
    } else {
      courseList.value = [];
    }
    // 获取成绩列表（带分页）
    await fetchScores();
  } catch (error) {
    console.error('页面加载失败:', error);
    ElMessage.error(`页面加载失败：${error.msg || '服务器异常'}`);
  } finally {
    loading.value = false;
  }
});

// 获取成绩列表（支持分页）
const fetchScores = async () => {
  try {
    loading.value = true;
    const res = await getTeacherScores(pageNum.value, pageSize.value, '', scoreForm.value.courseId);
    if (res?.total !== undefined) {
      scoreList.value = res.list || res.records || [];
      total.value = res.total || 0;
    } else if (res?.code === 200) {
      scoreList.value = res.data?.list || res.data?.records || [];
      total.value = res.data?.total || 0;
    } else {
      scoreList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取成绩列表失败:', error);
    ElMessage.error(`获取成绩列表失败：${error.msg || '服务器异常'}`);
    scoreList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 选择课程后加载学生（修复接口调用）
const handleCourseChange = async () => {
  const courseId = scoreForm.value.courseId;
  if (!courseId || isNaN(Number(courseId))) {
    studentList.value = [];
    scoreForm.value.studentId = '';
    return;
  }

  try {
    loading.value = true;
    // 调用teacher.js的getStudentsByCourse接口
    const studentsRes = await getStudentsByCourse(courseId);
    if (Array.isArray(studentsRes)) {
      studentList.value = studentsRes;
    } else if (studentsRes?.code === 200) {
      studentList.value = studentsRes.data || [];
    } else {
      studentList.value = [];
    }
    scoreForm.value.studentId = '';
  } catch (error) {
    console.error('获取学生列表失败:', error);
    ElMessage.error(`获取学生列表失败：${error.msg || '服务器异常'}`);
    studentList.value = [];
  } finally {
    loading.value = false;
  }
};

// 成绩唯一性校验
const checkScoreDuplicate = async () => {
  const { studentId, courseId, id } = scoreForm.value;
  if (id) return true;
  if (!studentId || !courseId) return true;

  try {
    const res = await checkScoreUnique({
      studentId: Number(studentId),
      courseId: Number(courseId)
    });
    if (res?.code === 200 && !res.data) {
      ElMessage.warning('该学生的该课程成绩已存在，请勿重复添加');
      return false;
    }
    return true;
  } catch (error) {
    ElMessage.error(`校验成绩唯一性失败：${error.msg || '服务器异常'}`);
    return false;
  }
};

// 保存/修改成绩
const handleSave = async () => {
  const form = scoreForm.value;
  if (!form.courseId) {
    ElMessage.warning('请选择课程');
    return;
  }
  if (!form.studentId) {
    ElMessage.warning('请选择学生');
    return;
  }
  if (form.score === '' || isNaN(Number(form.score)) || Number(form.score) < 0 || Number(form.score) > 100) {
    ElMessage.warning('请输入有效的分数（0-100）');
    return;
  }
  if (!form.examTime) {
    ElMessage.warning('请选择考试时间');
    return;
  }

  isSubmitting.value = true;

  try {
    const isUnique = await checkScoreDuplicate();
    if (!isUnique) return;

    const submitData = {
      ...form,
      courseId: Number(form.courseId),
      studentId: Number(form.studentId),
      score: Number(form.score),
      examTime: form.examTime
    };

    if (form.id) {
      await updateScore(form.id, submitData);
      ElMessage.success('成绩修改成功');
    } else {
      await addScore(submitData);
      ElMessage.success('成绩保存成功');
    }

    await fetchScores();
    resetForm();
  } catch (error) {
    console.error('保存成绩失败:', error);
    ElMessage.error(`成绩保存失败：${error.response?.data?.msg || error.msg || '服务器异常'}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 编辑成绩
const handleEdit = (row) => {
  scoreForm.value = {
    ...row,
    id: Number(row.id),
    courseId: Number(row.courseId),
    studentId: Number(row.studentId),
    score: Number(row.score),
    examTime: row.examTime ? row.examTime : ''
  };
  handleCourseChange();
};

// 重置表单
const resetForm = () => {
  scoreForm.value = {
    id: '',
    studentId: '',
    courseId: '',
    score: '',
    examTime: ''
  };
  studentList.value = [];
};

// 单个删除
const handleDelete = async (id) => {
  if (!id || isNaN(Number(id))) {
    ElMessage.warning('无效的成绩ID，删除失败');
    return;
  }

  try {
    await ElMessageBox.confirm(
        '确定要删除该成绩吗？删除后无法恢复',
        '删除确认',
        { type: 'warning' }
    );

    isSubmitting.value = true;
    await deleteScore(id);
    ElMessage.success('成绩删除成功');
    await fetchScores();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除成绩失败:', error);
      ElMessage.error(`删除成绩失败：${error.msg || '服务器异常'}`);
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedScores.value.length === 0) {
    ElMessage.warning('请选择要删除的成绩');
    return;
  }

  try {
    await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedScores.value.length} 条成绩吗？删除后无法恢复`,
        '批量删除确认',
        { type: 'warning' }
    );

    isSubmitting.value = true;
    const deletePromises = selectedScores.value.map(item => deleteScore(item.id));
    await Promise.all(deletePromises);

    ElMessage.success(`成功删除 ${selectedScores.value.length} 条成绩`);
    await fetchScores();
    selectedScores.value = [];
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除成绩失败:', error);
      ElMessage.error(`批量删除失败：${error.msg || '部分成绩删除失败，请重试'}`);
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 选择成绩行
const handleSelectionChange = (selection) => {
  selectedScores.value = selection;
};

// 分页：切换每页条数
const handleSizeChange = (val) => {
  pageSize.value = val;
  pageNum.value = 1;
  fetchScores();
};

// 分页：切换当前页
const handleCurrentChange = (val) => {
  pageNum.value = val;
  fetchScores();
};
</script>

<style scoped>
.teacher-score-manage {
  padding: 20px;
}
.el-form {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
.batch-operation {
  display: flex;
  align-items: center;
}
:deep(.el-table td),
:deep(.el-table th) {
  text-align: center;
}
</style>