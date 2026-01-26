// 在 Remix 中，這會是真正的 Prisma Client
export class PostgresService {
    // 獲取案子聚合數據：雜事 + 今日事 + 任務
    async getProjectAggregation(projectId) {
        console.log(`[Postgres] 執行聚合查詢: SELECT SUM(timeValue) FROM Task WHERE projectId = ${projectId} GROUP BY timeType`);
        // 回傳三種類型時間的加總
        return {
            miscMinutes: 120,
            dailyHours: 8.5,
            longDays: 2
        };
    }
    async getDashboardData(userId) {
        console.log(`[Postgres] 加載使用者 ${userId} 的戰情室數據...`);
        // 模擬從 Postgres 獲取資料
        return {
            tasks: [],
            projects: [],
            allocations: []
        };
    }
}
export const db = new PostgresService();
