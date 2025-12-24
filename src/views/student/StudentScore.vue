<template>
  <div class="student-score">
    <h2>我的成绩</h2>
    <el-table :data="scoreList" border style="width: 100%;">
      <el-table-column prop="courseName" label="课程名称" />
      <el-table-column prop="score" label="分数" />
      <el-table-column prop="teacherName" label="授课教师" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getStudentScores } from '@/api/score';
import { ElMessage } from 'element-plus'; // 引入提示组件

const scoreList = ref([]);

onMounted(async () => {
  try {
    // 调用接口并提取data层数据
    const res = await getStudentScores();
    // 后端返回的data是 {total: number, list: 成绩数组}，需取list赋值给表格
    scoreList.value = res.data.list;
  } catch (err) {
    // 捕获接口异常，友好提示
    ElMessage.error(`加载成绩失败：${err.msg || '服务器异常'}`);
    console.error('成绩加载失败详情：', err);
  }
});
</script>