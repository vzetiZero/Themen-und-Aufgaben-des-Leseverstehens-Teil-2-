// quiz1.js - Xử lý riêng cho Lesen Teil 1 với phân trang và sắp xếp theo ID
$(document).ready(function() {
    const dataFile = 'data/data1.json';
    let currentQuizData = null;
    let currentPage = 1;
    const questionsPerPage = 10;
    let totalPages = 1;
    let allQuestions = [];

    // Khởi tạo quiz
    initQuiz();

    function initQuiz() {
        loadQuizData();
        
        $('#submit-btn').click(function() {
            submitQuiz();
        });
        
        $('#retry-btn').click(function() {
            loadQuizData();
        });

        // Sự kiện phân trang
        $('#prev-page').click(function() {
            if (currentPage > 1) {
                currentPage--;
                displayCurrentPage();
            }
        });

        $('#next-page').click(function() {
            if (currentPage < totalPages) {
                currentPage++;
                displayCurrentPage();
            }
        });
    }

    function loadQuizData() {
        $('#loading').show();
        $('#quiz-content').hide();
        $('#result-container').hide();
        $('#error-message').hide();
        
        $.ajax({
            url: dataFile,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                currentQuizData = data;
                processQuestions(data);
                $('#loading').hide();
                $('#quiz-content').show();
                displayCurrentPage();
            },
            error: function(xhr, status, error) {
                $('#loading').hide();
                $('#error-text').text('Lỗi khi tải dữ liệu: ' + error);
                $('#error-message').show();
            }
        });
    }

    function processQuestions(questions) {
        // Sắp xếp câu hỏi theo ID
        allQuestions = questions.sort((a, b) => a.id - b.id);
        
        // Đánh số thứ tự toàn cục theo ID
        allQuestions.forEach((question, index) => {
            question.globalIndex = index + 1;
        });

        // Tính tổng số trang
        totalPages = Math.ceil(allQuestions.length / questionsPerPage);
        
        console.log(`Tổng câu hỏi: ${allQuestions.length}, Tổng trang: ${totalPages}`);
    }

    function displayCurrentPage() {
        const $quizForm = $('#quiz-form');
        $quizForm.empty();

        // Tính chỉ số câu hỏi cho trang hiện tại
        const startIndex = (currentPage - 1) * questionsPerPage;
        const endIndex = Math.min(startIndex + questionsPerPage, allQuestions.length);
        const currentPageQuestions = allQuestions.slice(startIndex, endIndex);

        console.log(`Hiển thị trang ${currentPage}: câu ${startIndex + 1}-${endIndex}`);

        // Hiển thị từng câu hỏi cho trang hiện tại
        currentPageQuestions.forEach(question => {
            const $questionElement = createQuestionElement(question);
            $quizForm.append($questionElement);
        });

        // Cập nhật thông tin phân trang
        updatePaginationInfo(startIndex, endIndex);
    }

    function updatePaginationInfo(startIndex, endIndex) {
        const startQuestion = startIndex + 1;
        const endQuestion = endIndex;
        const totalQuestions = allQuestions.length;
        
        $('#quiz-progress').text(`Trang ${currentPage}/${totalPages} - Câu ${startQuestion}-${endQuestion}/${totalQuestions}`);
        $('#page-info').text(`Trang ${currentPage}/${totalPages}`);
        
        // Cập nhật trạng thái nút phân trang
        $('#prev-page').prop('disabled', currentPage === 1);
        $('#next-page').prop('disabled', currentPage === totalPages);
    }

    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    function createQuestionElement(question) {
        const $questionContainer = $('<div>').addClass('question-container')
            .attr('data-id', question.id);
        
        // Số câu hỏi
        const $questionNumber = $('<div>').addClass('question-number')
            .text(`${question.id}. ${question.group_name}`);
        
        // Đoạn văn (chỉ hiển thị 1 lần)
        const $questionText = $('<div>').addClass('question-text')
            .text(question.text);
        
        // Câu hỏi
        const $questionPrompt = $('<div>').addClass('question-prompt')
            .text('Chọn tiêu đề phù hợp cho đoạn văn trên');
        
        $questionContainer.append($questionNumber, $questionText, $questionPrompt);
        
        const $optionsContainer = createOptionsContainer(question);
        $questionContainer.append($optionsContainer);
        
        return $questionContainer;
    }

    function createOptionsContainer(question) {
        const $optionsContainer = $('<div>').addClass('options-container');
        
        // Xáo trộn đáp án (nhưng vẫn giữ thứ tự a, b, c...)
        const shuffledAnswers = shuffleArray([...question.answer]);
        
        shuffledAnswers.forEach((answer, index) => {
            const $optionDiv = $('<div>').addClass('option');
            
            const $input = $('<input>').attr({
                type: 'radio',
                name: `question-${question.id}`,
                value: answer.charAt(0), // Lấy ký tự đầu (a, b, c...)
                id: `q${question.id}-a${index}`
            });
            
            const $label = $('<label>').attr('for', `q${question.id}-a${index}`)
                .text(answer);
            
            $optionDiv.append($input, $label);
            $optionsContainer.append($optionDiv);
        });
        
        return $optionsContainer;
    }

    function submitQuiz() {
        if (!currentQuizData) return;

        let totalScore = 0;
        let totalQuestions = 0;
        const results = [];

        // Kiểm tra tất cả câu hỏi
        allQuestions.forEach(question => {
            totalQuestions++;
            const selectedOption = $(`input[name="question-${question.id}"]:checked`);
            const userAnswer = selectedOption.length > 0 ? selectedOption.val() : null;
            const isCorrect = userAnswer === question.correct;
            
            if (isCorrect) {
                totalScore += 10;
            }

            // Lưu kết quả cho câu hỏi này
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
        });

        displayResults(totalScore, totalQuestions * 10, results);
    }

    function displayResults(totalScore, maxScore, results) {
        const $resultContainer = $('#result-container');
        const $quizContent = $('#quiz-content');
        
        $quizContent.hide();
        $resultContainer.show().empty();

        // Hiển thị điểm tổng
        const $scoreContainer = $('<div>').addClass('score-container');
        
        const $scoreElement = $('<div>').addClass('score')
            .text(totalScore);
        
        const $scoreText = $('<div>').addClass('score-text')
            .text(`Điểm: ${totalScore}/${maxScore}`);
        
        $scoreContainer.append($scoreElement, $scoreText);
        $resultContainer.append($scoreContainer);

        const $detailsContainer = $('<div>').addClass('result-details');
        
        results.forEach((group, groupIndex) => {
            const $groupResult = $('<div>').addClass('result-group');
            
            const $groupTitle = $('<h3>').text(`${groupIndex + 1}. ${group.name}`);
            $groupResult.append($groupTitle);

            let groupScore = 0;
            group.questions.forEach((q, qIndex) => {
                if (q.isCorrect) groupScore += 10;
                
                const $feedbackItem = $('<div>').addClass(`feedback-item ${q.isCorrect ? 'correct' : 'incorrect'}`);
                
                const $questionText = $('<div>').addClass('feedback-question')
                    .text(`Câu ${qIndex + 1}: ${q.question}`);
                
                const $userAnswer = $('<div>').addClass('feedback-answer')
                    .text(`Câu trả lời của bạn: ${q.userAnswer || 'Chưa trả lời'}`);
                
                const $correctAnswer = $('<div>').addClass('feedback-correct')
                    .text(`Đáp án đúng: ${q.correctAnswer}`);
                
                $feedbackItem.append($questionText, $userAnswer, $correctAnswer);
                $groupResult.append($feedbackItem);
            });

            const $groupScoreElement = $('<div>').css({
                'text-align': 'right',
                'font-weight': 'bold',
                'color': '#667eea',
                'margin-top': '1rem'
            }).text(`Điểm nhóm: ${groupScore}/${group.questions.length * 10}`);
            
            $groupResult.append($groupScoreElement);
            $detailsContainer.append($groupResult);
        });

        $resultContainer.append($detailsContainer);

        // Nút làm lại
        const $retryButton = $('<button>').addClass('btn-primary')
            .text('Làm lại bài kiểm tra')
            .css({
                'margin': '2rem auto',
                'display': 'block'
            })
            .click(function() {
                currentPage = 1;
                loadQuizData();
                $resultContainer.hide();
                $('#quiz-content').show();
            });

        $resultContainer.append($retryButton);
        
        // Cuộn đến kết quả
        $('html, body').animate({
            scrollTop: $resultContainer.offset().top
        }, 500);
    }
});