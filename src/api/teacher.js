// src/api/teacher.js
import service from './index'; // 导入封装好的axios实例

/**
 * 获取教师个人信息（包括工号、部门、负责课程等）
 */
export function getTeacherInfo() {
    return service.get('/teacher/info');
}

/**
 * 新增：根据课程ID查询学生列表
 * @param {Number} courseId 课程ID
 * @returns {Promise} 学生列表
 */
export function getStudentsByCourse(courseId) {
    return service.get('/teacher/students-by-course', {
        params: { courseId }
    });
}