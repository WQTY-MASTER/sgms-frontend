import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'font-awesome/css/font-awesome.min.css';
import { ElMessage } from 'element-plus'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
const pinia = createPinia()

// ========== 新增：重写ElMessage.error，屏蔽操作失败 ==========
const originalError = ElMessage.error;
ElMessage.error = (msg) => {
    if (msg === '操作失败' || msg.includes('操作失败')) {
        console.warn('【屏蔽操作失败提示】:', msg);
        return;
    }
    originalError(msg);
};
// ========== 新增结束 ==========

const app = createApp(App)

// 全局错误处理（保留原有逻辑）
app.config.errorHandler = (err, vm, info) => {
    const ignoreErrorKeywords = [
        'v[w] is not a function',
        'zybTracker',
        'hybridaction',
        'message channel closed',
        'a listener indicated an asynchronous response'
    ];
    const errMsg = err?.message || '';
    const errStack = err?.stack || '';
    const isIgnore = ignoreErrorKeywords.some(keyword =>
        errMsg.includes(keyword) || errStack.includes(keyword)
    );
    if (isIgnore) {
        console.warn('【非核心错误】忽略：', errMsg);
        return;
    }
    if (errMsg.includes('Network Error') || errMsg.includes('500') || errMsg.includes('403') || errMsg.includes('401')) {
        console.error('全局核心错误:', err);
        ElMessage.error('系统错误，请稍后重试');
    }
};

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')