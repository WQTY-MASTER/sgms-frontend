import service from './index';

// 登录
export const login = (data) => service.post('/auth/login', data);
// 学生注册
export const studentRegister = (data) => service.post('/auth/register/student', data);
// 教师注册
export const teacherRegister = (data) => service.post('/auth/register/teacher', data);