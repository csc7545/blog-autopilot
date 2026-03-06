# Blog Autopilot

네이버 블로그용 AI 콘텐츠 생성 도구

## 소개

Blog Autopilot은 키워드를 입력하면 네이버 SEO 기준에 맞춘 블로그 초안을
단계별 파이프라인으로 생성하는 SaaS형 콘텐츠 자동화 프로젝트입니다.
사용자가 직접 API 키를 입력해 실행하며, 결과물은 HTML/Markdown으로 내보낼 수 있습니다.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Google Gemini API (Gemini 1.5 Pro)
- Image Generation API
- Zustand
- React Query

## Quick Start

```bash
npm install
npm run dev
```

개발 서버 실행 후 브라우저에서 앱에 접속해 키워드 기반 생성 플로우를 시작할 수 있습니다.

## 주요 기능

- 검색 의도 분석부터 내보내기까지 15단계 파이프라인 생성
- 페르소나 기반 문체 선택 및 네이버 톤 보정
- SEO 최적화 제목/목차/본문/FAQ/메타 설명 자동 생성
- 이미지 배치 계획 수립 후 커버/본문 이미지 생성
- 생성 결과에 대한 최종 검증(SEO 구조, 문단 길이, FAQ, 이미지 위치)
- HTML / Markdown 포맷 내보내기 지원
- 모든 초안을 로컬에 저장하여 서버 의존성 최소화
