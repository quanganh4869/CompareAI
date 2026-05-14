# Deploy 0d cho CompareAI (Frontend da xong, tiep tuc Backend + Database)

Kien truc hien tai:
- Frontend: Cloudflare Workers static assets
- Backend: Render Web Service (Docker)
- Database: Supabase Postgres
- Storage: Cloudflare R2

## 1) Supabase database

1. Tao 1 project Supabase moi.
2. Lay thong tin ket noi Postgres:
- host
- port (5432)
- database name
- user
- password
3. Dung SSL mode:
- `POSTGRES_SSL_MODE=require`
- `READ_ONLY_POSTGRES_SSL_MODE=require`

## 2) Render backend (Docker)

Render service canh bao cold start tren free tier la binh thuong.

### Thong so service
- Service type: Web Service
- Runtime: Docker
- Root directory: `backend/python-training/chat-backend`
- Port: `8000`
- Health check: `/health`

### Environment variables toi thieu

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
POSTGRES_SSL_MODE=require
DB_ECHO=false
DB_INIT=false

READ_ONLY_POSTGRES_SERVER=<supabase-host>
READ_ONLY_POSTGRES_USER=<supabase-user>
READ_ONLY_POSTGRES_PASSWORD=<supabase-password>
READ_ONLY_POSTGRES_DB=<supabase-db>
READ_ONLY_POSTGRES_PORT=5432
READ_ONLY_POSTGRES_SSL_MODE=require

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

JWT_PRIVATE_KEY_PEM=<pem-private-key>
JWT_PUBLIC_KEY_PEM=<pem-public-key>
JWT_CURRENT_KID=key_env
```

Ghi chu:
- `JWT_PUBLIC_KEY_PEM` co the de trong neu da co private key.
- Entry point da tu chay migration: `alembic upgrade head`.

## 3) Frontend cap nhat lai API URL

Sau khi Render cap backend domain:
1. Vao Cloudflare build settings.
2. Cap nhat env:
- `VITE_API_BASE_URL=https://<backend-domain>`
3. Redeploy frontend.

## 4) Google OAuth

Cap nhat tren Google Cloud Console:
- Authorized JavaScript origin:
  - `https://<frontend-domain>`
- Authorized redirect URI:
  - `https://<backend-domain>/v1_0/auth/login/google/callback`

## 5) Smoke test

1. `GET https://<backend-domain>/health` -> `OK`
2. Login Google thanh cong.
3. `GET /v1_0/user/me` sau login thanh cong.
4. Upload CV/JD, list documents thanh cong.
5. `POST /v1_0/document/match-score` thanh cong o demo mode.
