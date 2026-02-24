# 🐳 Docker Deployment Guide

คู่มือการ Deploy ด้วย Docker

---

## 📁 ไฟล์ Docker

| ไฟล์ | รายละเอียด |
|------|-----------|
| `Dockerfile` | Build Next.js app |
| `docker-compose.yml` | App + PostgreSQL (Local) |
| `docker-compose.prod.yml` | App only (External DB) |
| `.dockerignore` | ไฟล์ที่ไม่ต้อง copy |

---

## 🚀 วิธีใช้งาน

### 1. Local Development (มี PostgreSQL ในตัว)

```bash
# Build และ run ทั้ง App + PostgreSQL
docker-compose up -d

# ดู logs
docker-compose logs -f

# หยุด
docker-compose down

# ลบข้อมูลทั้งหมด (ระวัง!)
docker-compose down -v
```

**เข้าใช้งาน:**
- App: http://localhost:1881
- PostgreSQL: localhost:5432

---

### 2. Production (ใช้ PostgreSQL ของ senxgroup.com)

```bash
# Build image
docker-compose -f docker-compose.prod.yml build

# Run
docker-compose -f docker-compose.prod.yml up -d

# หรือใช้ docker run โดยตรง
docker run -d \
  -p 3000:3000 \
  -e DATABASE_HOST=172.18.0.2 \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USERNAME=complaint \
  -e DATABASE_PASSWORD='5wRV%C%9' \
  -e DATABASE_NAME=complaint_qr_db \
  -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
  --name questionair-app \
  questionair-app:latest
```

---

## 🔧 คำสั่งที่ใช้บ่อย

```bash
# Build image
docker build -t questionair-app .

# Run container
docker run -p 1881:1881 questionair-app

# เข้าไปใน container
docker exec -it questionair-app sh

# ดู logs
docker logs -f questionair-app

# หยุดและลบ
docker stop questionair-app
docker rm questionair-app

# ลบ image
docker rmi questionair-app
```

---

## 🌐 Environment Variables

| ตัวแปร | ค่าเริ่มต้น | รายละเอียด |
|--------|-----------|-----------|
| `DATABASE_HOST` | 172.18.0.2 | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `DATABASE_USERNAME` | complaint | Username |
| `DATABASE_PASSWORD` | 5wRV%C%9 | Password |
| `DATABASE_NAME` | complaint_qr_db | Database name |
| `NEXT_PUBLIC_APP_URL` | http://localhost:1881 | URL ของแอป |

---

## 🐳 Docker Hub (ถ้าต้องการ push)

```bash
# Login
docker login

# Tag image
docker tag questionair-app yourusername/questionair-app:latest

# Push
docker push yourusername/questionair-app:latest

# Pull ที่เครื่องอื่น
docker pull yourusername/questionair-app:latest
```

---

## ⚠️ Troubleshooting

### ปัญหา: Port 1881 ถูกใช้แล้ว
```bash
# หา process ที่ใช้ port 3000
lsof -i :3000

# หรือเปลี่ยน port ใน docker-compose.yml
ports:
  - "3001:1881"  # ใช้ port 3001 แทน
```

### ปัญหา: ไม่สามารถเชื่อมต่อ PostgreSQL
```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
psql -h 172.18.0.2 -U complaint -d complaint_qr_db

# หรือใน Docker
docker exec -it questionair-postgres psql -U complaint -d complaint_qr_db
```

### ปัญหา: Build ช้า
```bash
# ใช้ BuildKit
DOCKER_BUILDKIT=1 docker build -t questionair-app .
```
