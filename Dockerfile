FROM node:20

# 1. 루트 작업 디렉토리
WORKDIR /app

# 2. 전체 프로젝트 복사 (먼저 .dockerignore를 설정하면 node_modules 등 제외 가능)
COPY . .

# 3. 프론트엔드 설치 및 빌드
WORKDIR /app/frontend-issue-tracker
RUN npm install && npm run build

# 4. 백엔드 의존성 설치 (build 이후)
WORKDIR /app
RUN npm install --omit=dev

# 5. 앱 시작
EXPOSE 3000
CMD ["node", "server.js"]
