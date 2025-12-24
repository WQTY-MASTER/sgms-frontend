// src/api/auth.js
import request from '@/utils/request'; // 导入统一的request实例

// 登录（路径已匹配后端/api/auth/login）
export const login = (data) => request.post('/auth/login', data);
// 学生注册（补充/api前缀，若后端实现需同步）
export const studentRegister = (data) => request.post('/auth/register/student', data);
// 教师注册
export const teacherRegister = (data) => request.post('/auth/register/teacher', data);