// 전역 변수들
let scene, camera, renderer, controls;
let factory;
let mqttClient;
let conveyorSpeed = 0.5;
let isConveyorRunning = true;

// 성능 모니터링
let frameCount = 0;
let lastTime = performance.now();

// 초기화 함수
async function init() {
    try {
        console.log('🚀 Metaverse Factory 초기화 시작...');
        
        // Three.js 기본 설정
        await initThreeJS();
        
        // 3D 환경 생성
        await createEnvironment();
        
        // MQTT 클라이언트 초기화
        await initMQTT();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 애니메이션 시작
        animate();
        
        // 로딩 화면 숨기기
        hideLoading();
        
        console.log('✅ 초기화 완료!');
        
    } catch (error) {
        console.error('❌ 초기화 실패:', error);
        showError('초기화 중 오류가 발생했습니다: ' + error.message);
    }
}

// Three.js 초기화
async function initThreeJS() {
    console.log('🔧 Three.js 초기화...');
    
    // 씬 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 하늘색 배경
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200); // 안개 효과
    
    // 카메라 설정
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(20, 15, 20);
    camera.lookAt(0, 0, 0);
    
    // 렌더러 생성
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // DOM에 렌더러 추가
    const container = document.getElementById('threejs-container');
    container.appendChild(renderer.domElement);
    
    // 카메라 컨트롤 설정 (OrbitControls 직접 구현)
    setupCameraControls();
    
    // 기본 조명 설정
    setupLighting();
    
    console.log('✅ Three.js 초기화 완료');
}

// 카메라 컨트롤 설정 (간단한 OrbitControls 구현)
function setupCameraControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const canvas = renderer.domElement;
    
    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    canvas.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        
        // 카메라 회전
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaMove.x * 0.01;
        spherical.phi += deltaMove.y * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
        
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(zoomFactor);
        
        // 최소/최대 거리 제한
        const distance = camera.position.length();
        if (distance < 10) camera.position.normalize().multiplyScalar(10);
        if (distance > 100) camera.position.normalize().multiplyScalar(100);
    });
}

// 조명 설정
function setupLighting() {
    // 주변광
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // 주 방향광 (태양)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // 보조 조명
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(-20, 20, 20);
    scene.add(pointLight);
}

// 3D 환경 생성
async function createEnvironment() {
    console.log('🏭 3D 공장 환경 생성...');
    
    // 바닥 생성
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x808080,
        transparent: true,
        opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // 팩토리 생성
    factory = new Factory(scene);
    await factory.create();
    
    console.log('✅ 3D 환경 생성 완료');
}

// MQTT 초기화
async function initMQTT() {
    console.log('📡 MQTT 클라이언트 초기화...');
    
    try {
        mqttClient = new MQTTClient();
        await mqttClient.connect();
        
        // 에어컨 제어 메시지 수신 시 처리
        mqttClient.onMessage = (topic, message) => {
            handleMQTTMessage(topic, message);
        };
        
        // 연결 상태 업데이트
        mqttClient.onConnectionChange = (isConnected) => {
            updateMQTTStatus(isConnected);
        };
        
        console.log('✅ MQTT 초기화 완료');
        
    } catch (error) {
        console.error('❌ MQTT 초기화 실패:', error);
        updateMQTTStatus(false, error.message);
    }
}

// MQTT 메시지 처리
function handleMQTTMessage(topic, message) {
    console.log('📨 MQTT 메시지 수신:', topic, message);
    
    try {
        const data = JSON.parse(message);
        
        // 토픽에서 방 정보 추출
        const roomMatch = topic.match(/room-([abc])/);
        if (!roomMatch) {
            console.warn('⚠️ 알 수 없는 토픽 형식:', topic);
            return;
        }
        
        const roomId = roomMatch[1].toUpperCase();
        const power = data.power;
        
        // 전원 상태 정규화 (문자열/불린 모두 처리)
        let isOn = false;
        if (typeof power === 'string') {
            isOn = power.toLowerCase() === 'on';
        } else if (typeof power === 'boolean') {
            isOn = power;
        }
        
        // 에어컨 상태 업데이트
        if (factory) {
            factory.setAirconStatus(roomId, isOn);
        }
        
        // UI 상태 업데이트
        updateAirconUI(roomId, isOn);
        
    } catch (error) {
        console.error('❌ MQTT 메시지 파싱 오류:', error);
    }
}

// 에어컨 UI 상태 업데이트
function updateAirconUI(roomId, isOn) {
    const ledElement = document.getElementById(`led-room-${roomId.toLowerCase()}`);
    const statusElement = document.getElementById(`status-room-${roomId.toLowerCase()}`);
    
    if (ledElement && statusElement) {
        ledElement.className = `status-led ${isOn ? 'on' : 'off'}`;
        statusElement.textContent = isOn ? 'ON' : 'OFF';
    }
}

// MQTT 연결 상태 업데이트
function updateMQTTStatus(isConnected, errorMessage = '') {
    const statusElement = document.getElementById('mqtt-status');
    if (statusElement) {
        if (isConnected) {
            statusElement.textContent = '연결됨';
            statusElement.style.color = '#00ff88';
        } else {
            statusElement.textContent = errorMessage ? `오류: ${errorMessage}` : '연결 끊김';
            statusElement.style.color = '#ff4444';
        }
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 창 크기 변경
    window.addEventListener('resize', onWindowResize);
    
    // 키보드 입력
    document.addEventListener('keydown', onKeyDown);
    
    // 컨베이어 속도 슬라이더
    const speedSlider = document.getElementById('conveyor-speed');
    const speedValue = document.getElementById('speed-value');
    
    speedSlider.addEventListener('input', (event) => {
        conveyorSpeed = parseFloat(event.target.value);
        speedValue.textContent = conveyorSpeed.toFixed(1) + 'x';
        
        if (factory) {
            factory.setConveyorSpeed(conveyorSpeed);
        }
    });
}

// 창 크기 변경 처리
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 키보드 입력 처리
function onKeyDown(event) {
    switch (event.code) {
        case 'Digit1':
            focusRoom('A');
            break;
        case 'Digit2':
            focusRoom('B');
            break;
        case 'Digit3':
            focusRoom('C');
            break;
        case 'Digit0':
            focusOverview();
            break;
        case 'Space':
            event.preventDefault();
            toggleConveyor();
            break;
    }
}

// 특정 방에 카메라 포커스
function focusRoom(roomId) {
    if (!factory) return;
    
    const room = factory.getRoom(roomId);
    if (room) {
        const targetPosition = room.getCameraPosition();
        animateCamera(targetPosition, room.position);
    }
}

// 전체 뷰로 카메라 이동
function focusOverview() {
    const targetPosition = new THREE.Vector3(20, 15, 20);
    animateCamera(targetPosition, new THREE.Vector3(0, 0, 0));
}

// 카메라 애니메이션
function animateCamera(targetPosition, lookAtPosition) {
    const startPosition = camera.position.clone();
    const startLookAt = new THREE.Vector3(0, 0, 0);
    let progress = 0;
    
    function updateCamera() {
        progress += 0.05;
        if (progress >= 1) {
            camera.position.copy(targetPosition);
            camera.lookAt(lookAtPosition);
            return;
        }
        
        camera.position.lerpVectors(startPosition, targetPosition, progress);
        const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, lookAtPosition, progress);
        camera.lookAt(currentLookAt);
        
        requestAnimationFrame(updateCamera);
    }
    
    updateCamera();
}

// 컨베이어 벨트 토글
function toggleConveyor() {
    isConveyorRunning = !isConveyorRunning;
    if (factory) {
        factory.setConveyorRunning(isConveyorRunning);
    }
}

// 메인 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    
    // FPS 계산
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        document.getElementById('fps-counter').textContent = fps;
        frameCount = 0;
        lastTime = currentTime;
    }
    
    // 팩토리 업데이트
    if (factory) {
        factory.update();
    }
    
    // 렌더링
    renderer.render(scene, camera);
}

// 로딩 화면 숨기기
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
            loadingElement.style.display = 'none';
        }, 500);
    }
}

// 에러 표시
function showError(message) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <div style="color: #ff4444; font-size: 18px; margin-bottom: 20px;">❌ 오류 발생</div>
            <div style="color: #ccc; font-size: 14px;">${message}</div>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                다시 시도
            </button>
        `;
    }
}

// UI 제어 함수들
function toggleAircon(roomId) {
    if (!mqttClient || !mqttClient.isConnected()) {
        alert('MQTT가 연결되지 않았습니다.');
        return;
    }
    
    const room = roomId.replace('room-', '').toUpperCase();
    const currentStatus = factory ? factory.getAirconStatus(room) : false;
    const newStatus = !currentStatus;
    
    const topic = `kiot/zenit/room-${roomId.replace('room-', '')}/aircon/control`;
    const message = JSON.stringify({
        power: newStatus,
        timestamp: new Date().toISOString()
    });
    
    mqttClient.publish(topic, message);
}

function toggleAllAircons() {
    if (!mqttClient || !mqttClient.isConnected()) {
        alert('MQTT가 연결되지 않았습니다.');
        return;
    }
    
    ['a', 'b', 'c'].forEach(room => {
        const topic = `kiot/zenit/room-${room}/aircon/control`;
        const message = JSON.stringify({
            power: false,
            timestamp: new Date().toISOString()
        });
        mqttClient.publish(topic, message);
    });
}

function reconnectMQTT() {
    if (mqttClient) {
        mqttClient.disconnect();
    }
    initMQTT();
}

function testMQTT() {
    if (!mqttClient || !mqttClient.isConnected()) {
        alert('MQTT가 연결되지 않았습니다.');
        return;
    }
    
    // 테스트 메시지 발송
    const testTopic = 'kiot/zenit/room-a/aircon/control';
    const testMessage = JSON.stringify({
        power: true,
        timestamp: new Date().toISOString()
    });
    
    mqttClient.publish(testTopic, testMessage);
    
    setTimeout(() => {
        const offMessage = JSON.stringify({
            power: false,
            timestamp: new Date().toISOString()
        });
        mqttClient.publish(testTopic, offMessage);
    }, 2000);
    
    alert('테스트 메시지를 발송했습니다. (2초 후 OFF)');
}

// 페이지 로드 시 초기화
window.addEventListener('load', init);

// 페이지 종료 시 정리
window.addEventListener('beforeunload', () => {
    if (mqttClient) {
        mqttClient.disconnect();
    }
});