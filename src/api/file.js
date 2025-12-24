import service from './index';

// 上传成绩Excel
export const uploadScoreExcel = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return service.post('/file/upload/score', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// 导出成绩为Excel
export const exportScoreExcel = (courseId) =>
    service.get('/export/score/excel', {
        params: { courseId },
        responseType: 'blob' // 二进制流
    });