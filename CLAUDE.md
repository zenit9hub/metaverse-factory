# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 3D Metaverse Factory Digital Twin built with Electron and Three.js, featuring MQTT integration for real-time air conditioner control across three factory rooms.

## Core Technology Stack

- **Desktop App**: Electron 27.0.0
- **3D Graphics**: Three.js 0.158.0 with WebGL
- **Communication**: MQTT 4.3.7 with WebSocket (EMQX broker at wss://broker.emqx.io:8084/mqtt)
- **UI Controls**: dat.gui 0.7.9

## Common Development Commands

### Running the Application
```bash
npm start              # Run production build
npm run dev           # Run with DevTools enabled
npm run build         # Build for distribution using electron-builder
```

### MQTT Testing Commands
```bash
# Test MQTT connection to EMQX broker
mosquitto_pub -h broker.emqx.io -t "kiot/zenit/room-a/aircon/control" -m '{"power":"on"}'

# Room controls (A=assembly, B=packaging, C=inspection)
mosquitto_pub -h broker.emqx.io -t "kiot/zenit/room-b/aircon/control" -m '{"power":false}'
mosquitto_pub -h broker.emqx.io -t "kiot/zenit/room-c/aircon/control" -m '{"power":true}'
```

## Architecture Overview

### Main Process Structure
- `main.js`: Electron main process with IPC handlers and window management
- `renderer/`: Contains all UI and 3D rendering code

### Core 3D Components (renderer/components/)
- **Factory.js**: Main factory container managing 3 rooms and overall building structure
- **Room.js**: Individual room class handling walls, floor, ceiling, air conditioner, and conveyor belt
- **MQTTClient.js**: WebSocket MQTT client for real-time air conditioner control
- **ConveyorBelt.js**: Standard conveyor belt implementation
- **HotConveyorBelt.js**: High-temperature conveyor with particle effects for Room B
- **AirConditioner.js**: 3D air conditioning units with status indicators
- **HeatEffects.js**: Particle system for Room B heat visualization

### Application Flow
1. `renderer/app.js` initializes Three.js scene, camera, and renderer
2. Creates Factory instance which generates 3 rooms (A: Assembly, B: Packaging, C: Inspection)
3. MQTT client connects to EMQX broker and subscribes to air conditioner control topics
4. Real-time updates via MQTT messages control air conditioner states
5. Animation loop updates all 3D components and renders the scene

### Room Configuration
- **Room A (Assembly)**: Straight conveyor, standard temperature
- **Room B (Packaging)**: L-shaped conveyor, high-temperature with heat particle effects
- **Room C (Inspection)**: Circular conveyor, standard temperature

### MQTT Topic Structure
Topics follow pattern: `kiot/zenit/room-{a,b,c}/aircon/control`
Message format: `{"power": "on"|"off"|true|false, "timestamp": "ISO-8601"}`

### Key Controls
- Mouse drag: Camera rotation
- Mouse wheel: Zoom in/out  
- Keyboard shortcuts: 1/2/3 (focus rooms), 0 (overview), Space (toggle conveyor)

## Important Development Notes

### MQTT Integration
- Uses EMQX public broker (wss://broker.emqx.io:8084/mqtt) by default
- Client generates random ID: `metaverse_factory_` + random hex
- Auto-reconnection with exponential backoff (max 5 attempts)
- QoS level 1 for reliable message delivery

### Security Considerations
- Electron app uses `nodeIntegration: true` and `contextIsolation: false` (consider updating for security)
- MQTT connection uses no authentication (public broker)

### Performance Optimizations
- Shadow mapping enabled with PCFSoftShadowMap
- Pixel ratio capped at device pixel ratio
- Fog rendering for depth perception
- Particle systems optimized for Room B heat effects

### File Structure Understanding
- No test files present (`npm test` returns error)
- Korean comments and UI text throughout codebase
- Assets expected in `assets/icon.png` but not included in build files array
- Build outputs to `dist/` directory via electron-builder