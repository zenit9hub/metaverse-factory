class HotConveyorBelt extends ConveyorBelt {
    constructor(position, type = 'l-shape') {
        super(position, type);
        
        // 고온 효과 관련 속성
        this.heatParticles = null;
        this.heatDistortion = null;
        this.hotLight = null;
        this.warningText = null;
        
        // 온도 시뮬레이션
        this.temperature = 85; // 섭씨
        this.temperatureVariation = 0;
        
        console.log('🔥 고온 컨베이어 벨트 생성');
    }
    
    async create() {
        // 부모 클래스의 기본 벨트 생성
        await super.create();
        
        // 고온 효과 추가
        this.createHotEffects();
        
        console.log('✅ 고온 컨베이어 벨트 생성 완료');
    }
    
    createBeltMaterial() {
        // 고온용 빨간색 벨트 재질
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // 어두운 빨간색 배경
        context.fillStyle = '#8B0000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 열기 패턴 (더 밝은 빨간색 라인들)
        context.fillStyle = '#CC0000';
        for (let i = 0; i < canvas.width; i += 20) {
            context.fillRect(i, canvas.height/2 - 3, 12, 6);
        }
        
        // 열기 글로우 효과
        context.fillStyle = '#FF4444';
        for (let i = 0; i < canvas.width; i += 40) {
            context.fillRect(i + 5, canvas.height/2 - 1, 4, 2);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        
        return new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9,
            emissive: new THREE.Color(0x330000), // 자체 발광
            emissiveIntensity: 0.3
        });
    }
    
    createHotEffects() {
        // 1. 열기 파티클 시스템
        this.createHeatParticles();
        
        // 2. 고온 조명
        this.createHotLighting();
        
        // 3. 경고 텍스트
        this.createWarningText();
        
        // 4. Heat Haze 효과 (간단한 버전)
        this.createHeatDistortion();
    }
    
    createHeatParticles() {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        
        // 파티클 초기화
        for (let i = 0; i < particleCount; i++) {
            this.resetParticle(i, positions, velocities, lifetimes);
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            vertexColors: false
        });
        
        this.heatParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.heatParticles.userData = { velocities, lifetimes };
        this.beltGroup.add(this.heatParticles);
    }
    
    resetParticle(index, positions, velocities, lifetimes) {
        const i3 = index * 3;
        
        // 벨트 위의 랜덤 위치에서 시작
        if (this.type === 'l-shape') {
            if (Math.random() < 0.6) {
                // 첫 번째 세그먼트
                positions[i3] = -6 + Math.random() * 9;
                positions[i3 + 1] = 0.1;
                positions[i3 + 2] = -0.5 + Math.random() * 1;
            } else {
                // 두 번째 세그먼트
                positions[i3] = 2.5 + Math.random() * 1;
                positions[i3 + 1] = 0.1;
                positions[i3 + 2] = Math.random() * 4;
            }
        } else {
            positions[i3] = -4 + Math.random() * 8;
            positions[i3 + 1] = 0.1;
            positions[i3 + 2] = -0.5 + Math.random() * 1;
        }
        
        // 상승 속도
        velocities[i3] = (Math.random() - 0.5) * 0.005;
        velocities[i3 + 1] = 0.01 + Math.random() * 0.02;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
        
        // 생존 시간
        lifetimes[index] = Math.random() * 100 + 50;
    }
    
    createHotLighting() {
        // 빨간색 포인트 라이트들을 벨트 주변에 배치
        const lightPositions = this.type === 'l-shape' ? [
            new THREE.Vector3(-3, 1, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(3, 1, 2)
        ] : [
            new THREE.Vector3(-2, 1, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(2, 1, 0)
        ];
        
        lightPositions.forEach(pos => {
            const light = new THREE.PointLight(0xff3300, 0.8, 5);
            light.position.copy(pos);
            this.beltGroup.add(light);
        });
        
        // 메인 고온 조명
        this.hotLight = new THREE.PointLight(0xff4400, 1.2, 8);
        this.hotLight.position.set(0, 2, 0);
        this.beltGroup.add(this.hotLight);
    }
    
    createWarningText() {
        // 경고 텍스트 생성
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 배경 (반투명 빨간색)
        context.fillStyle = 'rgba(139, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 테두리
        context.strokeStyle = '#ffff00';
        context.lineWidth = 4;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // 경고 텍스트
        context.fillStyle = '#ffff00';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.fillText('⚠️ HIGH TEMP ⚠️', canvas.width/2, 50);
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.fillText(`${this.temperature}°C`, canvas.width/2, 90);
        
        const warningTexture = new THREE.CanvasTexture(canvas);
        const warningMaterial = new THREE.MeshLambertMaterial({ 
            map: warningTexture,
            transparent: true,
            opacity: 0.9
        });
        
        const warningGeometry = new THREE.PlaneGeometry(4, 1);
        this.warningText = new THREE.Mesh(warningGeometry, warningMaterial);
        this.warningText.position.set(0, 1.5, 0);
        this.beltGroup.add(this.warningText);
    }
    
    createHeatDistortion() {
        // 간단한 Heat Haze 효과 (반투명 플레인들)
        const distortionPlanes = [];
        
        for (let i = 0; i < 5; i++) {
            const planeGeometry = new THREE.PlaneGeometry(2, 0.5);
            const planeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending
            });
            
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.set(
                -4 + Math.random() * 8,
                0.3 + i * 0.2,
                -0.5 + Math.random() * 1
            );
            plane.rotation.x = -Math.PI / 2;
            
            distortionPlanes.push(plane);
            this.beltGroup.add(plane);
        }
        
        this.heatDistortion = distortionPlanes;
    }
    
    update() {
        // 부모 클래스의 업데이트 호출
        super.update();
        
        // 고온 효과 업데이트
        this.updateHotEffects();
    }
    
    updateHotEffects() {
        // 온도 시뮬레이션 (약간의 변동)
        this.temperatureVariation += 0.05;
        const currentTemp = this.temperature + Math.sin(this.temperatureVariation) * 3;
        
        // 열기 파티클 업데이트
        if (this.heatParticles) {
            this.updateHeatParticles();
        }
        
        // 조명 강도 변화 (온도에 따라)
        if (this.hotLight) {
            this.hotLight.intensity = 1.0 + (Math.sin(this.temperatureVariation * 2) * 0.3);
        }
        
        // 경고 텍스트 깜빡임
        if (this.warningText) {
            this.warningText.material.opacity = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        }
        
        // Heat Distortion 애니메이션
        if (this.heatDistortion) {
            this.heatDistortion.forEach((plane, index) => {
                plane.position.y += Math.sin(Date.now() * 0.005 + index) * 0.001;
                plane.material.opacity = 0.05 + Math.sin(Date.now() * 0.003 + index) * 0.05;
            });
        }
    }
    
    updateHeatParticles() {
        const positions = this.heatParticles.geometry.attributes.position.array;
        const velocities = this.heatParticles.userData.velocities;
        const lifetimes = this.heatParticles.userData.lifetimes;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 위치 업데이트
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // 생존 시간 감소
            lifetimes[i]--;
            
            // 파티클이 수명을 다했거나 너무 높이 올라갔으면 리셋
            if (lifetimes[i] <= 0 || positions[i3 + 1] > 3) {
                this.resetParticle(i, positions, velocities, lifetimes);
            }
        }
        
        this.heatParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // 온도 조회
    getTemperature() {
        return this.temperature + Math.sin(this.temperatureVariation) * 3;
    }
    
    // heat effects 활성화/비활성화 제어
    setHeatEffectsActive(active) {
        console.log(`🔥 Room B heat effects ${active ? '활성화' : '비활성화'}`);
        
        // 열기 파티클 표시/숨김
        if (this.heatParticles) {
            this.heatParticles.visible = active;
        }
        
        // 고온 조명 표시/숨김
        if (this.hotLight) {
            this.hotLight.visible = active;
        }
        
        // 경고 텍스트 표시/숨김
        if (this.warningText) {
            this.warningText.visible = active;
        }
        
        // Heat Distortion 효과 표시/숨김
        if (this.heatDistortion) {
            this.heatDistortion.forEach(plane => {
                plane.visible = active;
            });
        }
        
        // 벨트 그룹 내의 모든 포인트 라이트들 제어
        this.beltGroup.children.forEach(child => {
            if (child instanceof THREE.PointLight && child !== this.hotLight) {
                child.visible = active;
            }
        });
    }
    
    // 디버그 정보 확장
    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        return {
            ...baseInfo,
            isHotBelt: true,
            temperature: this.getTemperature(),
            heatParticleCount: this.heatParticles ? this.heatParticles.geometry.attributes.position.count : 0,
            heatDistortionPlanes: this.heatDistortion ? this.heatDistortion.length : 0
        };
    }
}