FROM node:20

WORKDIR /app

# 환경변수 파일 복사
COPY .env ./

# 백엔드 패키지 설치
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# 프론트엔드 전체 복사 및 빌드
COPY frontend-issue-tracker ./frontend-issue-tracker
WORKDIR /app/frontend-issue-tracker
RUN npm install && npm run build

# 다시 백엔드로 돌아와 앱 실행 준비
WORKDIR /app
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
