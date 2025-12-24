// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例（固定前端8082，后端8080）
const request = axios.create({
    baseURL: 'http://localhost:8080/api', // 直接指向后端接口根路径，避免动态解析问题
    timeout: 10000, // 延长超时时间
    withCredentials: true // 允许携带Cookie（适配CORS）
});

// 请求拦截器：添加Token + 统一请求头
request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // 严格匹配后端tokenPrefix
        }
        config.headers['Content-Type'] = 'application/json;charset=utf-8';
        return config;
    },
    (error) => {
        console.error('请求拦截器错误：', error);
        ElMessage.error('请求参数异常，请检查');
        return Promise.reject(error);
    }
);

// 响应拦截器：严格匹配后端Result格式
request.interceptors.response.use(
    (res) => {
        // 后端统一返回 {code, msg, data}
        const { code, msg, data } = res.data;
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
            localStorage.clear(); // 清空所有缓存
            window.location.href = '/login';
        }
        // 403无权限
        else if (error.response?.status === 403) {
            ElMessage.error('您没有权限访问该资源');
        }
        // 其他错误
        else {
            const errMsg = error.response?.data?.msg || error.message || '服务器异常';
            ElMessage.error(errMsg);
            console.error('响应拦截器错误：', error);
        }
        return Promise.reject(error);
    }
);

export default request;