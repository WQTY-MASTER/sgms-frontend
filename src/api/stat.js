import service from './index';

// 按分数段统计（教师）
export const getScoreSegment = (courseId) =>
    service.get('/stat/score/segment', { params: { courseId } });