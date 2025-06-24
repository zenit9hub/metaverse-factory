class MQTTClient {
    constructor() {
        this.client = null;
        this.isConnectedFlag = false;
        this.onMessage = null;
        this.onConnectionChange = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3초
        
        // MQTT 브로커 설정 (EMQX 공개 브로커)
        this.brokerUrl = 'wss://broker.emqx.io:8084/mqtt'; // EMQX WebSocket 포트
        this.options = {
            clientId: 'metaverse_factory_' + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 0, // 자동 재연결 비활성화 (수동 제어)
            username: '', // 필요시 설정
            password: '', // 필요시 설정
        };
        
        // 구독할 토픽들
        this.subscribeTopics = [
            'kiot/zenit/room-a/aircon/control',
            'kiot/zenit/room-b/aircon/control', 
            'kiot/zenit/room-c/aircon/control'
        ];
    }
    
    async connect() {
        try {
            console.log('🔌 MQTT 브로커에 연결 시도:', this.brokerUrl);
            
            // MQTT.js 클라이언트 생성 (브라우저 환경)
            this.client = mqtt.connect(this.brokerUrl, this.options);
            
            // 연결 성공 이벤트
            this.client.on('connect', () => {
                console.log('✅ MQTT 브로커 연결 성공');
                this.isConnectedFlag = true;
                this.reconnectAttempts = 0;
                
                // 토픽 구독
                this.subscribeToTopics();
                
                // 연결 상태 콜백 호출
                if (this.onConnectionChange) {
                    this.onConnectionChange(true);
                }
            });
            
            // 메시지 수신 이벤트
            this.client.on('message', (topic, message) => {
                const messageStr = message.toString();
                console.log('📨 MQTT 메시지 수신:', topic, messageStr);
                
                if (this.onMessage) {
                    this.onMessage(topic, messageStr);
                }
            });
            
            // 연결 종료 이벤트
            this.client.on('close', () => {
                console.log('🔌 MQTT 연결 종료');
                this.isConnectedFlag = false;
                
                if (this.onConnectionChange) {
                    this.onConnectionChange(false);
                }
                
                // 자동 재연결 시도
                this.attemptReconnect();
            });
            
            // 에러 이벤트
            this.client.on('error', (error) => {
                console.error('❌ MQTT 에러:', error);
                this.isConnectedFlag = false;
                
                if (this.onConnectionChange) {
                    this.onConnectionChange(false, error.message);
                }
            });
            
            // 오프라인 이벤트
            this.client.on('offline', () => {
                console.log('📴 MQTT 오프라인');
                this.isConnectedFlag = false;
                
                if (this.onConnectionChange) {
                    this.onConnectionChange(false, '오프라인');
                }
            });
            
        } catch (error) {
            console.error('❌ MQTT 연결 실패:', error);
            throw error;
        }
    }
    
    subscribeToTopics() {
        this.subscribeTopics.forEach(topic => {
            this.client.subscribe(topic, { qos: 1 }, (err) => {
                if (err) {
                    console.error(`❌ 토픽 구독 실패 (${topic}):`, err);
                } else {
                    console.log(`✅ 토픽 구독 성공: ${topic}`);
                }
            });
        });
    }
    
    publish(topic, message, qos = 1) {
        if (!this.isConnectedFlag) {
            console.warn('⚠️ MQTT가 연결되지 않아 메시지를 발송할 수 없습니다.');
            return false;
        }
        
        this.client.publish(topic, message, { qos }, (err) => {
            if (err) {
                console.error('❌ 메시지 발송 실패:', err);
            } else {
                console.log('✅ 메시지 발송 성공:', topic, message);
            }
        });
        
        return true;
    }
    
    disconnect() {
        if (this.client) {
            console.log('🔌 MQTT 연결 종료 중...');
            this.client.end();
            this.client = null;
            this.isConnectedFlag = false;
        }
    }
    
    isConnected() {
        return this.isConnectedFlag;
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ 최대 재연결 시도 횟수 초과');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 MQTT 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${this.reconnectDelay/1000}초 후)`);
        
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('❌ 재연결 실패:', error);
            });
        }, this.reconnectDelay);
        
        // 재연결 지연 시간 증가 (백오프)
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    }
    
    // 개발용 테스트 메소드들
    static async testConnection(brokerUrl = 'wss://broker.emqx.io:8084/mqtt') {
        const testClient = new MQTTClient();
        testClient.brokerUrl = brokerUrl;
        
        try {
            await testClient.connect();
            console.log('✅ MQTT 연결 테스트 성공');
            
            // 테스트 메시지 발송
            setTimeout(() => {
                testClient.publish('test/connection', JSON.stringify({
                    message: 'MQTT 연결 테스트',
                    timestamp: new Date().toISOString()
                }));
                
                setTimeout(() => {
                    testClient.disconnect();
                }, 1000);
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('❌ MQTT 연결 테스트 실패:', error);
            return false;
        }
    }
    
    static generateTestMessages() {
        return [
            {
                topic: 'kiot/zenit/room-a/aircon/control',
                message: JSON.stringify({ power: 'on', timestamp: new Date().toISOString() })
            },
            {
                topic: 'kiot/zenit/room-b/aircon/control',
                message: JSON.stringify({ power: true, timestamp: new Date().toISOString() })
            },
            {
                topic: 'kiot/zenit/room-c/aircon/control',
                message: JSON.stringify({ power: 'off', timestamp: new Date().toISOString() })
            }
        ];
    }
}

// 전역에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MQTTClient;
}