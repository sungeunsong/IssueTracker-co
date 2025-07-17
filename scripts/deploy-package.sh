#!/bin/bash

# 배포용 패키지 생성 스크립트
set -e

echo "배포용 패키지 생성 중..."

# 빌드 실행 (프론트엔드 + 백엔드)
echo "1. 전체 빌드..."
npm run build

# 배포용 디렉토리 생성
DEPLOY_DIR="deploy-package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/frontend-dist

echo "2. 배포 파일 복사..."
# 빌드된 파일들
cp -r dist/ $DEPLOY_DIR/
cp -r frontend-issue-tracker/dist/* $DEPLOY_DIR/frontend-dist/

# 설정 파일들
cp package.json $DEPLOY_DIR/
cp docker-compose.yml $DEPLOY_DIR/
cp Dockerfile $DEPLOY_DIR/
cp .env $DEPLOY_DIR/

# uploads 디렉토리 (빈 디렉토리라도 생성)
mkdir -p $DEPLOY_DIR/uploads

# scripts 디렉토리
cp -r scripts/ $DEPLOY_DIR/

echo "3. tar 파일 생성..."
tar -czf deploy-package.tar.gz $DEPLOY_DIR

echo "4. 정리..."
rm -rf $DEPLOY_DIR

echo "배포 패키지 생성 완료: deploy-package.tar.gz"
echo "크기: $(du -h deploy-package.tar.gz | cut -f1)"