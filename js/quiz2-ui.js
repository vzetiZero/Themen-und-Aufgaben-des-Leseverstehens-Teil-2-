// quiz2-ui.js - Xử lý giao diện cho Lesen Teil 2 (CÓ THỂ THAY ĐỔI)
class Quiz2UI {
    constructor(quizCore, storageManager) {
        this.quizCore = quizCore;
        this.storage = storageManager;
        this.currentView = 'quiz'; // 'quiz', 'results', 'history'
        this.userAnswers = {};
    }

    init() {
        this.bindEvents();
        this.loadQuizData();
    }

    bindEvents() {
        $('#submit-btn').click(() => this.handleSubmit());
        $('#retry-btn').click(() => this.loadQuizData());
        $('#prev-page').click(() => this.previousPage());
        $('#next-page').click(() => this.nextPage());
        $('#back-btn').click(() => window.location.href = 'index.html');
        $('#history-toggle').click(() => this.showHistory());
        $('#close-history').click(() => this.hideHistory());
        $('#history-btn').click(() => this.showHistory());
        $('#clear-history-btn').click(() => this.clearHistory());

        // Lưu câu trả lời khi người dùng chọn
        $(document).on('change', 'input[type="radio"]', (e) => {
            const questionId = $(e.target).attr('name').replace('question-', '');
            const answer = $(e.target).val();
            this.userAnswers[questionId] = answer;
        });
    }

    async loadQuizData() {
        try {
            this.showLoading();
            const result = await this.quizCore.loadQuizData();
            this.hideLoading();
            this.showQuiz();
            this.displayCurrentPage();
            
            SwalAlert.success('Thành công!', `Đã tải ${result.totalQuestions} câu hỏi từ ${result.totalGroups} nhóm`);
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    showLoading() {
        $('#loading').show();
        $('#quiz-content').hide();
        $('#result-container').hide();
        $('#error-message').hide();
        $('#history-container').hide();
    }

    hideLoading() {
        $('#loading').hide();
    }

    showQuiz() {
        $('#quiz-content').show();
        $('#result-container').hide();
        $('#error-message').hide();
        $('#history-container').hide();
        this.currentView = 'quiz';
    }

    showError(message) {
        $('#error-text').text(message);
        $('#error-message').show();
        $('#loading').hide();
        $('#quiz-content').hide();
        
        SwalAlert.error('Lỗi tải dữ liệu', message);
    }

    displayCurrentPage() {
        const $quizForm = $('#quiz-form');
        $quizForm.empty();

        const currentQuestions = this.quizCore.getCurrentPageQuestions();
        const pageGroups = this.quizCore.getPageGroups(currentQuestions);

        // Hiển thị từng nhóm trong trang hiện tại
        Object.values(pageGroups).forEach((group) => {
            const $groupContainer = this.createGroupElement(group);
            $quizForm.append($groupContainer);
        });

        // Khôi phục câu trả lời đã chọn (nếu có)
        this.restoreUserAnswers();

        this.updatePaginationInfo();
    }

    createGroupElement(group) {
        const $groupContainer = $('<div>').addClass('group-container');
        
        // Tên nhóm
        const $groupName = $('<div>').addClass('group-name')
            .text(group.group_name);
        $groupContainer.append($groupName);
        
        // Văn bản chính của nhóm
        if (this.quizCore.shouldDisplayMainText(group.group_name) && group.mainText && group.mainText.trim() !== '') {
            const $readingText = $('<div>').addClass('reading-text')
                .html(`<h3>📖 Bài đọc:</h3><div class="reading-content">${group.mainText}</div>`);
            $groupContainer.append($readingText);
            this.quizCore.markGroupAsDisplayed(group.group_name);
        }

        // Hiển thị từng câu hỏi trong nhóm
        group.questions.forEach(question => {
            const $questionElement = this.createQuestionElement(question);
            $groupContainer.append($questionElement);
        });
        
        return $groupContainer;
    }

    createQuestionElement(question) {
        const $questionContainer = $('<div>').addClass('question-container')
            .attr('data-id', question.id);
        
        // Số câu hỏi
        const $questionNumber = $('<div>').addClass('question-number')
            .text(`Câu ${question.id}`);
        
        // Hiển thị text tiếp theo nếu có
        if (question.text && question.text.includes('(Tiếp tục nội dung bài đọc')) {
            const $continueText = $('<div>').addClass('continue-text')
                .text('📄 (Tiếp tục nội dung bài đọc...)');
            $questionContainer.append($continueText);
        }
        
        // Nội dung câu hỏi
        const $questionText = $('<div>').addClass('question-text')
            .text(question.question);
        
        $questionContainer.append($questionNumber, $questionText);
        
        const $optionsContainer = this.createOptionsContainer(question);
        $questionContainer.append($optionsContainer);
        
        return $questionContainer;
    }

    createOptionsContainer(question) {
        const $optionsContainer = $('<div>').addClass('options-container');
        
        if (!question.answer || !Array.isArray(question.answer)) {
            $optionsContainer.html(
                '<div style="color: red; padding: 1rem; text-align: center; background: #ffeaea; border-radius: 5px;">' +
                '⚠️ Không có đáp án cho câu hỏi này' +
                '</div>'
            );
            return $optionsContainer;
        }
        
        question.answer.forEach((answer, index) => {
            const $optionDiv = $('<div>').addClass('option');
            
            const $input = $('<input>').attr({
                type: 'radio',
                name: `question-${question.id}`,
                value: answer ? answer.charAt(0) : 'X',
                id: `q${question.id}-a${index}`
            });
            
            const $label = $('<label>').attr('for', `q${question.id}-a${index}`)
                .text(answer || 'Đáp án không có nội dung');
            
            $optionDiv.append($input, $label);
            $optionsContainer.append($optionDiv);
        });
        
        return $optionsContainer;
    }

    restoreUserAnswers() {
        // Khôi phục câu trả lời đã chọn từ userAnswers
        Object.keys(this.userAnswers).forEach(questionId => {
            const answer = this.userAnswers[questionId];
            $(`input[name="question-${questionId}"][value="${answer}"]`).prop('checked', true);
        });
    }

    updatePaginationInfo() {
        const startIndex = (this.quizCore.currentPage - 1) * this.quizCore.questionsPerPage;
        const startQuestion = startIndex + 1;
        const endQuestion = Math.min(startIndex + this.quizCore.questionsPerPage, this.quizCore.allQuestions.length);
        const totalQuestions = this.quizCore.allQuestions.length;
        
        $('#quiz-progress').text(
            `Trang ${this.quizCore.currentPage}/${this.quizCore.totalPages} - ` +
            `Câu ${startQuestion}-${endQuestion}/${totalQuestions}`
        );
        
        $('#page-info').text(`Trang ${this.quizCore.currentPage}/${this.quizCore.totalPages}`);
        
        $('#prev-page').prop('disabled', this.quizCore.currentPage === 1);
        $('#next-page').prop('disabled', this.quizCore.currentPage === this.quizCore.totalPages);
    }

    previousPage() {
        if (this.quizCore.currentPage > 1) {
            this.quizCore.currentPage--;
            this.displayCurrentPage();
        }
    }

    nextPage() {
        if (this.quizCore.currentPage < this.quizCore.totalPages) {
            this.quizCore.currentPage++;
            this.displayCurrentPage();
        }
    }

    async handleSubmit() {
        const userAnswers = this.collectUserAnswers();
        const unanswered = this.getUnansweredQuestions(userAnswers);

        if (unanswered.length > 0) {
            const result = await SwalAlert.confirmUnanswered(unanswered.length);
            if (!result.isConfirmed) return;
        }

        this.processResults(userAnswers);
    }

    collectUserAnswers() {
        const userAnswers = {};
        this.quizCore.allQuestions.forEach(question => {
            const selectedOption = $(`input[name="question-${question.id}"]:checked`);
            userAnswers[question.id] = selectedOption.length > 0 ? selectedOption.val() : null;
        });
        return userAnswers;
    }

    getUnansweredQuestions(userAnswers) {
        return this.quizCore.allQuestions.filter(q => !userAnswers[q.id]).map(q => q.id);
    }

    async processResults(userAnswers) {
        try {
            const results = this.quizCore.calculateResults(userAnswers);
            
            // Lưu kết quả
            const historyEntry = this.storage.saveResult(results);
            
            // Hiển thị kết quả tổng quan
            const alertResult = await SwalAlert.showResults(results);
            
            if (alertResult.isConfirmed) {
                this.showDetailedResults(results);
            } else if (alertResult.dismiss === Swal.DismissReason.cancel) {
                this.retryQuiz();
            }
        } catch (error) {
            console.error('Lỗi khi xử lý kết quả:', error);
            SwalAlert.error('Lỗi', 'Có lỗi xảy ra khi xử lý kết quả. Vui lòng thử lại.');
        }
    }

    showDetailedResults(results) {
        const $resultContainer = $('#result-container');
        const $quizContent = $('#quiz-content');
        
        $quizContent.hide();
        $resultContainer.show().empty();
        this.currentView = 'results';

        // Hiển thị kết quả chi tiết
        this.renderDetailedResults($resultContainer, results);
        
        $('html, body').animate({ scrollTop: $resultContainer.offset().top }, 500);
    }

    renderDetailedResults($container, results) {
        // Điểm tổng
        const $scoreContainer = $('<div>').addClass('score-container');
        $scoreContainer.append(
            $('<div>').addClass('score').text(results.totalScore),
            $('<div>').addClass('score-text').text(`Điểm: ${results.totalScore}/${results.maxScore}`),
            $('<div>').addClass('score-percentage').text(`Tỷ lệ đúng: ${results.percentage.toFixed(1)}%`)
        );
        $container.append($scoreContainer);

        // Thống kê nhanh
        const $quickStats = $('<div>').addClass('quick-stats').css({
            'display': 'grid',
            'grid-template-columns': 'repeat(auto-fit, minmax(150px, 1fr))',
            'gap': '1rem',
            'margin': '2rem 0',
            'padding': '1.5rem',
            'background': '#f8f9fa',
            'border-radius': '10px'
        });

        $quickStats.append(
            $('<div>').addClass('stat-item').html(
                `<div class="stat-number">${results.correctAnswers}</div>
                 <div class="stat-label">Câu đúng</div>`
            ),
            $('<div>').addClass('stat-item').html(
                `<div class="stat-number">${results.totalQuestions - results.correctAnswers}</div>
                 <div class="stat-label">Câu sai</div>`
            ),
            $('<div>').addClass('stat-item').html(
                `<div class="stat-number">${results.totalQuestions}</div>
                 <div class="stat-label">Tổng câu</div>`
            ),
            $('<div>').addClass('stat-item').html(
                `<div class="stat-number">${results.results.length}</div>
                 <div class="stat-label">Số nhóm</div>`
            )
        );

        $container.append($quickStats);

        // Chi tiết theo nhóm
        const $detailsContainer = $('<div>').addClass('result-details');
        $detailsContainer.append($('<h3>').text('📊 Chi tiết kết quả theo nhóm').css({
            'text-align': 'center',
            'margin-bottom': '2rem',
            'color': '#2d3748'
        }));

        results.results.forEach((group, groupIndex) => {
            const $groupResult = this.renderGroupResult(group, groupIndex);
            $detailsContainer.append($groupResult);
        });
        $container.append($detailsContainer);

        // Các nút hành động
        this.renderActionButtons($container);
    }

    renderGroupResult(group, groupIndex) {
        const $groupResult = $('<div>').addClass('result-group');
        const $groupTitle = $('<h3>').text(`📁 ${groupIndex + 1}. ${group.name}`);
        $groupResult.append($groupTitle);

        let groupScore = 0;
        let correctCount = 0;

        group.questions.forEach((q, qIndex) => {
            if (q.isCorrect) {
                groupScore += 10;
                correctCount++;
            }
            
            const $feedbackItem = $('<div>').addClass(`feedback-item ${q.isCorrect ? 'correct' : 'incorrect'}`);
            
            const $questionHeader = $('<div>').addClass('feedback-header').css({
                'display': 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                'margin-bottom': '0.5rem'
            });
            
            $questionHeader.append(
                $('<div>').addClass('feedback-question').text(`Câu ${qIndex + 1}: ${q.question}`),
                $('<div>').addClass(`feedback-status ${q.isCorrect ? 'status-correct' : 'status-incorrect'}`)
                    .text(q.isCorrect ? '✅ Đúng' : '❌ Sai')
                    .css({
                        'font-size': '0.9rem',
                        'font-weight': 'bold',
                        'padding': '0.3rem 0.8rem',
                        'border-radius': '15px',
                        'background': q.isCorrect ? '#d4edda' : '#f8d7da',
                        'whiteSpace': 'nowrap'
                    })
            );
            
            $feedbackItem.append($questionHeader);
            $feedbackItem.append(
                $('<div>').addClass('feedback-answer').text(`🧩 Câu trả lời của bạn: ${q.userAnswer || 'Chưa trả lời'}`),
                $('<div>').addClass('feedback-correct').text(`🎯 Đáp án đúng: ${q.correctAnswer}`)
            );
            $groupResult.append($feedbackItem);
        });

        const groupPercentage = (correctCount / group.questions.length) * 100;
        const $groupScoreElement = $('<div>').addClass('group-score-summary').css({
            'text-align': 'right',
            'font-weight': 'bold',
            'color': '#667eea',
            'margin-top': '1rem',
            'padding': '1rem',
            'background': '#f7fafc',
            'border-radius': '8px',
            'border-left': '4px solid #667eea'
        }).html(`
            <div>📈 Điểm nhóm: ${groupScore}/${group.questions.length * 10}</div>
            <div style="font-size: 0.9rem; color: #718096; margin-top: 0.3rem;">
                Tỷ lệ đúng: ${groupPercentage.toFixed(1)}% (${correctCount}/${group.questions.length} câu)
            </div>
        `);
        
        $groupResult.append($groupScoreElement);
        return $groupResult;
    }

    renderActionButtons($container) {
        const $actionButtons = $('<div>').addClass('action-buttons').css({
            'display': 'flex',
            'gap': '1rem',
            'justify-content': 'center',
            'margin': '2rem 0',
            'flex-wrap': 'wrap'
        });

        const $retryButton = $('<button>').addClass('btn-primary')
            .html('🔄 Làm lại bài kiểm tra')
            .click(() => this.retryQuiz());

        const $historyButton = $('<button>').addClass('btn-info')
            .html('📊 Xem lịch sử')
            .click(() => this.showHistory());

        const $homeButton = $('<button>').addClass('btn-secondary')
            .html('🏠 Về trang chủ')
            .click(() => window.location.href = 'index.html');

        $actionButtons.append($retryButton, $historyButton, $homeButton);
        $container.append($actionButtons);
    }

    retryQuiz() {
        // Reset câu trả lời
        this.userAnswers = {};
        this.quizCore.reset();
        this.loadQuizData();
        $('#result-container').hide();
    }

    showHistory() {
        const history = this.storage.getHistory();
        this.renderHistory(history);
        $('#quiz-content').hide();
        $('#result-container').hide();
        $('#history-container').show();
        this.currentView = 'history';
    }

    hideHistory() {
        $('#history-container').hide();
        this.showQuiz();
    }

    async clearHistory() {
        const result = await Swal.fire({
            title: 'Xoá lịch sử?',
            text: 'Bạn có chắc muốn xoá toàn bộ lịch sử làm bài? Hành động này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xoá toàn bộ',
            cancelButtonText: 'Huỷ bỏ',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6'
        });

        if (result.isConfirmed) {
            this.storage.clearHistory();
            
            Swal.fire({
                title: 'Đã xoá!',
                text: 'Toàn bộ lịch sử làm bài đã được xoá.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Nếu đang ở trang lịch sử, cập nhật lại
            if (this.currentView === 'history') {
                this.showHistory();
            }
        }
    }

    renderHistory(history) {
        const $historyContent = $('#history-content');
        $historyContent.empty();

        if (history.length === 0) {
            $historyContent.html(
                '<div class="no-history" style="text-align: center; padding: 3rem; color: #718096;">' +
                '📝 Chưa có lịch sử làm bài<br><small>Hãy hoàn thành bài kiểm tra đầu tiên!</small>' +
                '</div>'
            );
            return;
        }

        // Thêm nút xoá lịch sử trong phần history
        const $clearButton = $('<button>').addClass('btn-clear-history')
            .html('🗑️ Xoá lịch sử')
            .css({
                'background': '#e74c3c',
                'color': 'white',
                'border': 'none',
                'padding': '0.8rem 1.5rem',
                'border-radius': '8px',
                'cursor': 'pointer',
                'margin-bottom': '1rem',
                'float': 'right',
                'fontWeight': '600'
            })
            .click(() => this.clearHistory());
        
        $historyContent.append($clearButton);
        $historyContent.append('<div style="clear: both;"></div>');

        // Thống kê
        const stats = this.calculateHistoryStats(history);
        const $statsContainer = this.renderHistoryStats(stats);
        $historyContent.append($statsContainer);

        // Danh sách lịch sử với nút xoá từng item
        const $historyList = $('<div>').addClass('history-list');
        history.forEach((entry, index) => {
            const $historyItem = this.renderHistoryItem(entry, index);
            $historyList.append($historyItem);
        });
        $historyContent.append($historyList);
    }

    calculateHistoryStats(history) {
        const totalTests = history.length;
        const averageScore = history.reduce((sum, entry) => sum + entry.percentage, 0) / totalTests;
        const bestScore = Math.max(...history.map(entry => entry.percentage));
        const latestScore = history[0]?.percentage || 0;
        const totalQuestions = history[0]?.totalQuestions || 0;

        return { totalTests, averageScore, bestScore, latestScore, totalQuestions };
    }

    renderHistoryStats(stats) {
        const $statsContainer = $('<div>').addClass('history-stats');
        
        const statsData = [
            { number: stats.totalTests, label: 'Tổng số bài', icon: '📊' },
            { number: stats.averageScore.toFixed(1) + '%', label: 'Điểm trung bình', icon: '📈' },
            { number: stats.bestScore.toFixed(1) + '%', label: 'Điểm cao nhất', icon: '⭐' },
            { number: stats.latestScore.toFixed(1) + '%', label: 'Điểm gần nhất', icon: '🕒' }
        ];

        statsData.forEach(stat => {
            const $statCard = $('<div>').addClass('stat-card');
            $statCard.append(
                $('<div>').addClass('stat-icon').text(stat.icon).css({
                    'fontSize': '2rem',
                    'marginBottom': '0.5rem'
                }),
                $('<div>').addClass('stat-number').text(stat.number),
                $('<div>').addClass('stat-label').text(stat.label)
            );
            $statsContainer.append($statCard);
        });

        return $statsContainer;
    }

    renderHistoryItem(entry, index) {
        const $item = $('<div>').addClass('history-item');
        const date = new Date(entry.timestamp).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Nút xoá từng item
        const $deleteButton = $('<button>').addClass('btn-delete-item')
            .html('🗑️')
            .css({
                'background': 'none',
                'border': 'none',
                'color': '#e74c3c',
                'cursor': 'pointer',
                'font-size': '1.2rem',
                'position': 'absolute',
                'right': '1rem',
                'top': '1rem',
                'padding': '0.3rem',
                'borderRadius': '4px',
                'transition': 'all 0.3s ease'
            })
            .click((e) => {
                e.stopPropagation();
                this.deleteHistoryItem(index);
            });

        $item.append($deleteButton);

        // Xác định màu sắc dựa trên điểm số
        let scoreColor = '#e74c3c'; // Đỏ cho điểm thấp
        if (entry.percentage >= 80) scoreColor = '#27ae60'; // Xanh lá cho điểm cao
        else if (entry.percentage >= 60) scoreColor = '#f39c12'; // Vàng cho điểm trung bình

        $item.append(
            $('<div>').addClass('history-date').html(`📅 <strong>${date}</strong>`),
            $('<div>').addClass('history-score').append(
                $('<div>').addClass('score-details').html(
                    `✅ <strong>${entry.correctAnswers}/${entry.totalQuestions}</strong> câu đúng`
                ),
                $('<div>').addClass('score-value').text(
                    `${entry.percentage.toFixed(1)}%`
                ).css('color', scoreColor)
            )
        );

        return $item;
    }

    async deleteHistoryItem(index) {
        const result = await Swal.fire({
            title: 'Xoá bản ghi?',
            text: 'Bạn có chắc muốn xoá bản ghi lịch sử này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xoá',
            cancelButtonText: 'Huỷ',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6'
        });

        if (result.isConfirmed) {
            const success = this.storage.deleteHistoryItem(index);
            
            if (success) {
                Swal.fire({
                    title: 'Đã xoá!',
                    text: 'Bản ghi lịch sử đã được xoá.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Cập nhật lại giao diện
                this.showHistory();
            } else {
                SwalAlert.error('Lỗi', 'Không thể xoá bản ghi lịch sử.');
            }
        }
    }

    // Hàm tiện ích để debug
    debug() {
        console.log('Current Quiz State:', {
            currentPage: this.quizCore.currentPage,
            totalPages: this.quizCore.totalPages,
            totalQuestions: this.quizCore.allQuestions.length,
            totalGroups: Object.keys(this.quizCore.groupedQuestions).length,
            userAnswers: this.userAnswers,
            currentView: this.currentView,
            displayedGroups: Array.from(this.quizCore.displayedGroups)
        });
        
        // Hiển thị thông tin chi tiết về các nhóm
        console.log('Group Information:', this.quizCore.groupedQuestions);
    }

    // Hàm để xem trạng thái câu trả lời
    showAnswerStatus() {
        const totalQuestions = this.quizCore.allQuestions.length;
        const answered = Object.keys(this.userAnswers).length;
        const unanswered = totalQuestions - answered;
        
        Swal.fire({
            title: 'Trạng thái làm bài',
            html: `
                <div style="text-align: left; line-height: 2;">
                    <div>📊 Tổng số câu: <strong>${totalQuestions}</strong></div>
                    <div>✅ Đã trả lời: <strong style="color: #27ae60">${answered}</strong></div>
                    <div>⏳ Chưa trả lời: <strong style="color: #e74c3c">${unanswered}</strong></div>
                    <div>📈 Tiến độ: <strong>${((answered / totalQuestions) * 100).toFixed(1)}%</strong></div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#667eea'
        });
    }
}

// Khởi tạo ứng dụng
$(document).ready(function() {
    const quizCore = new QuizCore();
    const storageManager = new QuizStorage();
    const quizUI = new Quiz2UI(quizCore, storageManager);
    
    // Cho phép truy cập từ console để debug
    window.quiz2App = quizUI;
    window.quiz2Core = quizCore;
    window.quiz2Storage = storageManager;
    
    quizUI.init();
    
    // Thêm phím tắt cho developer
    $(document).on('keydown', function(e) {
        // Ctrl + D để debug
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            quizUI.debug();
        }
        // Ctrl + S để xem trạng thái
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            quizUI.showAnswerStatus();
        }
    });
});