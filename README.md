# 🏭 Metaverse Factory - Digital Twin

Electron + Three.js 기반의 3D 스마트 팩토리 디지털 트윈 애플리케이션입니다.

## ✨ 주요 기능

- **3개의 독립된 방**: 조립실(A), 포장실(B), 검사실(C)
- **MQTT 연동 에어컨 제어**: 실시간 원격 제어
- **다양한 컨베이어 벨트**: 직선형, L자형, 원형
- **고온 시각화 효과**: Room B의 열기 파티클 및 경고 시스템
- **실시간 모니터링**: 상태 표시 및 성능 지표

## 🛠️ 기술 스택

- **Frontend**: Three.js, HTML5, CSS3, JavaScript
- **Desktop App**: Electron
- **Communication**: MQTT
- **3D Graphics**: WebGL, Custom Shaders

## 📋 시스템 요구사항

- **Node.js**: 16.0.0 이상
- **npm**: 7.0.0 이상
- **OS**: Windows 10/11, macOS 10.14+, Ubuntu 18.04+
- **Memory**: 최소 4GB RAM
- **Graphics**: WebGL 지원 그래픽 카드

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/metaverse-factory.git
cd metaverse-factory
```

### 2. 의존성 설치
```bash
npm install
```

### 3. MQTT 브로커 설정

#### EMQX 공개 브로커 사용 (권장)

이 프로젝트는 EMQX의 공개 MQTT 브로커를 사용합니다:
- **브로커 주소**: `broker.emqx.io`
- **포트**: `8084` (WebSocket)
- **프로토콜**: `wss://` (보안 WebSocket)
- **인증**: 없음 (익명 접속)

#### 로컬 MQTT 브로커 설치 (선택사항)

로컬 개발을 위해 Mosquitto 브로커를 설치할 수도 있습니다:

**Windows:**
```bash
# Chocolatey 사용
choco install mosquitto

# 또는 공식 사이트에서 다운로드
# https://mosquitto.org/download/
```

**macOS:**
```bash
brew install mosquitto
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
```

#### 로컬 MQTT 브로커 실행
```bash
# 기본 설정으로 실행
mosquitto -v

# 또는 WebSocket 지원으로 실행 (포트 9001)
mosquitto -c mosquitto.conf
```

#### Mosquitto 설정 파일 (mosquitto.conf)
```conf
# 기본 MQTT 포트
port 1883

# WebSocket 포트 (웹 브라우저용)
listener 9001
protocol websockets

# 익명 접속 허용 (개발용)
allow_anonymous true
```

**참고**: 로컬 브로커를 사용하려면 `renderer/components/MQTTClient.js` 파일에서 `brokerUrl`을 `'ws://localhost:9001'`로 변경하세요.

### 4. 애플리케이션 실행

#### 개발 모드
```bash
npm run dev
```

#### 일반 실행
```bash
npm start
```

#### 빌드 (배포용)
```bash
npm run build
```

## 🎮 사용법

### 기본 조작
- **마우스 드래그**: 카메라 회전
- **마우스 휠**: 줌 인/아웃
- **키보드 단축키**:
  - `1`: Room A 포커스
  - `2`: Room B 포커스
  - `3`: Room C 포커스
  - `0`: 전체 뷰
  - `Space`: 컨베이어 벨트 정지/재시작

### MQTT 제어

#### 에어컨 제어 메시지
```bash
# Room A 에어컨 켜기
mosquitto_pub -h broker.emqx.io -t "kiot/zenit/room-a/aircon/control" -m '{"power":"on"}'

# Room B 에어컨 끄기
mosquitto_pub -h broker.emqx.io -t "kiot/zenit/room-b/aircon/control" -m '{"power":false}'

# Room C 에어컨 켜기
mosquitto_pub -h broker.emqx.io -t "kiot/zenit/room-c/aircon/control" -m '{"power":true}'
```

#### 지원되는 메시지 형식
```json
{
  "power": "on" | "off" | true | false,
  "timestamp": "2024-12-24T10:30:00Z"
}
```

### UI 패널 활용
- **상단 정보 패널**: 각 방의 에어컨 상태 및 MQTT 연결 상태
- **하단 제어 패널**: 수동 제어 버튼 및 컨베이어 속도 조절

## 🔧 개발 및 커스터마이징

### 프로젝트 구조
```
metaverse-factory/
├── main.js                 # Electron 메인 프로세스
├── renderer/
│   ├── index.html          # 메인 HTML
│   ├── app.js             # Three.js 메인 로직
│   ├── components/        # 3D 컴포넌트들
│   │   ├── Factory.js     # 공장 전체 구조
│   │   ├── Room.js        # 개별 방 클래스
│   │   ├── ConveyorBelt.js # 일반 컨베이어 벨트
│   │   ├── HotConveyorBelt.js # 고온 컨베이어 벨트
│   │   ├── AirConditioner.js # 에어컨
│   │   ├── MQTTClient.js  # MQTT 연동
│   │   └── HeatEffects.js # 열기 효과 시스템
│   └── assets/            # 리소스 파일
└── package.json
```

### 새로운 방 추가
1. `Factory.js`에서 새 Room 인스턴스 생성
2. `Room.js`에서 방 타입별 설정 추가
3. MQTT 토픽 설정 업데이트

### 새로운 MQTT 토픽 추가
1. `MQTTClient.js`의 `subscribeTopics` 배열에 토픽 추가
2. `handleMQTTMessage()` 함수에서 메시지 처리 로직 구현

## 🐛 문제 해결

### 일반적인 문제들

#### MQTT 연결 실패
```bash
# EMQX 브로커 연결 테스트
ping broker.emqx.io

# WebSocket 포트 확인 (8084)
telnet broker.emqx.io 8084

# 또는 curl로 테스트
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" https://broker.emqx.io:8084/mqtt
```

**일반적인 해결 방법:**
1. 인터넷 연결 확인
2. 방화벽에서 8084 포트 허용
3. 회사 네트워크에서 외부 MQTT 브로커 차단 여부 확인

#### 3D 렌더링 문제
- **WebGL 지원 확인**: `chrome://gpu/` 또는 `about:support` 접속
- **그래픽 드라이버 업데이트** 권장
- **하드웨어 가속 활성화** 확인

#### 성능 최적화
```javascript
// app.js에서 렌더링 품질 조절
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

// 파티클 수 조절
const particleCount = Math.floor(100 * intensity * 0.5); // 50% 감소
```

### 로그 확인
- **Electron 개발자 도구**: `Ctrl+Shift+I` (Windows/Linux) 또는 `Cmd+Option+I` (macOS)
- **콘솔 로그**: MQTT 연결 상태 및 에러 메시지 확인

## 📚 API 참고

### MQTTClient 클래스
```javascript
const mqttClient = new MQTTClient();
await mqttClient.connect();

// 메시지 발송
mqttClient.publish('kiot/zenit/room-a/aircon/control', '{"power":true}');

// 연결 상태 확인
if (mqttClient.isConnected()) {
    // 연결됨
}
```

### Factory 클래스
```javascript
const factory = new Factory(scene);
await factory.create();

// 에어컨 제어
factory.setAirconStatus('A', true);

// 컨베이어 속도 조절
factory.setConveyorSpeed(1.5);
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/metaverse-factory/issues)
- **문의**: your-email@example.com

## 🔄 업데이트 로그

### v1.0.0 (2024-12-24)
- ✨ 초기 릴리스
- 🏗️ 3개 방 구조 구현
- 🌡️ Room B 고온 효과 시스템
- 📡 MQTT 에어컨 제어 연동
- 🚚 다양한 컨베이어 벨트 타입

---

**Happy Coding!** 🚀