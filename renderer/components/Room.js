class Room {
    constructor(id, type, options = {}) {
        this.id = id;
        this.type = type; // 'assembly', 'packaging', 'inspection'
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.size = options.size || { width: 10, height: 4, depth: 8 };
        this.wallColor = options.wallColor || 0xffffff;
        this.conveyorType = options.conveyorType || 'straight';
        this.isHotRoom = options.isHotRoom || false;
        
        // 룸 그룹
        this.roomGroup = new THREE.Group();
        this.roomGroup.position.copy(this.position);
        
        // 컴포넌트들
        this.walls = [];
        this.floor = null;
        this.ceiling = null;
        this.airConditioner = null;
        this.conveyorBelt = null;
        
        // 상태
        this.airconStatus = false;
    }
    
    async create(scene) {
        console.log(`🏗️ Room ${this.id} (${this.type}) 생성 시작...`);
        
        // 기본 구조 생성
        this.createWalls();
        this.createFloor();
        this.createCeiling();
        
        // 에어컨 생성
        await this.createAirConditioner();
        
        // 컨베이어 벨트 생성
        await this.createConveyorBelt();
        
        // 방 이름 표시
        this.createRoomLabel();
        
        // 씬에 추가
        scene.add(this.roomGroup);
        
        console.log(`✅ Room ${this.id} 생성 완료`);
    }
    
    createWalls() {
        const { width, height, depth } = this.size;
        const wallThickness = 0.2;
        
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: this.wallColor,
            transparent: true,
            opacity: 0.9
        });
        
        // 왼쪽 벽
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-width/2, height/2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.walls.push(leftWall);
        this.roomGroup.add(leftWall);
        
        // 오른쪽 벽
        const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        rightWall.position.set(width/2, height/2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.walls.push(rightWall);
        this.roomGroup.add(rightWall);
        
        // 앞벽 (일부만 - 입구 공간)
        const frontWallGeometry = new THREE.BoxGeometry(width * 0.3, height, wallThickness);
        const frontWallLeft = new THREE.Mesh(frontWallGeometry, wallMaterial);
        frontWallLeft.position.set(-width * 0.35, height/2, depth/2);
        frontWallLeft.castShadow = true;
        frontWallLeft.receiveShadow = true;
        this.walls.push(frontWallLeft);
        this.roomGroup.add(frontWallLeft);
        
        const frontWallRight = new THREE.Mesh(frontWallGeometry, wallMaterial);
        frontWallRight.position.set(width * 0.35, height/2, depth/2);
        frontWallRight.castShadow = true;
        frontWallRight.receiveShadow = true;
        this.walls.push(frontWallRight);
        this.roomGroup.add(frontWallRight);
        
        // 뒷벽
        const backWallGeometry = new THREE.BoxGeometry(width, height, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, height/2, -depth/2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.walls.push(backWall);
        this.roomGroup.add(backWall);
    }
    
    createFloor() {
        const { width, depth } = this.size;
        
        // 바닥 재질 설정 (방 타입별로 다르게)
        let floorColor = 0xf0f0f0;
        switch (this.type) {
            case 'assembly':
                floorColor = 0xe8e8e8; // 밝은 회색
                break;
            case 'packaging':
                floorColor = this.isHotRoom ? 0xffeeee : 0xeeffee; // 핫룸이면 약간 빨간색
                break;
            case 'inspection':
                floorColor = 0xeeeeff; // 약간 파란색
                break;
        }
        
        const floorGeometry = new THREE.PlaneGeometry(width - 0.4, depth - 0.4);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: floorColor,
            transparent: true,
            opacity: 0.8
        });
        
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.y = 0.01; // 바닥보다 살짝 위
        this.floor.receiveShadow = true;
        this.roomGroup.add(this.floor);
    }
    
    createCeiling() {
        const { width, height, depth } = this.size;
        
        const ceilingGeometry = new THREE.PlaneGeometry(width - 0.4, depth - 0.4);
        const ceilingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xfafafa,
            transparent: true,
            opacity: 0.3
        });
        
        this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        this.ceiling.rotation.x = Math.PI / 2;
        this.ceiling.position.y = height - 0.01;
        this.ceiling.receiveShadow = true;
        this.roomGroup.add(this.ceiling);
    }
    
    async createAirConditioner() {
        // 에어컨 위치 결정 (방별로 다른 벽면)
        let acPosition;
        let acRotation = 0;
        
        const { width, height, depth } = this.size;
        
        switch (this.id) {
            case 'A':
                acPosition = new THREE.Vector3(0, height - 0.5, -depth/2 + 0.2); // 뒷벽
                break;
            case 'B':
                acPosition = new THREE.Vector3(-width/2 + 0.2, height - 0.5, 0); // 왼쪽 벽
                acRotation = Math.PI / 2;
                break;
            case 'C':
                acPosition = new THREE.Vector3(width/2 - 0.2, height - 0.5, 0); // 오른쪽 벽
                acRotation = -Math.PI / 2;
                break;
        }
        
        this.airConditioner = new AirConditioner(acPosition, acRotation);
        await this.airConditioner.create();
        this.roomGroup.add(this.airConditioner.getGroup());
    }
    
    async createConveyorBelt() {
        const beltPosition = new THREE.Vector3(0, 0.15, 0); // 바닥에서 약간 위
        
        if (this.isHotRoom) {
            // 고온 컨베이어 벨트 (Room B)
            this.conveyorBelt = new HotConveyorBelt(beltPosition, this.conveyorType);
        } else {
            // 일반 컨베이어 벨트
            this.conveyorBelt = new ConveyorBelt(beltPosition, this.conveyorType);
        }
        
        await this.conveyorBelt.create();
        this.roomGroup.add(this.conveyorBelt.getGroup());
    }
    
    createRoomLabel() {
        // 방 이름 라벨 생성
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 배경
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 텍스트
        context.fillStyle = '#00ff88';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.fillText(`ROOM ${this.id}`, canvas.width/2, 50);
        
        // 타입 텍스트
        const typeText = this.type.charAt(0).toUpperCase() + this.type.slice(1);
        context.fillStyle = '#ffffff';
        context.font = '20px Arial';
        context.fillText(typeText, canvas.width/2, 80);
        
        const labelTexture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshLambertMaterial({ 
            map: labelTexture,
            transparent: true
        });
        
        const labelGeometry = new THREE.PlaneGeometry(3, 1.5);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, this.size.height - 0.5, this.size.depth/2 - 0.1);
        this.roomGroup.add(label);
    }
    
    // 업데이트 메소드
    update() {
        if (this.airConditioner) {
            this.airConditioner.update();
        }
        
        if (this.conveyorBelt) {
            this.conveyorBelt.update();
        }
    }
    
    // 에어컨 제어
    setAirconStatus(isOn) {
        this.airconStatus = isOn;
        if (this.airConditioner) {
            this.airConditioner.setPowerStatus(isOn);
        }
    }
    
    getAirconStatus() {
        return this.airconStatus;
    }
    
    // 컨베이어 벨트 제어
    setConveyorSpeed(speed) {
        if (this.conveyorBelt) {
            this.conveyorBelt.setSpeed(speed);
        }
    }
    
    setConveyorRunning(isRunning) {
        if (this.conveyorBelt) {
            this.conveyorBelt.setRunning(isRunning);
        }
    }
    
    // 카메라 포지션 (방 중심으로부터의 상대 위치)
    getCameraPosition() {
        return new THREE.Vector3(
            this.position.x,
            this.position.y + 8,
            this.position.z + 12
        );
    }
    
    // 룸 그룹 반환
    getGroup() {
        return this.roomGroup;
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            size: this.size,
            isHotRoom: this.isHotRoom,
            airconStatus: this.airconStatus,
            conveyorType: this.conveyorType
        };
    }
}