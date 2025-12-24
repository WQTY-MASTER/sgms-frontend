// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 动态解析接口根路径（区分开发/生产环境）
const resolveBaseURL = () => {
    const envBaseURL = process.env.VUE_APP_API_BASE_URL;
    if (process.env.NODE_ENV === 'development') {
        if (envBaseURL && envBaseURL.startsWith('/')) {
            return envBaseURL;
        }
        return '/api';
    }
    return envBaseURL || '/api';
};

// 创建axios实例（修复重复baseURL配置）
const request = axios.create({
    baseURL: resolveBaseURL(), // 优先使用动态解析的根路径
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
            return res.data; // 直接返回成绩接口的原始数据
        }
        // 2. 兼容登录/通用接口的code格式
        if (res.data?.code === 200) {
            return res.data.data || res.data; // 成功时返回业务数据
        } else if (res.data?.code) {
            // 业务码非200时提示错误
            ElMessage.error(res.data.msg || '操作失败');
            return Promise.reject(res.data);
        }
        // 3. 兜底：无特殊格式时返回原始数据
        return res.data || res;
    },
    (error) => {
        // 401未授权：清空信息并跳转登录
        if (error.response?.status === 401) {
            ElMessage.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        // 403无权限
        else if (error.response?.status === 403) {
            ElMessage.error('没有权限访问该页面');
        }
        // 请求超时
        else if (error.message.includes('timeout')) {
            ElMessage.error('请求超时，请检查网络后重试');
        }
        // 404接口不存在
        else if (error.response?.status === 404) {
            ElMessage.error('请求的接口不存在');
        }
        // 其他错误
        else {
            console.error('服务器错误：', error);
            ElMessage.warning('操作异常，请稍后重试');
        }
        return Promise.reject(error);
    }
);

export default request;