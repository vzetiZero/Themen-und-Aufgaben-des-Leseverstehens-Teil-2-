// quiz1-core.js - Logic chính xử lý dữ liệu cho Lesen Teil 1 (KHÔNG THAY ĐỔI)
class Quiz1Core {
    constructor() {
        this.dataFiles = [
            'data/data1.json',
            './data/data1.json', 
            '../data/data1.json',
            'data1.json'
        ];
        this.currentQuizData = null;
        this.currentPage = 1;
        this.questionsPerPage = 10;
        this.totalPages = 1;
        this.allQuestions = [];
    }

    async loadQuizData() {
        try {
            const data = await this.tryLoadData(0);
            this.currentQuizData = data;
            this.processQuestions(data);
            return { 
                success: true, 
                totalQuestions: this.allQuestions.length,
                totalPages: this.totalPages
            };
        } catch (error) {
            throw new Error(`Không thể tải dữ liệu: ${error.message}`);
        }
    }

    async tryLoadData(index) {
        if (index >= this.dataFiles.length) {
            throw new Error('Đã thử hết tất cả đường dẫn');
        }

        const currentFile = this.dataFiles[index];
        
        return new Promise((resolve, reject) => {
            $.ajax({
                url: currentFile,
                type: 'GET',
                dataType: 'json',
                success: (data) => resolve(data),
                error: () => this.tryLoadData(index + 1).then(resolve).catch(reject)
            });
        });
    }

    processQuestions(questions) {
        if (!Array.isArray(questions)) {
            throw new Error('Dữ liệu không phải là mảng');
        }

        if (questions.length === 0) {
            throw new Error('Không có câu hỏi nào trong dữ liệu');
        }

        // Sắp xếp câu hỏi theo ID
        this.allQuestions = questions.sort((a, b) => a.id - b.id);
        
        // Đánh số thứ tự toàn cục
        this.allQuestions.forEach((question, index) => {
            question.globalIndex = index + 1;
        });

        // Tính tổng số trang
        this.totalPages = Math.ceil(this.allQuestions.length / this.questionsPerPage);
        
        return {
            totalQuestions: this.allQuestions.length,
            totalPages: this.totalPages
        };
    }

    getCurrentPageQuestions() {
        const startIndex = (this.currentPage - 1) * this.questionsPerPage;
        const endIndex = Math.min(startIndex + this.questionsPerPage, this.allQuestions.length);
        return this.allQuestions.slice(startIndex, endIndex);
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    calculateResults(userAnswers) {
        let totalScore = 0;
        const results = [];
        const questionResults = [];

        this.allQuestions.forEach(question => {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer === question.correct;
            
            if (isCorrect) {
                totalScore += 10;
            }

            // Lưu kết quả theo nhóm
            if (!results.find(r => r.name === question.group_name)) {
                results.push({
                    name: question.group_name,
                    questions: []
                });
            }
            
            const group = results.find(r => r.name === question.group_name);
            group.questions.push({
                question: "Chọn tiêu đề phù hợp cho đoạn văn trên",
                userAnswer,
                correctAnswer: question.correct,
                isCorrect,
                answers: question.answer
            });

            // Lưu kết quả chi tiết cho từng câu
            questionResults.push({
                questionId: question.id,
                userAnswer,
                correctAnswer: question.correct,
                isCorrect,
                questionText: question.text,
                groupName: question.group_name
            });
        });

        return {
            totalScore,
            maxScore: this.allQuestions.length * 10,
            results,
            questionResults,
            percentage: (totalScore / (this.allQuestions.length * 10)) * 100,
            totalQuestions: this.allQuestions.length,
            correctAnswers: totalScore / 10
        };
    }

    reset() {
        this.currentPage = 1;
    }

    getQuizStats() {
        return {
            totalQuestions: this.allQuestions.length,
            totalPages: this.totalPages
        };
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            return true;
        }
        return false;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            return true;
        }
        return false;
    }

    getPaginationInfo() {
        const startIndex = (this.currentPage - 1) * this.questionsPerPage;
        const startQuestion = startIndex + 1;
        const endQuestion = Math.min(startIndex + this.questionsPerPage, this.allQuestions.length);
        
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            startQuestion,
            endQuestion,
            totalQuestions: this.allQuestions.length
        };
    }
}