// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 动态解析接口根路径（区分开发/生产环境，兼容固定路径配置）
const resolveBaseURL = () => {
    const envBaseURL = process.env.VUE_APP_API_BASE_URL;
    if (process.env.NODE_ENV === 'development') {
        // 开发环境优先用环境变量，无则默认/api（适配前端代理）
        if (envBaseURL && envBaseURL.startsWith('/')) {
            return envBaseURL;
        }
        return '/api';
    }
    // 生产环境用环境变量，无则直接指向后端固定路径
    return envBaseURL || 'http://localhost:8080/api';
};

// 创建axios实例（整合动态路径+超时+跨域Cookie配置）
const request = axios.create({
    baseURL: resolveBaseURL(), // 动态根路径（兼容开发/生产）
    timeout: 10000, // 延长超时时间（适配生产环境）
    withCredentials: true // 允许携带Cookie（适配CORS跨域）
});

// 请求拦截器：精细化Token控制 + 统一请求头
request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        // 免Token路径列表（登录/注册接口不携带Token）
        const authFreePaths = [
            '/auth/login',
            '/auth/register/student',
            '/auth/register/teacher'
        ];
        // 仅对非免Token接口添加Token，避免登录接口冗余携带
        const shouldAttachToken =
            token && !authFreePaths.some((path) => config.url?.includes(path));

        if (shouldAttachToken) {
            config.headers.Authorization = `Bearer ${token}`; // 严格匹配后端tokenPrefix
        }
        // 统一请求头，避免后端解析异常
        config.headers['Content-Type'] = 'application/json;charset=utf-8';
        return config;
    },
    (error) => {
        console.error('请求拦截器错误：', error);
        ElMessage.error('请求参数异常，请检查');
        return Promise.reject(error);
    }
);

// 响应拦截器：兼容多格式响应 + 严格Result格式 + 精细化错误处理
request.interceptors.response.use(
    (res) => {
        const responseData = res.data;
        // 1. 兼容成绩接口特殊格式（无code，直接返回{total, list}）
        if (responseData && typeof responseData === 'object' && ('total' in responseData || 'list' in responseData)) {
            return responseData;
        }
        // 2. 严格匹配后端统一Result格式 {code, msg, data}
        const { code, msg, data } = responseData;
        if (code === 200) {
            return data; // 成功时直接返回业务数据（token/role等）
        } else {
            ElMessage.error(msg || '操作失败');
            return Promise.reject(new Error(msg));
        }
    },
    (error) => {
        // 401未授权：清空缓存并跳转登录
        if (error.response?.status === 401) {
            ElMessage.error(error.response.data?.msg || '登录已过期，请重新登录');
            localStorage.clear(); // 清空所有缓存（兼容userInfo/token/role）
            window.location.href = '/login';
        }
        // 403无权限：精细化提示
        else if (error.response?.status === 403) {
            ElMessage.error('您没有权限访问该资源');
        }
        // 请求超时：单独提示
        else if (error.message.includes('timeout')) {
            ElMessage.error('请求超时，请检查网络后重试');
        }
        // 404接口不存在：单独提示
        else if (error.response?.status === 404) {
            ElMessage.error('请求的接口不存在');
        }
        // 其他错误：通用提示 + 详细日志
        else {
            const errMsg = error.response?.data?.msg || error.message || '服务器异常';
            ElMessage.error(errMsg);
            console.error('响应拦截器错误：', error);
        }
        return Promise.reject(error);
    }
);

export default request;