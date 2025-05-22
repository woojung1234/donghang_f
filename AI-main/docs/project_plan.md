# AI 서비스 프로젝트 계획서

## 프로젝트 개요

이 프로젝트는 '똑똑' 애플리케이션의 AI 서비스 부분으로, FastAPI를 기반으로 하는 AI 마이크로서비스입니다. 챗봇과 TTS(Text-to-Speech) 기능을 제공합니다.

## 주요 기능

### 챗봇 서비스
- OpenAI GPT 모델을 활용한 대화형 AI 챗봇
- RESTful API를 통한 챗봇 응답 제공
- 한국어 자연어 처리 지원

### TTS (Text-to-Speech) 서비스
- Melo TTS - 로컬 TTS 모델 서비스
- OpenAI TTS - OpenAI의 TTS API 서비스
- 한국어 음성 합성 지원
- 실시간 오디오 스트리밍

### 웹 인터페이스
- 챗봇 테스트용 웹 UI
- TTS 옵션 선택 기능
- 실시간 음성 재생

## 현재 상태

AI 서비스가 순수하게 AI 기능만 담당하도록 구성되어 있습니다. 카드, 매칭, 보호자 관련 기능은 없으며, 오직 챗봇과 TTS 기능만 제공합니다.

## 기술 스택

### 프레임워크 & 라이브러리
- **FastAPI** - 고성능 웹 프레임워크
- **OpenAI API** - GPT 모델 및 TTS 서비스
- **Melo TTS** - 로컬 TTS 모델
- **Requests** - HTTP 클라이언트

### AI/ML 구성요소
- **GPT-4o-mini** - 챗봇 대화 모델
- **한국어 TTS 모델** - 한국어 음성 합성
- **한국어 텍스트 처리** - 형태소 분석 및 전처리

## API 엔드포인트

### 챗봇 API
```
GET /api/v1/chatbot/chatting?contents={message}
- 챗봇과의 대화 처리
- OpenAI GPT 모델 응답 반환
```

### TTS API
```
GET /api/v1/tts/melo?contents={text}
- Melo TTS를 사용한 음성 합성
- WAV 오디오 스트림 반환

GET /api/v1/tts/openai?contents={text}
- OpenAI TTS를 사용한 음성 합성  
- WAV 오디오 스트림 반환
```

### 기타 API
```
GET /chatting
- 챗봇 테스트용 웹 인터페이스
- HTML 페이지 반환
```

## 프로젝트 구조

```
AI-main/
├── app/
│   ├── api/v1/              # API 라우터
│   │   ├── chatbot_router.py # 챗봇 API
│   │   ├── tts_router.py     # TTS API
│   │   └── etc_router.py     # 기타 API
│   ├── service/             # 비즈니스 로직
│   │   ├── chat_bot_service.py # 챗봇 서비스
│   │   ├── melo_tts_service.py # Melo TTS 서비스
│   │   └── openai_tts_service.py # OpenAI TTS 서비스
│   ├── core/                # 핵심 설정
│   ├── utils/               # 유틸리티
│   ├── templates/           # HTML 템플릿
│   └── main.py             # FastAPI 앱 진입점
├── melo_my/                # Melo TTS 모델
└── docs/                   # 문서
```

## 완료된 일

- FastAPI 서버 구축
- OpenAI 챗봇 서비스 구현
- Melo TTS 및 OpenAI TTS 서비스 구현
- 웹 기반 테스트 인터페이스 구현
- 한국어 텍스트 처리 기능 구현
- Docker 컨테이너 설정
- API 문서화
- **환경변수 설정 완료** (.env 파일 추가)
- **보안 설정 강화** (API 키 환경변수 분리)

## 유지할 핵심 기능

### 순수 AI 기능만 유지
- ✅ 챗봇 대화 처리
- ✅ 음성 합성 (TTS)
- ✅ 한국어 자연어 처리
- ✅ 실시간 오디오 스트리밍
- ✅ 웹 기반 테스트 인터페이스

### 제거할 기능 없음
- AI 서비스는 순수하게 AI 기능만 담당
- 카드, 매칭, 보호자 관련 코드 없음
- 별도의 정리 작업 불필요

## 다음 단계

1. 성능 최적화
   - TTS 응답 속도 개선
   - 챗봇 응답 시간 단축

2. 기능 확장
   - 더 많은 TTS 옵션 추가
   - 챗봇 개성 및 컨텍스트 관리 개선

3. 모니터링 강화
   - 로그 시스템 개선
   - 성능 메트릭 수집

4. 보안 강화
   - API 키 관리 개선
   - 요청 제한 구현

## 결론

AI 프로젝트는 이미 깔끔하게 구성되어 있으며, 카드나 매칭 관련 불필요한 기능이 없습니다. 순수하게 AI 서비스만 담당하는 마이크로서비스 아키텍처로 잘 설계되어 있습니다.
