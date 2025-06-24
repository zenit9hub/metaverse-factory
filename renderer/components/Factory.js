class Factory {
    constructor(scene) {
        this.scene = scene;
        this.rooms = {};
        this.conveyorSpeed = 0.5;
        this.isConveyorRunning = true;
        
        // 팩토리 전체 그룹
        this.factoryGroup = new THREE.Group();
        this.scene.add(this.factoryGroup);
    }
    
    async create() {
        console.log('🏗️ 팩토리 생성 시작...');
        
        // 건물 외벽 생성
        this.createBuilding();
        
        // 3개 방 생성
        await this.createRooms();
        
        console.log('✅ 팩토리 생성 완료');
    }
    
    createBuilding() {
        // 메인 건물 외벽
        const buildingWidth = 32;
        const buildingDepth = 10;
        const buildingHeight = 5;
        
        // 외벽 구조
        const wallGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, 0.5);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xcccccc,
            transparent: true,
            opacity: 0.8
        });
        
        // 앞벽
        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.position.set(0, buildingHeight/2, buildingDepth/2);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.factoryGroup.add(frontWall);
        
        // 뒷벽
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, buildingHeight/2, -buildingDepth/2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.factoryGroup.add(backWall);
        
        // 지붕
        //const roofGeometry = new THREE.BoxGeometry(buildingWidth + 1, 0.3, buildingDepth + 1);
        //const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        //const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        //roof.position.set(0, buildingHeight, 0);
        //roof.castShadow = true;
        //roof.receiveShadow = true;
        //this.factoryGroup.add(roof);
        
        // 간판
        this.createFactorySign();
    }
    
    createFactorySign() {
        // 간판 배경
        const signGeometry = new THREE.BoxGeometry(8, 1.5, 0.2);
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 4, 5.2);
        this.factoryGroup.add(sign);
        
        // 텍스트 (간단한 버전)
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#2c3e50';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#00ff88';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.fillText('METAVERSE FACTORY', canvas.width/2, canvas.height/2 + 16);
        
        const signTexture = new THREE.CanvasTexture(canvas);
        const signTextMaterial = new THREE.MeshLambertMaterial({ map: signTexture });
        const signText = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 1.5),
            signTextMaterial
        );
        signText.position.set(0, 4, 5.3);
        this.factoryGroup.add(signText);
    }
    
    async createRooms() {
        // 방 A (조립실) - 왼쪽
        this.rooms.A = new Room('A', 'assembly', {
            position: new THREE.Vector3(-10, 0, 0),
            size: { width: 10, height: 4, depth: 8 },
            wallColor: 0xE0E0E0,
            conveyorType: 'straight'
        });
        
        // 방 B (포장실) - 가운데 (고온)
        this.rooms.B = new Room('B', 'packaging', {
            position: new THREE.Vector3(0, 0, 0),
            size: { width: 10, height: 4, depth: 8 },
            wallColor: 0xE8F5E8,
            conveyorType: 'l-shape',
            isHotRoom: true
        });
        
        // 방 C (검사실) - 오른쪽
        this.rooms.C = new Room('C', 'inspection', {
            position: new THREE.Vector3(10, 0, 0),
            size: { width: 10, height: 4, depth: 8 },
            wallColor: 0xE8F0FF,
            conveyorType: 'circular'
        });
        
        // 각 방을 씬에 추가
        for (const [roomId, room] of Object.entries(this.rooms)) {
            await room.create(this.scene);
            console.log(`✅ Room ${roomId} 생성 완료`);
        }
    }
    
    update() {
        // 각 방의 업데이트 호출
        Object.values(this.rooms).forEach(room => {
            if (room.update) {
                room.update();
            }
        });
    }
    
    // 에어컨 상태 제어
    setAirconStatus(roomId, isOn) {
        const room = this.rooms[roomId];
        if (room && room.setAirconStatus) {
            room.setAirconStatus(isOn);
        }
    }
    
    getAirconStatus(roomId) {
        const room = this.rooms[roomId];
        if (room && room.getAirconStatus) {
            return room.getAirconStatus();
        }
        return false;
    }
    
    // 컨베이어 벨트 제어
    setConveyorSpeed(speed) {
        this.conveyorSpeed = speed;
        Object.values(this.rooms).forEach(room => {
            if (room.setConveyorSpeed) {
                room.setConveyorSpeed(speed);
            }
        });
    }
    
    setConveyorRunning(isRunning) {
        this.isConveyorRunning = isRunning;
        Object.values(this.rooms).forEach(room => {
            if (room.setConveyorRunning) {
                room.setConveyorRunning(isRunning);
            }
        });
    }
    
    // 방 정보 조회
    getRoom(roomId) {
        return this.rooms[roomId];
    }
    
    getAllRooms() {
        return this.rooms;
    }
    
    // 카메라 포지션 정보
    getCameraPositions() {
        return {
            A: { position: new THREE.Vector3(-10, 8, 12), lookAt: new THREE.Vector3(-10, 0, 0) },
            B: { position: new THREE.Vector3(0, 8, 12), lookAt: new THREE.Vector3(0, 0, 0) },
            C: { position: new THREE.Vector3(10, 8, 12), lookAt: new THREE.Vector3(10, 0, 0) },
            overview: { position: new THREE.Vector3(20, 15, 20), lookAt: new THREE.Vector3(0, 0, 0) }
        };
    }
    
    // 디버그 정보
    getDebugInfo() {
        const roomInfo = {};
        Object.entries(this.rooms).forEach(([id, room]) => {
            roomInfo[id] = {
                position: room.position,
                airconStatus: room.getAirconStatus ? room.getAirconStatus() : false,
                conveyorSpeed: this.conveyorSpeed,
                isRunning: this.isConveyorRunning
            };
        });
        
        return {
            totalRooms: Object.keys(this.rooms).length,
            conveyorSpeed: this.conveyorSpeed,
            isConveyorRunning: this.isConveyorRunning,
            rooms: roomInfo
        };
    }
}