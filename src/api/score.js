// src/api/score.js
import service from '@/utils/request';

// 新增成绩接口
export const addScore = (data) => {
    if (!data.studentId || !data.courseId || data.score === undefined || !data.examTime) {
        return Promise.reject({ msg: '添加成绩失败：学生ID、课程ID、分数、考试时间为必填项' });
    }
    const submitData = {
        ...data,
        score: Number(data.score),
        examTime: data.examTime
    };
    return service.post('/score/teacher/save', submitData);
};

// 修改成绩接口
export const updateScore = (id, data) => {
    if (!id || isNaN(Number(id))) {
        return Promise.reject({ msg: '修改成绩失败：请传入有效的成绩记录ID' });
    }
    const submitData = { ...data };
    if (submitData.score !== undefined) {
        submitData.score = Number(submitData.score);
    }
    return service.post(`/score/teacher/save`, { id: Number(id), ...submitData });
};

// 删除成绩接口
export const deleteScore = (id) => {
    if (!id || isNaN(Number(id))) {
        return Promise.reject({ msg: '删除成绩失败：请传入有效的成绩记录ID' });
    }
    return service.delete(`/score/teacher/${Number(id)}`);
};

// 学生成绩查询接口（修复参数传递）
export const getStudentScores = (pageNum = 1, pageSize = 10, courseName = '') => {
    const params = {
        pageNum: Number(pageNum) || 1,
        pageSize: Number(pageSize) || 10,
        courseName: courseName || ''
    };
    return service.get('/score/student', { params });
};

// 教师成绩查询接口（修复参数传递）
export const getTeacherScores = (pageNum = 1, pageSize = 10, studentName = '', courseId = null) => {
    const params = {
        pageNum: Number(pageNum) || 1,
        pageSize: Number(pageSize) || 10,
        studentName: studentName || '',
        courseId: (courseId === '' || courseId === undefined) ? null : Number(courseId)
    };
    return service.get('/score/teacher', { params });
};

// 获取教师课程列表接口
export const getTeacherCourses = () => service.get('/score/teacher/courses');

// 新增：成绩唯一性校验接口
export const checkScoreUnique = (data) => {
    return service.get('/score/teacher/check-unique', {
        params: {
            studentId: Number(data.studentId),
            courseId: Number(data.courseId)
        }
    });
};

export const getStudentCourses = () => service.get('/score/student/courses');