// quiz2-core.js - Logic chính xử lý dữ liệu (KHÔNG THAY ĐỔI)
class QuizCore {
    constructor() {
        this.dataFiles = [
            'data/data2.json',
            './data/data2.json', 
            '../data/data2.json',
            'data2.json'
        ];
        this.currentQuizData = null;
        this.currentPage = 1;
        this.questionsPerPage = 5;
        this.totalPages = 1;
        this.allQuestions = [];
        this.groupedQuestions = {};
        this.displayedGroups = new Set();
    }

    async loadQuizData() {
        try {
            const data = await this.tryLoadData(0);
            this.currentQuizData = data;
            this.processQuestions(data);
            return { success: true, totalQuestions: this.allQuestions.length };
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

        // Nhóm câu hỏi
        this.groupedQuestions = {};
        questions.forEach(question => {
            if (!question.group_name) {
                question.group_name = 'Nhóm không xác định';
            }

            if (!this.groupedQuestions[question.group_name]) {
                this.groupedQuestions[question.group_name] = {
                    group_name: question.group_name,
                    mainText: '',
                    questions: []
                };
            }
            
            if (question.text && !question.text.includes('(Tiếp tục nội dung bài đọc')) {
                this.groupedQuestions[question.group_name].mainText = question.text;
            }
            
            this.groupedQuestions[question.group_name].questions.push(question);
        });

        // Tạo mảng tất cả câu hỏi
        this.allQuestions = [];
        Object.values(this.groupedQuestions).forEach(group => {
            const sortedQuestions = group.questions.sort((a, b) => (a.id || 0) - (b.id || 0));
            this.allQuestions = this.allQuestions.concat(sortedQuestions);
        });

        // Tính tổng số trang
        this.totalPages = Math.ceil(this.allQuestions.length / this.questionsPerPage);
        
        return {
            totalQuestions: this.allQuestions.length,
            totalPages: this.totalPages,
            totalGroups: Object.keys(this.groupedQuestions).length
        };
    }

    getCurrentPageQuestions() {
        const startIndex = (this.currentPage - 1) * this.questionsPerPage;
        const endIndex = Math.min(startIndex + this.questionsPerPage, this.allQuestions.length);
        return this.allQuestions.slice(startIndex, endIndex);
    }

    getPageGroups(questions) {
        const pageGroups = {};
        
        questions.forEach(question => {
            const groupName = question.group_name;
            if (!pageGroups[groupName]) {
                pageGroups[groupName] = {
                    group_name: groupName,
                    mainText: this.groupedQuestions[groupName] ? this.groupedQuestions[groupName].mainText : '',
                    questions: []
                };
            }
            pageGroups[groupName].questions.push(question);
        });

        return pageGroups;
    }

    shouldDisplayMainText(groupName) {
        return !this.displayedGroups.has(groupName);
    }

    markGroupAsDisplayed(groupName) {
        this.displayedGroups.add(groupName);
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
                question: question.question,
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
                questionText: question.question
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
        this.displayedGroups.clear();
    }

    getQuizStats() {
        return {
            totalQuestions: this.allQuestions.length,
            totalGroups: Object.keys(this.groupedQuestions).length,
            totalPages: this.totalPages
        };
    }
}