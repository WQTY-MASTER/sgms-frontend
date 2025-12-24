// src/api/student.js
import service from './index'; // 统一使用service请求工具

/**
 * 根据课程ID获取学生列表
 * @param {number} courseId - 课程ID
 * @returns {Promise} - 学生列表数据
 */
export const getStudentsByCourseId = (courseId) => {
    return service({
        url: `/students/course/${courseId}`, // 后端接口地址（根据实际后端路径调整）
        method: 'get'
    });
};