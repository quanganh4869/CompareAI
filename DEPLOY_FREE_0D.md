# Deploy 0đ (Demo ổn định) cho CompareAI

Tài liệu này mô tả quy trình deploy theo kiến trúc:
- Frontend: Cloudflare Pages (Free)
- Backend: Koyeb Web Service (Free)
- Database: Supabase Postgres (Free)
- Storage: Cloudflare R2
- Auth: Google OAuth

## 1) Chuẩn bị bảo mật

1. Rotate toàn bộ secret cũ đã từng có trong `.env`.
2. Không commit secret vào git.
3. Chỉ dùng `.env.example` làm template.

## 2) Cấu hình backend env (production)

Thiết lập các biến sau trên Koyeb:

```env
ENVIRONMENT=production
PROJECT_NAME=Chat Backend Service

BACKEND_CORS_ORIGINS=["https://<frontend-domain>"]
BACKEND_CORS_METHODS=["GET","POST","PUT","OPTIONS","PATCH","DELETE"]

POSTGRES_SERVER=<supabase-host>
POSTGRES_USER=<supabase-user>
POSTGRES_PASSWORD=<supabase-password>
POSTGRES_DB=<supabase-db>
POSTGRES_PORT=5432
DB_ECHO=false
DB_INIT=false

READ_ONLY_POSTGRES_SERVER=<supabase-host>
READ_ONLY_POSTGRES_USER=<supabase-user>
READ_ONLY_POSTGRES_PASSWORD=<supabase-password>
READ_ONLY_POSTGRES_DB=<supabase-db>
READ_ONLY_POSTGRES_PORT=5432

SECRET_ROTATION_KEY_MAPPING={"v1":"0123456789abcdef0123456789abcdef"}
SECRET_CURRENT_VERSION=v1

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=https://<backend-domain>/v1_0/auth/login/google/callback
FRONTEND_URL=https://<frontend-domain>

STORAGE_STRATEGY=r2
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET_NAME=<r2-bucket-name>
R2_ENDPOINT_URL=<r2-endpoint-url>
R2_REGION=auto
DOCUMENT_CV_PREFIX=cv
DOCUMENT_JD_PREFIX=jd

CV_OCR_ENABLED=false
MATCH_USE_EMBEDDING=false

JWT_PRIVATE_KEY_PEM=<pem-private-key-multiline>
JWT_PUBLIC_KEY_PEM=<pem-public-key-multiline>
JWT_CURRENT_KID=key_env
```

Lưu ý:
- `JWT_PUBLIC_KEY_PEM` có thể bỏ trống nếu đã có `JWT_PRIVATE_KEY_PEM` (hệ thống tự derive public key).
- `BACKEND_CORS_ORIGINS` phải chứa domain frontend thực tế.

## 3) Deploy backend lên Koyeb

1. Tạo Web Service từ Git repository.
2. Root directory: `backend/python-training/chat-backend`.
3. Runtime dùng Dockerfile hiện tại.
4. HTTP Port: `8000`.
5. Health check path: `/health`.

Container startup đã tự:
- Chờ Postgres sẵn sàng.
- Chạy migration: `alembic upgrade head`.
- Khởi động API bằng `uvicorn`.

## 4) Deploy frontend lên Cloudflare Pages

1. Framework preset: Vite.
2. Build command: `npm run build`.
3. Build output: `dist`.
4. Root directory: `frontend`.
5. Thêm env:

```env
VITE_API_BASE_URL=https://<backend-domain>
```

## 5) Cấu hình Google OAuth

Trong Google Cloud Console:
- Authorized redirect URI:
  - `https://<backend-domain>/v1_0/auth/login/google/callback`
- Authorized JavaScript origins:
  - `https://<frontend-domain>`

URI phải khớp tuyệt đối protocol + domain + path.

## 6) Smoke test sau deploy

1. `GET https://<backend-domain>/health` trả `status=OK`.
2. Truy cập frontend và đăng nhập Google thành công.
3. Gọi `/v1_0/user/me` thành công sau login.
4. Upload CV/JD và list document thành công.
5. Gọi `/v1_0/document/match-score` chạy không tải model nặng (demo mode).

## 7) Giới hạn demo mode

- `CV_OCR_ENABLED=false`: không OCR ảnh scan.
- `MATCH_USE_EMBEDDING=false`: dùng lexical fallback, giảm tải CPU/RAM.
- Phù hợp demo ổn định free tier, không tối ưu độ chính xác AI.
