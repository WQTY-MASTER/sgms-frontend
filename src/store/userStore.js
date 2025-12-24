import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        token: localStorage.getItem('token') || '',
        role: localStorage.getItem('role') || '',
        realName: localStorage.getItem('realName') || ''
    }),
    actions: {
        // 保存登录信息
        saveUserInfo(token, role, realName) {
            this.token = token;
            this.role = role;
            this.realName = realName;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('realName', realName);
        },
        // 退出登录
        logout() {
            this.token = '';
            this.role = '';
            this.realName = '';
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('realName');
        }
    }
});