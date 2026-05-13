/**
 * File này chứa toàn bộ dữ liệu mẫu (mock data) cho Dashboard.
 * Giúp tập trung quản lý và tránh việc lặp lại code ở nhiều nơi.
 */

export const JOB_POSTINGS = [];

export const DEMO_CV_ROWS = [];

export const HISTORY_DATA = [];

export const LEGACY_SCREEN_ALIAS = {
  profileLibrary: "profileCv",
  analyticsResults: "interviewHistory",
  aiReports: "interviewHistory",
  learningProgress: "dashboardOverview",
  jobDetail: "jobMatch",
};

export function findJobPostingById(id) {
  return JOB_POSTINGS.find((job) => job.id === id);
}

export const INTERVIEW_QUESTIONS = [
  "Hãy giới thiệu ngắn gọn về bản thân và lý do bạn ứng tuyển vị trí này.",
  "Bạn đã từng quản lý rủi ro CNTT trong môi trường tài chính như thế nào? Hãy cho một ví dụ cụ thể.",
  "Mô tả một tình huống bạn phải phối hợp với nhiều bộ phận để giải quyết sự cố bảo mật.",
  "Bạn hiểu về ISO 27001 và COBIT như thế nào? Áp dụng vào thực tế ra sao?",
  "Kể về một quyết định khó khăn bạn đã đưa ra liên quan đến rủi ro và kết quả là gì?",
  "Bạn xử lý xung đột với stakeholder như thế nào khi có sự bất đồng về ưu tiên?",
  "Làm thế nào bạn đo lường hiệu quả của các biện pháp kiểm soát rủi ro?",
  "Nếu được nhận vào vị trí này, kế hoạch 90 ngày đầu tiên của bạn là gì?",
];

export const PARSE_STAGES = [
  "Trích xuất thông tin cá nhân",
  "Phân tích kinh nghiệm làm việc",
  "Đánh giá kỹ năng và năng lực",
  "Chấm điểm tín hiệu phù hợp vị trí",
  "Tổng hợp hồ sơ và gợi ý",
];

export const READINESS_BARS = [62, 71, 68, 79, 75, 83, 82];

export const PROGRESS_LINE = [65, 72, 70, 78, 80, 84, 82, 88];
