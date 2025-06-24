class HeatEffects {
    constructor() {
        this.heatSources = [];
        this.globalHeatLevel = 0;
        
        console.log('🔥 Heat Effects 시스템 초기화');
    }
    
    // 열원 추가 (컨베이어 벨트, 기계 등)
    addHeatSource(position, intensity = 1.0, radius = 5.0) {
        const heatSource = {
            id: Math.random().toString(36).substr(2, 9),
            position: position.clone(),
            intensity: intensity,
            radius: radius,
            particles: null,
            lights: [],
            active: true
        };
        
        this.createHeatSourceEffects(heatSource);
        this.heatSources.push(heatSource);
        
        console.log(`🔥 열원 추가: ${heatSource.id} (강도: ${intensity})`);
        return heatSource.id;
    }
    
    // 열원별 효과 생성
    createHeatSourceEffects(heatSource) {
        // 1. 상승 열기 파티클
        heatSource.particles = this.createRisingHeatParticles(heatSource.position, heatSource.intensity);
        
        // 2. 열 조명
        heatSource.lights = this.createHeatLights(heatSource.position, heatSource.intensity, heatSource.radius);
        
        // 3. 바닥 열기 효과
        heatSource.groundEffect = this.createGroundHeatEffect(heatSource.position, heatSource.radius);
    }
    
    createRisingHeatParticles(position, intensity) {
        const particleCount = Math.floor(100 * intensity);
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const lifetimes = new Float32Array(particleCount);
        
        // 파티클 초기화
        for (let i = 0; i < particleCount; i++) {
            this.resetHeatParticle(i, positions, velocities, sizes, lifetimes, position, intensity);
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // 열기 파티클 셰이더 머티리얼
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.4,
            color: 0xff6600,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData = { 
            velocities, 
            sizes, 
            lifetimes, 
            sourcePosition: position,
            intensity: intensity
        };
        
        return particles;
    }
    
    resetHeatParticle(index, positions, velocities, sizes, lifetimes, sourcePos, intensity) {
        const i3 = index * 3;
        const spread = 0.5 * intensity;
        
        // 열원 주변에서 시작
        positions[i3] = sourcePos.x + (Math.random() - 0.5) * spread;
        positions[i3 + 1] = sourcePos.y + 0.1;
        positions[i3 + 2] = sourcePos.z + (Math.random() - 0.5) * spread;
        
        // 상승 속도 (약간의 랜덤성)
        velocities[i3] = (Math.random() - 0.5) * 0.01;
        velocities[i3 + 1] = 0.015 + Math.random() * 0.02 * intensity;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
        
        // 크기와 생존 시간
        sizes[index] = 0.05 + Math.random() * 0.1;
        lifetimes[index] = 60 + Math.random() * 40;
    }
    
    createHeatLights(position, intensity, radius) {
        const lights = [];
        
        // 메인 열 조명 (빨간색-주황색)
        const mainLight = new THREE.PointLight(0xff4400, intensity * 0.8, radius);
        mainLight.position.copy(position);
        mainLight.position.y += 0.5;
        lights.push(mainLight);
        
        // 보조 조명들 (더 따뜻한 색)
        const subLightCount = Math.floor(3 * intensity);
        for (let i = 0; i < subLightCount; i++) {
            const angle = (i / subLightCount) * Math.PI * 2;
            const lightRadius = radius * 0.3;
            
            const subLight = new THREE.PointLight(0xff6600, intensity * 0.4, radius * 0.6);
            subLight.position.set(
                position.x + Math.cos(angle) * lightRadius,
                position.y + 0.3,
                position.z + Math.sin(angle) * lightRadius
            );
            lights.push(subLight);
        }
        
        return lights;
    }
    
    createGroundHeatEffect(position, radius) {
        // 바닥 열기 효과 (원형 글로우)
        const glowGeometry = new THREE.RingGeometry(0, radius, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const groundGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        groundGlow.rotation.x = -Math.PI / 2;
        groundGlow.position.copy(position);
        groundGlow.position.y = 0.01;
        
        return groundGlow;
    }
    
    // Heat Haze 셰이더 (고급 효과)
    createHeatHazeShader() {
        return {
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Simplex noise function (간단한 버전)
                float noise(vec3 p) {
                    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                }
                
                void main() {
                    vec2 distortedUv = vUv;
                    
                    // Heat distortion effect
                    float noise1 = noise(vec3(vPosition.x * 4.0, vPosition.y * 2.0 + time * 2.0, time));
                    float noise2 = noise(vec3(vPosition.x * 8.0 + time, vPosition.y * 4.0, time * 1.5));
                    
                    distortedUv.x += noise1 * intensity * 0.02;
                    distortedUv.y += noise2 * intensity * 0.01;
                    
                    // Heat color
                    vec3 heatColor = vec3(1.0, 0.4, 0.1);
                    float alpha = (noise1 + noise2) * 0.1 * intensity;
                    
                    gl_FragColor = vec4(heatColor, alpha);
                }
            `
        };
    }
    
    // Heat Haze 메쉬 생성 (커스텀 셰이더 사용)
    createHeatHazeMesh(position, size = 2.0, intensity = 1.0) {
        const shader = this.createHeatHazeShader();
        
        const hazeMaterial = new THREE.ShaderMaterial({
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            uniforms: {
                time: { value: 0 },
                intensity: { value: intensity }
            },
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const hazeGeometry = new THREE.PlaneGeometry(size, size * 0.8);
        const hazeMesh = new THREE.Mesh(hazeGeometry, hazeMaterial);
        hazeMesh.position.copy(position);
        hazeMesh.rotation.x = -Math.PI / 2;
        
        return hazeMesh;
    }
    
    // 모든 열원 업데이트
    update() {
        const currentTime = Date.now() * 0.001;
        
        this.heatSources.forEach(heatSource => {
            if (!heatSource.active) return;
            
            // 파티클 업데이트
            if (heatSource.particles) {
                this.updateHeatParticles(heatSource.particles);
            }
            
            // 조명 강도 변화 (깜빡임 효과)
            heatSource.lights.forEach((light, index) => {
                const flicker = 1.0 + Math.sin(currentTime * 4 + index) * 0.1;
                light.intensity = heatSource.intensity * 0.8 * flicker;
                
                // 색상도 약간 변화
                const colorVariation = Math.sin(currentTime * 2 + index) * 0.1;
                light.color.setRGB(
                    1.0,
                    0.25 + colorVariation,
                    0.0
                );
            });
            
            // 바닥 글로우 효과
            if (heatSource.groundEffect) {
                heatSource.groundEffect.material.opacity = 0.1 + Math.sin(currentTime * 2) * 0.05;
                
                // 크기도 살짝 변화
                const scale = 1.0 + Math.sin(currentTime * 1.5) * 0.1;
                heatSource.groundEffect.scale.set(scale, 1, scale);
            }
            
            // Heat Haze 셰이더 time 유니폼 업데이트
            if (heatSource.hazeMesh) {
                heatSource.hazeMesh.material.uniforms.time.value = currentTime;
            }
        });
    }
    
    updateHeatParticles(particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;
        const sizes = particleSystem.geometry.attributes.size ? particleSystem.geometry.attributes.size.array : null;
        const velocities = particleSystem.userData.velocities;
        const lifetimes = particleSystem.userData.lifetimes;
        const sourcePos = particleSystem.userData.sourcePosition;
        const intensity = particleSystem.userData.intensity;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 위치 업데이트
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // 바람에 의한 흔들림 (더 자연스럽게)
            const time = Date.now() * 0.001;
            positions[i3] += Math.sin(time * 2 + i * 0.1) * 0.002;
            positions[i3 + 2] += Math.cos(time * 1.8 + i * 0.15) * 0.002;
            
            // 열 상승으로 인한 가속 (위로 올라갈수록 빨라짐)
            velocities[i3 + 1] += 0.0001;
            
            // 크기 변화 (위로 올라가면서 커지다가 사라짐)
            if (sizes) {
                const age = (100 - lifetimes[i]) / 100;
                const sizeMultiplier = Math.sin(age * Math.PI); // 0에서 시작해서 중간에 최대, 끝에서 0
                sizes[i] = (0.05 + age * 0.1) * sizeMultiplier;
            }
            
            // 생존 시간 감소
            lifetimes[i]--;
            
            // 파티클 리셋 조건
            if (lifetimes[i] <= 0 || positions[i3 + 1] > sourcePos.y + 4) {
                this.resetHeatParticle(i, positions, velocities, sizes, lifetimes, sourcePos, intensity);
            }
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
        if (sizes) {
            particleSystem.geometry.attributes.size.needsUpdate = true;
        }
    }
    
    // 온도 기반 파티클 색상 계산
    getHeatColor(temperature) {
        // 온도에 따른 색상 변화 (20°C ~ 100°C)
        const normalizedTemp = Math.max(0, Math.min(1, (temperature - 20) / 80));
        
        if (normalizedTemp < 0.5) {
            // 20°C ~ 60°C: 노란색에서 주황색
            return new THREE.Color().setHSL(0.15 - normalizedTemp * 0.1, 1, 0.5);
        } else {
            // 60°C ~ 100°C: 주황색에서 빨간색
            return new THREE.Color().setHSL(0.05 - (normalizedTemp - 0.5) * 0.05, 1, 0.5);
        }
    }
    
    // 열원 강도 동적 조절
    updateHeatSourceIntensity(id, newIntensity) {
        const heatSource = this.heatSources.find(source => source.id === id);
        if (heatSource) {
            heatSource.intensity = newIntensity;
            
            // 조명 강도 업데이트
            heatSource.lights.forEach(light => {
                light.intensity = newIntensity * 0.8;
            });
            
            // 파티클 시스템 업데이트
            if (heatSource.particles) {
                heatSource.particles.userData.intensity = newIntensity;
            }
        }
    }
    
    // 열원 제거
    removeHeatSource(id) {
        const index = this.heatSources.findIndex(source => source.id === id);
        if (index !== -1) {
            const heatSource = this.heatSources[index];
            
            // 리소스 정리
            if (heatSource.particles) {
                heatSource.particles.geometry.dispose();
                heatSource.particles.material.dispose();
            }
            
            heatSource.lights.forEach(light => {
                if (light.dispose) light.dispose();
            });
            
            if (heatSource.groundEffect) {
                heatSource.groundEffect.geometry.dispose();
                heatSource.groundEffect.material.dispose();
            }
            
            if (heatSource.hazeMesh) {
                heatSource.hazeMesh.geometry.dispose();
                heatSource.hazeMesh.material.dispose();
            }
            
            this.heatSources.splice(index, 1);
            console.log(`🔥 열원 제거: ${id}`);
        }
    }
    
    // 열원 활성화/비활성화
    setHeatSourceActive(id, active) {
        const heatSource = this.heatSources.find(source => source.id === id);
        if (heatSource) {
            heatSource.active = active;
            
            // 모든 효과 표시/숨김
            heatSource.lights.forEach(light => {
                light.visible = active;
            });
            
            if (heatSource.particles) {
                heatSource.particles.visible = active;
            }
            
            if (heatSource.groundEffect) {
                heatSource.groundEffect.visible = active;
            }
            
            if (heatSource.hazeMesh) {
                heatSource.hazeMesh.visible = active;
            }
            
            console.log(`🔥 열원 ${id} ${active ? '활성화' : '비활성화'}`);
        }
    }
    
    // 특정 위치의 온도 계산 (개선된 버전)
    getTemperatureAtPosition(position) {
        let temperature = 20; // 기본 온도 (섭씨)
        
        this.heatSources.forEach(heatSource => {
            if (!heatSource.active) return;
            
            const distance = position.distanceTo(heatSource.position);
            if (distance < heatSource.radius) {
                // 거리 기반 온도 기여도 계산 (제곱 역비례)
                const distanceFactor = 1 - (distance / heatSource.radius);
                const heatContribution = heatSource.intensity * 50 * (distanceFactor * distanceFactor);
                temperature += heatContribution;
            }
        });
        
        return Math.min(temperature, 150); // 최대 온도 제한
    }
    
    // 전역 열기 레벨 계산
    calculateGlobalHeatLevel() {
        let totalHeat = 0;
        let activeSourceCount = 0;
        
        this.heatSources.forEach(source => {
            if (source.active) {
                totalHeat += source.intensity;
                activeSourceCount++;
            }
        });
        
        this.globalHeatLevel = activeSourceCount > 0 ? totalHeat / activeSourceCount : 0;
        return this.globalHeatLevel;
    }
    
    // 씬에 모든 열원 효과 추가
    addToScene(scene) {
        this.heatSources.forEach(heatSource => {
            if (heatSource.particles) {
                scene.add(heatSource.particles);
            }
            
            heatSource.lights.forEach(light => {
                scene.add(light);
            });
            
            if (heatSource.groundEffect) {
                scene.add(heatSource.groundEffect);
            }
            
            if (heatSource.hazeMesh) {
                scene.add(heatSource.hazeMesh);
            }
        });
    }
    
    // 씬에서 모든 열원 효과 제거
    removeFromScene(scene) {
        this.heatSources.forEach(heatSource => {
            if (heatSource.particles) {
                scene.remove(heatSource.particles);
            }
            
            heatSource.lights.forEach(light => {
                scene.remove(light);
            });
            
            if (heatSource.groundEffect) {
                scene.remove(heatSource.groundEffect);
            }
            
            if (heatSource.hazeMesh) {
                scene.remove(heatSource.hazeMesh);
            }
        });
    }
    
    // 성능 최적화 - LOD (Level of Detail)
    updateLOD(cameraPosition) {
        this.heatSources.forEach(heatSource => {
            const distance = cameraPosition.distanceTo(heatSource.position);
            
            // 거리에 따른 품질 조절
            if (distance > 30) {
                // 멀리 있으면 파티클 비활성화
                if (heatSource.particles) {
                    heatSource.particles.visible = false;
                }
            } else if (distance > 15) {
                // 중간 거리에서는 파티클 개수 줄이기
                if (heatSource.particles) {
                    heatSource.particles.visible = true;
                    heatSource.particles.material.size = 0.05; // 작게
                }
            } else {
                // 가까이 있으면 모든 효과 활성화
                if (heatSource.particles) {
                    heatSource.particles.visible = true;
                    heatSource.particles.material.size = 0.1; // 크게
                }
            }
        });
    }
    
    // 디버그 정보 (확장된 버전)
    getDebugInfo() {
        return {
            heatSourceCount: this.heatSources.length,
            activeHeatSources: this.heatSources.filter(source => source.active).length,
            globalHeatLevel: this.calculateGlobalHeatLevel(),
            totalParticles: this.heatSources.reduce((total, source) => {
                return total + (source.particles ? source.particles.geometry.attributes.position.count : 0);
            }, 0),
            totalLights: this.heatSources.reduce((total, source) => {
                return total + source.lights.length;
            }, 0),
            averageTemperature: this.getTemperatureAtPosition(new THREE.Vector3(0, 0, 0))
        };
    }
    
    // 정리 (확장된 버전)
    dispose() {
        console.log('🔥 Heat Effects 시스템 정리 시작...');
        
        this.heatSources.forEach(heatSource => {
            this.removeHeatSource(heatSource.id);
        });
        
        this.heatSources = [];
        this.globalHeatLevel = 0;
        
        console.log('✅ Heat Effects 시스템 정리 완료');
    }
    
    // 정적 유틸리티 메소드들
    static createSimpleHeatEffect(scene, position, intensity = 1.0) {
        const heatEffects = new HeatEffects();
        const heatId = heatEffects.addHeatSource(position, intensity);
        heatEffects.addToScene(scene);
        
        return { heatEffects, heatId };
    }
    
    static temperatureToColor(celsius) {
        // 온도를 색상으로 변환 (20°C = 파란색, 100°C = 빨간색)
        const normalizedTemp = Math.max(0, Math.min(1, (celsius - 20) / 80));
        return new THREE.Color().setHSL((1 - normalizedTemp) * 0.6, 1, 0.5);
    }
}