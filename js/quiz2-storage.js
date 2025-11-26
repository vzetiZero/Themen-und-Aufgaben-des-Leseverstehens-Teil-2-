// quiz2-storage.js - Quản lý lưu trữ lịch sử
class QuizStorage {
    constructor() {
        this.storageKey = 'quiz2_history';
        this.maxHistoryEntries = 50; // Giới hạn số bản ghi
    }

    saveResult(results) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            score: results.totalScore,
            maxScore: results.maxScore,
            percentage: results.percentage,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            questionResults: results.questionResults
        };

        const history = this.getHistory();
        
        // Thêm vào đầu mảng
        history.unshift(historyEntry);
        
        // Giới hạn số bản ghi
        if (history.length > this.maxHistoryEntries) {
            history.splice(this.maxHistoryEntries);
        }

        // Lưu vào localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        
        return historyEntry;
    }

    getHistory() {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Lỗi khi đọc lịch sử:', error);
            return [];
        }
    }
    deleteHistoryItem(index) {
        const history = this.getHistory();
        if (index >= 0 && index < history.length) {
            history.splice(index, 1);
            localStorage.setItem(this.storageKey, JSON.stringify(history));
            return true;
        }
        return false;
    }
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }

    getStats() {
        const history = this.getHistory();
        if (history.length === 0) {
            return null;
        }

        const totalTests = history.length;
        const averageScore = history.reduce((sum, entry) => sum + entry.percentage, 0) / totalTests;
        const bestScore = Math.max(...history.map(entry => entry.percentage));
        const latestScore = history[0]?.percentage || 0;
        const progress = this.calculateProgress(history);

        return {
            totalTests,
            averageScore,
            bestScore,
            latestScore,
            progress
        };
    }

    calculateProgress(history) {
        if (history.length < 2) return 0;
        
        const recentScores = history.slice(0, 5).map(entry => entry.percentage);
        const olderScores = history.slice(-5).map(entry => entry.percentage);
        
        const recentAvg = recentScores.reduce((a, b) => a + b) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b) / olderScores.length;
        
        return recentAvg - olderAvg;
    }
}