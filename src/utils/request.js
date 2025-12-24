// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 5000
});

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // 统一请求头，避免后端解析异常
        config.headers['Content-Type'] = 'application/json;charset=utf-8';
        return config;
    },
    (error) => {
        console.error('请求参数错误：', error);
        return Promise.reject(error);
    }
);

// 响应拦截器优化（核心修改：兼容无code的成绩接口 + 登录接口）
request.interceptors.response.use(
    (res) => {
        // 1. 兼容成绩接口返回的{total, list}格式（无code）
        if (res.data && typeof res.data === 'object' && ('total' in res.data || 'list' in res.data)) {
            return res.data;
        }
        // 2. 兼容登录/注册接口（可能直接返回token/role，无code）
        if (res.data && typeof res.data === 'object' && (res.data.token || res.data.role)) {
            return res.data;
        }
        // 3. 处理有code的常规接口（如教师课程接口）
        if (res.data && typeof res.data === 'object' && 'code' in res.data) {
            if (res.data.code !== 200) {
                ElMessage.error(res.data.msg || '操作失败');
                return Promise.reject(res.data);
            }
            return res.data;
        }
        // 4. 非JSON响应直接返回
        return res.data || res;
    },
    (error) => {
        if (error.response?.status === 401) {
            ElMessage.error('登录已过期，请重新登录');
            // 清空所有存储的用户信息
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            ElMessage.error('没有权限访问该页面');
        } else if (error.message.includes('timeout')) {
            ElMessage.error('请求超时，请检查网络后重试');
        } else if (error.response?.status === 404) {
            ElMessage.error('请求的接口不存在');
        } else {
            console.error('服务器错误：', error);
            // 仅在非401/403/404/超时场景，轻量提示
            ElMessage.warning('操作异常，请稍后重试');
        }
        return Promise.reject(error);
    }
);

export default request;