# Tài Liệu Mô Tả Dự Án: AI Interview Assistant (Trợ Lý Phỏng Vấn AI)

## 1. Tổng Quan Dự Án
**AI Interview Assistant** là nền tảng thực hành phỏng vấn thông qua trí tuệ nhân tạo (AI). Ứng dụng mô phỏng các buổi phỏng vấn sát thực tế dựa trên CV và Mô tả công việc (JD) của người dùng.

### Giá trị cốt lõi:
- **Cá nhân hóa**: Câu hỏi sinh ra phù hợp với từng CV và vị trí cụ thể.
- **Phản hồi tức thì**: AI phân tích câu trả lời, chấm điểm và đưa ra nhận xét chi tiết.
- **Bảo mật cao**: Dữ liệu nhạy cảm được mã hóa (AES-GCM, RSA).

---

## 2. Kiến Trúc Hệ Thống
Dự án sử dụng mô hình Client-Server tách biệt.

### 2.1 Backend (FastAPI)
- **Framework**: FastAPI (Python 3.10+).
- **Kiến trúc**: Sử dụng Clean Architecture kết hợp Service Pattern.
- **Cơ sở dữ liệu**: PostgreSQL, SQLAlchemy (Async), Alembic (Migrations).
- **Xác thực (Auth)**:
    - **Google OAuth2** và **JWT (RS256)**.
    - Cơ chế **Key Rotation**: Quản lý nhiều khóa JWT (KID) tăng tính bảo mật.
- **Bảo mật**: `KeyManager` quản lý RSA Keys và mã hoá AES-GCM cho thông tin người dùng.

### 2.2 Frontend (React)
- **Framework**: React 19 + Vite.
- **Giao diện**: Tailwind CSS, Framer Motion (Animations), Lucide React (Icons).
- **Routing**: React Router DOM v7.
- **API**: Axios với interceptors xử lý Token.

---

## 3. Sơ Đồ Cơ Sở Dữ Liệu (ERD)
Dữ liệu được chia thành hai nhóm chính:

### 3.1 Nhóm Authenticate
- `users`: Thông tin người dùng (mã hoá email/tên).
- `auth_providers`: Google, v.v.
- `auth_identities`: Liên kết người dùng với provider.
- `oauth_tokens`: Quản lý session tokens.

### 3.2 Nhóm Nghiệp Vụ (Domain)
- `cv_documents`: Quản lý hồ sơ ứng viên.
- `jd_documents`: Quản lý mô tả công việc.
- `interview_sessions`: Các buổi phỏng vấn giả định.
- `interview_questions`: Câu hỏi từ AI.
- `interview_feedback`: Đánh giá chi tiết.

---

## 4. Các Tính Năng Chính
1.  **Đăng nhập & Xác thực**: Tích hợp Google OAuth2.
2.  **Quản lý Gói cước & Quyền**: Phân quyền User/Pro/Enterprise.
3.  **Trình mô phỏng phỏng vấn (Interview Wizard)**:
    - Quy trình: Upload CV -> Paste JD -> Chọn chế độ (Voice/Text).
    - AI sinh câu hỏi thông minh theo ngữ cảnh.
4.  **Phân tích & Phản hồi**: Chấm điểm, gợi ý cải thiện kỹ năng.
5.  **Lịch sử phỏng vấn**: Lưu trữ bản ghi (transcripts) để xem lại.
6.  **Hồ sơ người dùng**: Quản lý thông tin cá nhân và tài khoản.

---

## 5. Cấu Trúc Mã Nguồn (Backend)
```bash
app/
├── api/            # Endpoints (User, Auth, Health)
├── configuration/  # Settings, Logger, Middleware
├── core/           # Common, Enums, Exceptions, JWT
├── db/             # DB Connection, Models, Migrations
├── schemas/        # Pydantic Request/Response schemas
└── services/       # Logic nghiệp vụ (Auth, User, KeyManager)
```

---
*Tài liệu biên soạn cho Đồ án tốt nghiệp (DATN).*
