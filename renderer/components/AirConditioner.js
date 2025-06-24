class AirConditioner {
    constructor(position, rotation = 0) {
        this.position = position || new THREE.Vector3(0, 3, 0);
        this.rotation = rotation;
        this.isPoweredOn = false;
        
        // 에어컨 그룹
        this.acGroup = new THREE.Group();
        this.acGroup.position.copy(this.position);
        this.acGroup.rotation.y = this.rotation;
        
        // 컴포넌트들
        this.mainBody = null;
        this.fan = null;
        this.statusLED = null;
        this.statusLight = null;
        
        // 애니메이션 관련
        this.fanRotationSpeed = 0;
        this.targetFanSpeed = 0;
        this.fanRotation = 0;
        
        // 파티클 시스템 (냉기 효과)
        this.coolAirParticles = null;
    }
    
    async create() {
        console.log('🌬️ 에어컨 생성 중...');
        
        // 메인 바디 생성
        this.createMainBody();
        
        // 팬 생성
        this.createFan();
        
        // 상태 LED 생성
        this.createStatusLED();
        
        // 냉기 파티클 시스템 생성
        this.createCoolAirParticles();
        
        console.log('✅ 에어컨 생성 완료');
    }
    
    createMainBody() {
        // 메인 바디 (직육면체)
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xf0f0f0,
            transparent: true,
            opacity: 0.9
        });
        
        this.mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mainBody.castShadow = true;
        this.mainBody.receiveShadow = true;
        this.acGroup.add(this.mainBody);
        
        // 브랜드 로고 (간단한 텍스트)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#f0f0f0';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#333333';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText('COOL-AIR', canvas.width/2, canvas.height/2 + 8);
        
        const logoTexture = new THREE.CanvasTexture(canvas);
        const logoMaterial = new THREE.MeshLambertMaterial({ 
            map: logoTexture,
            transparent: true
        });
        
        const logoGeometry = new THREE.PlaneGeometry(1.2, 0.2);
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(0, 0, 0.41);
        this.acGroup.add(logo);
        
        // 통풍구 (여러 개의 작은 구멍)
        for (let i = 0; i < 8; i++) {
            const ventGeometry = new THREE.PlaneGeometry(0.8, 0.03);
            const ventMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x333333,
                transparent: true,
                opacity: 0.8
            });
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(0, -0.08 + (i * 0.02), 0.41);
            this.acGroup.add(vent);
        }
    }
    
    createFan() {
        // 팬 하우징
        const fanHousingGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
        const fanHousingMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const fanHousing = new THREE.Mesh(fanHousingGeometry, fanHousingMaterial);
        fanHousing.rotation.x = Math.PI / 2;
        fanHousing.position.set(0.5, 0, 0.43);
        this.acGroup.add(fanHousing);
        
        // 팬 블레이드
        const fanGroup = new THREE.Group();
        
        for (let i = 0; i < 4; i++) {
            const bladeGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.01);
            const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            
            blade.position.set(0.075, 0, 0);
            blade.rotation.z = (i * Math.PI / 2);
            fanGroup.add(blade);
        }
        
        // 팬 중심축
        const axisGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8);
        const axisMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const axis = new THREE.Mesh(axisGeometry, axisMaterial);
        axis.rotation.x = Math.PI / 2;
        fanGroup.add(axis);
        
        fanGroup.position.set(0.5, 0, 0.44);
        this.fan = fanGroup;
        this.acGroup.add(this.fan);
    }
    
    createStatusLED() {
        // LED 하우징
        const ledHousingGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 8);
        const ledHousingMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const ledHousing = new THREE.Mesh(ledHousingGeometry, ledHousingMaterial);
        ledHousing.rotation.x = Math.PI / 2;
        ledHousing.position.set(-0.5, 0, 0.42);
        this.acGroup.add(ledHousing);
        
        // LED (상태에 따라 색상 변경)
        const ledGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.005, 8);
        const ledMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.8
        });
        
        this.statusLED = new THREE.Mesh(ledGeometry, ledMaterial);
        this.statusLED.rotation.x = Math.PI / 2;
        this.statusLED.position.set(-0.5, 0, 0.425);
        this.acGroup.add(this.statusLED);
        
        // 상태 표시 조명 (포인트 라이트)
        this.statusLight = new THREE.PointLight(0x666666, 0, 2);
        this.statusLight.position.set(-0.5, 0, 0.5);
        this.acGroup.add(this.statusLight);
    }
    
    createCoolAirParticles() {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        // 파티클 초기 위치 설정 (통풍구 앞)
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 0.8; // x
            positions[i3 + 1] = (Math.random() - 0.5) * 0.2; // y
            positions[i3 + 2] = 0.5 + Math.random() * 0.5; // z
            
            // 초기 속도
            velocities[i3] = (Math.random() - 0.5) * 0.01;
            velocities[i3 + 1] = -0.002 - Math.random() * 0.003;
            velocities[i3 + 2] = 0.01 + Math.random() * 0.02;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x87CEEB,
            size: 0.02,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        this.coolAirParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.coolAirParticles.userData = { velocities };
        this.acGroup.add(this.coolAirParticles);
    }
    
    update() {
        // 팬 회전
        this.fanRotationSpeed = THREE.MathUtils.lerp(
            this.fanRotationSpeed, 
            this.targetFanSpeed, 
            0.05
        );
        
        if (this.fan) {
            this.fanRotation += this.fanRotationSpeed;
            this.fan.rotation.z = this.fanRotation;
        }
        
        // 냉기 파티클 애니메이션
        if (this.coolAirParticles && this.isPoweredOn) {
            this.updateCoolAirParticles();
        }
    }
    
    updateCoolAirParticles() {
        const positions = this.coolAirParticles.geometry.attributes.position.array;
        const velocities = this.coolAirParticles.userData.velocities;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 위치 업데이트
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // 파티클이 너무 멀어지면 리셋
            if (positions[i3 + 2] > 2 || positions[i3 + 1] < -1) {
                positions[i3] = (Math.random() - 0.5) * 0.8;
                positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
                positions[i3 + 2] = 0.5;
                
                velocities[i3] = (Math.random() - 0.5) * 0.01;
                velocities[i3 + 1] = -0.002 - Math.random() * 0.003;
                velocities[i3 + 2] = 0.01 + Math.random() * 0.02;
            }
        }
        
        this.coolAirParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    setPowerStatus(isOn) {
        this.isPoweredOn = isOn;
        
        if (isOn) {
            // 켜짐 상태
            this.targetFanSpeed = 0.2;
            
            // LED 색상 변경 (파란색)
            this.statusLED.material.color.setHex(0x00ff88);
            this.statusLED.material.opacity = 1;
            
            // 조명 활성화
            this.statusLight.color.setHex(0x00ff88);
            this.statusLight.intensity = 0.5;
            
            // 냉기 파티클 활성화
            this.coolAirParticles.material.opacity = 0.3;
            
            console.log('❄️ 에어컨 가동 시작');
            
        } else {
            // 꺼짐 상태
            this.targetFanSpeed = 0;
            
            // LED 색상 변경 (회색)
            this.statusLED.material.color.setHex(0x666666);
            this.statusLED.material.opacity = 0.5;
            
            // 조명 비활성화
            this.statusLight.intensity = 0;
            
            // 냉기 파티클 비활성화
            this.coolAirParticles.material.opacity = 0;
            
            console.log('⏹️ 에어컨 정지');
        }
    }
    
    getPowerStatus() {
        return this.isPoweredOn;
    }
    
    getGroup() {
        return this.acGroup;
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            position: this.position,
            rotation: this.rotation,
            isPoweredOn: this.isPoweredOn,
            fanSpeed: this.fanRotationSpeed,
            particleCount: this.coolAirParticles ? this.coolAirParticles.geometry.attributes.position.count : 0
        };
    }
}