<!-- 模板下载提示 -->
<template #tip>
  <div class="el-upload__tip">
    模板字段：学号（student_no）、姓名（real_name）、分数（score）、考试时间（exam_time）<br>
    <a href="#" @click.prevent="downloadTemplate">下载模板</a>
  </div>
</template>

<script setup>
// 上传成功后，后端返回的结果应包含学生学号（studentNo）和状态
const onUploadSuccess = (res) => {
  ElMessage.success('上传成功');
  uploadResult.value = res.data.map(item => ({
    studentNo: item.studentNo,
    studentName: item.studentName,
    score: item.score,
    status: item.success ? '成功' : '失败',
    message: item.message || ''
  }));
};
</script>