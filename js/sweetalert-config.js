// sweetalert-config.js - Cấu hình SweetAlert
class SwalAlert {
    static async showLoading(title = 'Đang tải dữ liệu...') {
        return Swal.fire({
            title: title,
            text: 'Vui lòng chờ trong giây lát',
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }

    static success(title, text, timer = 2000) {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'success',
            timer: timer,
            showConfirmButton: false
        });
    }

    static error(title, html) {
        return Swal.fire({
            title: title,
            html: html,
            icon: 'error',
            confirmButtonText: 'Thử lại',
            confirmButtonColor: '#667eea'
        });
    }

    static async confirmDelete(title = 'Xoá dữ liệu?', text = 'Hành động này không thể hoàn tác.') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xoá',
            cancelButtonText: 'Huỷ',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6'
        });
    }
    static async confirmUnanswered(unansweredCount) {
        return Swal.fire({
            title: 'Chưa hoàn thành!',
            html: `Ê nhok còn <strong>${unansweredCount}</strong> câu hỏi chưa trả lời.<br> Có muốn nộp bài không đó?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vẫn nộp bài',
            cancelButtonText: 'Tiếp tục làm',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d'
        });
    }

    static async showResults(results) {
        const percentage = results.percentage;
        let title, icon, html;

        if (percentage >= 80) {
            title = 'Xuất sắc! 🎉';
            icon = 'success';
            html = this.createResultsHTML(results, '#28a745');
        } else if (percentage >= 60) {
            title = 'Khá tốt! 👍';
            icon = 'info';
            html = this.createResultsHTML(results, '#17a2b8');
        } else {
            title = 'Cần cố gắng thêm! 💪';
            icon = 'warning';
            html = this.createResultsHTML(results, '#ffc107');
        }

        return Swal.fire({
            title: title,
            html: html,
            icon: icon,
            showCancelButton: true,
            confirmButtonText: 'Xem chi tiết',
            cancelButtonText: 'Làm lại',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d'
        });
    }

    static createResultsHTML(results, color) {
        return `
            <div style="text-align: center;">
                <h3 style="color: ${color};">Điểm số: ${results.totalScore}/${results.maxScore}</h3>
                <p>Tỷ lệ đúng: <strong>${results.percentage.toFixed(1)}%</strong></p>
                <p>Số câu đúng: <strong>${results.correctAnswers}/${results.totalQuestions}</strong></p>
                <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <small>Thời gian: ${new Date().toLocaleDateString('vi-VN')}</small>
                </div>
            </div>
        `;
    }
}