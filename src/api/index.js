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
const service = axios.create({
    baseURL: resolveBaseURL(), // 后端接口根路径
    timeout: 5000
});

// 请求拦截器：添加Token和调试日志
service.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // 添加请求调试日志
        console.log('=== 请求信息 ===');
        console.log('URL:', config.baseURL + config.url);
        console.log('方法:', config.method);
        console.log('Token:', token ? token.substring(0, 20) + '...' : '无');
        console.log('请求参数:', config.params || config.data);
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器：处理错误和添加详细调试日志
service.interceptors.response.use(
    (res) => {
        // 补全成功响应逻辑：业务码非200时提示错误
        if (res.data.code !== 200) {
            ElMessage.error(res.data.msg || '请求失败');
            return Promise.reject(res.data);
        }
        // 打印成功响应日志（可选）
        console.log('=== 响应信息 ===');
        console.log('响应状态:', res.status);
        console.log('响应数据:', res.data);
        return res;
    },
    (error) => {
        console.log('=== 错误响应信息 ===');
        console.log('完整错误:', error);
        console.log('请求URL:', error.config?.baseURL + error.config?.url);
        console.log('响应状态:', error.response?.status);
        console.log('响应数据:', error.response?.data);
        console.log('请求头:', error.config?.headers);

        if (error.response?.status === 401) {
            ElMessage.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            ElMessage.error('没有权限访问');
            // 添加更详细的403错误信息
            console.log('=== 403错误详细信息 ===');
            console.log('请求配置:', error.config);
            console.log('响应头:', error.response?.headers);
            console.log('服务器返回:', error.response?.data);
        } else {
            ElMessage.error('服务器错误');
        }
        return Promise.reject(error);
    }
);

// 删除重复的导出语句，仅保留一份
export default service;