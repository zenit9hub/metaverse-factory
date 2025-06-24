class ConveyorBelt {
    constructor(position, type = 'straight') {
        this.position = position || new THREE.Vector3(0, 0, 0);
        this.type = type; // 'straight', 'l-shape', 'circular'
        this.speed = 0.5;
        this.isRunning = true;
        
        // 컨베이어 벨트 그룹
        this.beltGroup = new THREE.Group();
        this.beltGroup.position.copy(this.position);
        
        // 벨트 관련 속성
        this.beltMaterial = null;
        this.beltTextureOffset = 0;
        this.rollers = [];
        this.movingBoxes = [];
        
        // 애니메이션 관련
        this.textureSpeed = 0.01;
        this.rollerRotationSpeed = 0.1;
        
        console.log(`🚚 컨베이어 벨트 생성: ${this.type} 타입`);
    }
    
    async create() {
        console.log(`🔧 ${this.type} 컨베이어 벨트 생성 중...`);
        
        switch (this.type) {
            case 'straight':
                this.createStraightBelt();
                break;
            case 'l-shape':
                this.createLShapeBelt();
                break;
            case 'circular':
                this.createCircularBelt();
                break;
            default:
                this.createStraightBelt();
        }
        
        // 이동하는 박스들 생성
        this.createMovingBoxes();
        
        console.log(`✅ ${this.type} 컨베이어 벨트 생성 완료`);
    }
    
    createStraightBelt() {
        const beltLength = 8;
        const beltWidth = 1;
        const beltHeight = 0.1;
        
        // 벨트 프레임
        this.createBeltFrame(beltLength, beltWidth, beltHeight);
        
        // 벨트 표면
        this.createBeltSurface(beltLength, beltWidth, 0);
        
        // 롤러들
        this.createRollers([
            new THREE.Vector3(-beltLength/2, 0, 0),
            new THREE.Vector3(beltLength/2, 0, 0)
        ]);
    }
    
    createLShapeBelt() {
        const segment1Length = 6;
        const segment2Length = 4;
        const beltWidth = 1;
        const beltHeight = 0.1;
        
        // 첫 번째 세그먼트 (수평)
        const segment1Frame = this.createBeltFrame(segment1Length, beltWidth, beltHeight);
        segment1Frame.position.set(-segment1Length/2, 0, 0);
        this.beltGroup.add(segment1Frame);
        
        this.createBeltSurface(segment1Length, beltWidth, 0, new THREE.Vector3(-segment1Length/2, 0, 0));
        
        // 두 번째 세그먼트 (수직)
        const segment2Frame = this.createBeltFrame(segment2Length, beltWidth, beltHeight);
        segment2Frame.position.set(segment1Length/2, 0, segment2Length/2);
        segment2Frame.rotation.y = Math.PI / 2;
        this.beltGroup.add(segment2Frame);
        
        this.createBeltSurface(segment2Length, beltWidth, Math.PI / 2, 
            new THREE.Vector3(segment1Length/2, 0, segment2Length/2));
        
        // 코너 연결부
        this.createCornerConnection(new THREE.Vector3(segment1Length/2, 0, 0));
        
        // 롤러들
        this.createRollers([
            new THREE.Vector3(-segment1Length, 0, 0),
            new THREE.Vector3(segment1Length/2, 0, 0),
            new THREE.Vector3(segment1Length/2, 0, segment2Length)
        ]);
    }
    
    createCircularBelt() {
        const radius = 2;
        const beltWidth = 1;
        const segments = 16;
        
        // 원형 벨트 프레임
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const segmentFrame = this.createBeltFrame(1, beltWidth, 0.1, true);
            segmentFrame.position.set(x, 0, z);
            segmentFrame.rotation.y = angle + Math.PI / 2;
            this.beltGroup.add(segmentFrame);
        }
        
        // 원형 벨트 표면
        const circleGeometry = new THREE.RingGeometry(radius - beltWidth/2, radius + beltWidth/2, segments);
        this.beltMaterial = this.createBeltMaterial();
        const circleBelt = new THREE.Mesh(circleGeometry, this.beltMaterial);
        circleBelt.rotation.x = -Math.PI / 2;
        circleBelt.position.y = 0.05;
        this.beltGroup.add(circleBelt);
        
        // 원형 벨트용 롤러들
        const rollerPositions = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            rollerPositions.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        this.createRollers(rollerPositions);
    }
    
    createBeltFrame(length, width, height, isSmall = false) {
        const frameGroup = new THREE.Group();
        
        // 프레임 재질
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        // 좌측 프레임
        const leftFrameGeometry = new THREE.BoxGeometry(isSmall ? 0.8 : length, 0.05, 0.1);
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        leftFrame.position.set(0, -height/2, -width/2 - 0.05);
        leftFrame.castShadow = true;
        frameGroup.add(leftFrame);
        
        // 우측 프레임
        const rightFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        rightFrame.position.set(0, -height/2, width/2 + 0.05);
        rightFrame.castShadow = true;
        frameGroup.add(rightFrame);
        
        if (!isSmall) {
            this.beltGroup.add(frameGroup);
        }
        
        return frameGroup;
    }
    
    createBeltSurface(length, width, rotation = 0, position = new THREE.Vector3(0, 0, 0)) {
        const beltGeometry = new THREE.PlaneGeometry(length, width);
        this.beltMaterial = this.createBeltMaterial();
        
        const belt = new THREE.Mesh(beltGeometry, this.beltMaterial);
        belt.rotation.x = -Math.PI / 2;
        belt.rotation.z = rotation;
        belt.position.copy(position);
        belt.position.y += 0.05;
        belt.receiveShadow = true;
        this.beltGroup.add(belt);
    }
    
    createBeltMaterial() {
        // 벨트 텍스처 생성 (검은색 벨트 + 패턴)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // 기본 검은색 배경
        context.fillStyle = '#222222';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 벨트 패턴 (점선)
        context.fillStyle = '#444444';
        for (let i = 0; i < canvas.width; i += 20) {
            context.fillRect(i, canvas.height/2 - 2, 10, 4);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        
        return new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
    }
    
    createCornerConnection(position) {
        // L자 벨트의 코너 연결부
        const cornerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const cornerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
        corner.position.copy(position);
        corner.rotation.z = Math.PI / 2;
        corner.castShadow = true;
        this.beltGroup.add(corner);
    }
    
    createRollers(positions) {
        const rollerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12);
        const rollerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        positions.forEach(pos => {
            const roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
            roller.position.copy(pos);
            roller.rotation.z = Math.PI / 2;
            roller.castShadow = true;
            roller.receiveShadow = true;
            this.rollers.push(roller);
            this.beltGroup.add(roller);
        });
    }
    
    createMovingBoxes() {
        const boxCount = this.type === 'circular' ? 4 : 3;
        
        for (let i = 0; i < boxCount; i++) {
            const box = this.createBox();
            this.movingBoxes.push({
                mesh: box,
                progress: i / boxCount, // 0~1 사이의 진행률
                speed: 0.002 + Math.random() * 0.001
            });
            this.beltGroup.add(box);
        }
    }
    
    createBox() {
        const boxSize = 0.3 + Math.random() * 0.2;
        const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        
        // 랜덤 색상
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const boxMaterial = new THREE.MeshLambertMaterial({ color: randomColor });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        box.receiveShadow = true;
        
        return box;
    }
    
    update() {
        if (!this.isRunning) return;
        
        // 벨트 텍스처 애니메이션
        if (this.beltMaterial && this.beltMaterial.map) {
            this.beltTextureOffset += this.textureSpeed * this.speed;
            this.beltMaterial.map.offset.x = this.beltTextureOffset;
        }
        
        // 롤러 회전
        this.rollers.forEach(roller => {
            roller.rotation.x += this.rollerRotationSpeed * this.speed;
        });
        
        // 움직이는 박스들 업데이트
        this.updateMovingBoxes();
    }
    
    updateMovingBoxes() {
        this.movingBoxes.forEach(boxData => {
            boxData.progress += boxData.speed * this.speed;
            
            // 진행률이 1을 넘으면 리셋
            if (boxData.progress >= 1) {
                boxData.progress = 0;
            }
            
            // 벨트 타입에 따른 위치 계산
            const position = this.calculateBoxPosition(boxData.progress);
            boxData.mesh.position.copy(position);
            boxData.mesh.position.y += 0.2; // 벨트 위에 올리기
        });
    }
    
    calculateBoxPosition(progress) {
        switch (this.type) {
            case 'straight':
                return new THREE.Vector3(
                    -4 + (progress * 8), // -4에서 +4까지
                    0,
                    0
                );
                
            case 'l-shape':
                if (progress < 0.6) {
                    // 첫 번째 세그먼트 (수평)
                    const segmentProgress = progress / 0.6;
                    return new THREE.Vector3(
                        -6 + (segmentProgress * 9), // -6에서 +3까지
                        0,
                        0
                    );
                } else {
                    // 두 번째 세그먼트 (수직)
                    const segmentProgress = (progress - 0.6) / 0.4;
                    return new THREE.Vector3(
                        3,
                        0,
                        segmentProgress * 4 // 0에서 +4까지
                    );
                }
                
            case 'circular':
                const angle = progress * Math.PI * 2;
                return new THREE.Vector3(
                    Math.cos(angle) * 2,
                    0,
                    Math.sin(angle) * 2
                );
                
            default:
                return new THREE.Vector3(0, 0, 0);
        }
    }
    
    setSpeed(speed) {
        this.speed = Math.max(0, Math.min(2, speed)); // 0~2 사이로 제한
    }
    
    setRunning(isRunning) {
        this.isRunning = isRunning;
        console.log(`🚚 컨베이어 벨트 ${isRunning ? '가동' : '정지'}`);
    }
    
    getGroup() {
        return this.beltGroup;
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            type: this.type,
            position: this.position,
            speed: this.speed,
            isRunning: this.isRunning,
            boxCount: this.movingBoxes.length,
            rollerCount: this.rollers.length
        };
    }
}