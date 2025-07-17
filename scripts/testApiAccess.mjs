#!/usr/bin/env node

/**
 * 이슈 트래커 API 테스트 스크립트
 * 사용법: node testApiAccess.mjs <URL> <이슈키> [사용자ID] [비밀번호]
 * 예시: node testApiAccess.mjs http://localhost:3000 TEST-1 apadmin 0000
 */

import fetch from 'node-fetch';

// 쿠키를 저장할 변수
let sessionCookie = '';

/**
 * 로그인 함수
 */
async function login(baseUrl, userid = 'apadmin', password = '0000') {
  console.log(`🔐 로그인 시도: ${userid}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid,
        password
      }),
      credentials: 'include'
    });

    // 쿠키 저장
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      sessionCookie = cookies.split(';')[0];
      console.log(`✅ 세션 쿠키 저장됨: ${sessionCookie}`);
    }

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 로그인 성공:', result.message);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ 로그인 실패:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 로그인 요청 실패:', error.message);
    return false;
  }
}

/**
 * 현재 사용자 정보 조회
 */
async function getCurrentUser(baseUrl) {
  console.log('👤 현재 사용자 정보 조회');
  
  try {
    const response = await fetch(`${baseUrl}/api/current-user`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      },
      credentials: 'include'
    });

    if (response.ok) {
      const user = await response.json();
      console.log('✅ 현재 사용자:', {
        userid: user.userid,
        username: user.username,
        isAdmin: user.isAdmin
      });
      return user;
    } else {
      console.error('❌ 사용자 정보 조회 실패:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ 사용자 정보 요청 실패:', error.message);
    return null;
  }
}

/**
 * 이슈 정보 조회
 */
async function getIssueByKey(baseUrl, issueKey) {
  console.log(`📋 이슈 조회: ${issueKey}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/issues?key=${encodeURIComponent(issueKey)}`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      },
      credentials: 'include'
    });

    if (response.ok) {
      const issues = await response.json();
      if (issues.length > 0) {
        const issue = issues[0];
        console.log('✅ 이슈 조회 성공:');
        console.log(`   - 이슈키: ${issue.issueKey}`);
        console.log(`   - 제목: ${issue.title}`);
        console.log(`   - 상태: ${issue.status}`);
        console.log(`   - 유형: ${issue.type}`);
        console.log(`   - 우선순위: ${issue.priority}`);
        console.log(`   - 등록자: ${issue.reporter}`);
        console.log(`   - 담당자: ${issue.assignee || '미지정'}`);
        console.log(`   - 생성일: ${new Date(issue.createdAt).toLocaleString()}`);
        console.log(`   - 수정일: ${new Date(issue.updatedAt).toLocaleString()}`);
        return issue;
      } else {
        console.error(`❌ 이슈를 찾을 수 없습니다: ${issueKey}`);
        return null;
      }
    } else {
      const error = await response.json();
      console.error('❌ 이슈 조회 실패:', error.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 이슈 조회 요청 실패:', error.message);
    return null;
  }
}

/**
 * 프로젝트 목록 조회
 */
async function getProjects(baseUrl) {
  console.log('📁 프로젝트 목록 조회');
  
  try {
    const response = await fetch(`${baseUrl}/api/projects`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      },
      credentials: 'include'
    });

    if (response.ok) {
      const projects = await response.json();
      console.log(`✅ 프로젝트 ${projects.length}개 조회됨:`);
      projects.forEach(project => {
        console.log(`   - ${project.key}: ${project.name}`);
      });
      return projects;
    } else {
      console.error('❌ 프로젝트 목록 조회 실패:', response.status);
      return [];
    }
  } catch (error) {
    console.error('❌ 프로젝트 목록 요청 실패:', error.message);
    return [];
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('사용법: node testApiAccess.mjs <URL> <이슈키> [사용자ID] [비밀번호]');
    console.error('예시: node testApiAccess.mjs http://localhost:3000 TEST-1 apadmin 0000');
    process.exit(1);
  }

  const [baseUrl, issueKey, userid = 'apadmin', password = '0000'] = args;
  
  console.log('🚀 이슈 트래커 API 테스트 시작');
  console.log(`   - URL: ${baseUrl}`);
  console.log(`   - 이슈키: ${issueKey}`);
  console.log(`   - 사용자: ${userid}`);
  console.log('');

  // 1. 로그인
  const loginSuccess = await login(baseUrl, userid, password);
  if (!loginSuccess) {
    console.error('❌ 로그인에 실패하여 테스트를 중단합니다.');
    process.exit(1);
  }
  console.log('');

  // 2. 현재 사용자 정보 확인
  const user = await getCurrentUser(baseUrl);
  if (!user) {
    console.error('❌ 사용자 정보 조회에 실패했습니다.');
  }
  console.log('');

  // 3. 프로젝트 목록 조회
  const projects = await getProjects(baseUrl);
  console.log('');

  // 4. 이슈 정보 조회
  const issue = await getIssueByKey(baseUrl, issueKey);
  console.log('');

  if (issue) {
    console.log('🎉 테스트 완료! 모든 API 호출이 성공했습니다.');
  } else {
    console.log('⚠️ 테스트 완료! 이슈 조회는 실패했지만 API 연결은 정상입니다.');
  }
}

// 스크립트 실행
main().catch(error => {
  console.error('💥 예상치 못한 오류:', error.message);
  process.exit(1);
});