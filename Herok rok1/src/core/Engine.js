import { Renderer } from './Renderer.js';
import { Camera } from './Camera.js';
import { Scene } from './Scene.js';
import { GaussianCloud } from '../gaussian/GaussianCloud.js';
import { GaussianSorter } from '../gaussian/Sorting.js';
import { LODManager } from '../lod/LODManager.js';
import { StreamManager } from '../streaming/StreamManager.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { EventBus } from '../utils/EventBus.js';

export class Engine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.config = {
            maxGaussians: 1000000000,
            targetFPS: 60,
            memoryLimitMB: 1024,
            fov: 65,
            near: 0.1,
            far: 1000,
            ...options
        };
        
        this.running = true;
        this.frameCount = 0;
        
        // Core components
        this.renderer = new Renderer(canvas, this.config);
        this.camera = new Camera(canvas, this.config);
        this.scene = new Scene();
        this.sorter = new GaussianSorter();
        this.lodManager = new LODManager(this.config);
        this.streamManager = new StreamManager(this.config);
        this.performance = new PerformanceMonitor(this.config.targetFPS);
        this.events = new EventBus();
        
        // Statistics
        this.stats = {
            gaussiansLoaded: 0,
            gaussiansRendered: 0,
            fps: 0,
            memoryUsageMB: 0,
            renderTimeMs: 0,
            lodLevel: 0,
            streamingProgress: 0
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.renderer.init();
            this.setupEventListeners();
            this.startRenderLoop();
            this.streamManager.start();
            
            this.events.emit('ready', {
                version: '1.0.0',
                maxGaussians: this.config.maxGaussians.toLocaleString(),
                gpu: this.renderer.getGPUInfo()
            });
            
            console.log(`[Herok Rok1] Engine ready - Capacity: ${this.config.maxGaussians.toLocaleString()} gaussians`);
        } catch (error) {
            console.error('[Herok Rok1] Initialization failed:', error);
            this.events.emit('error', error);
        }
    }
    
    setupEventListeners() {
        this.camera.onChange(() => {
            const cameraState = this.camera.getState();
            this.lodManager.updateCamera(cameraState);
        });
        
        this.streamManager.onProgress((progress) => {
            this.stats.streamingProgress = progress;
            this.events.emit('streamingProgress', progress);
        });
    }
    
    async loadGaussians(data, format) {
        this.events.emit('loadingStart', { format, size: data.byteLength });
        const startTime = performance.now();
        
        try {
            const gaussians = await this.parseGaussianData(data, format);
            const cloud = new GaussianCloud(this.config.maxGaussians);
            const added = cloud.addBatch(gaussians);
            
            console.log(`[Herok Rok1] Added ${added.toLocaleString()} gaussians to cloud`);
            
            await this.lodManager.buildOctree(cloud.getGaussians());
            this.scene.setGaussianCloud(cloud);
            
            await this.streamManager.loadChunks(cloud.getGaussians());
            
            const loadTime = performance.now() - startTime;
            this.stats.gaussiansLoaded = cloud.getCount();
            this.stats.memoryUsageMB = cloud.getMemoryUsage() / (1024 * 1024);
            
            this.events.emit('loadingComplete', {
                count: cloud.getCount(),
                timeMs: loadTime,
                memoryMB: this.stats.memoryUsageMB
            });
            
            console.log(`[Herok Rok1] Loaded ${cloud.getCount().toLocaleString()} gaussians in ${loadTime.toFixed(2)}ms`);
            
            return cloud;
        } catch (error) {
            this.events.emit('loadingError', error);
            throw error;
        }
    }
    
    async parseGaussianData(data, format) {
        const formatLower = format.toLowerCase();
        
        switch(formatLower) {
            case 'ply': return this.parsePLY(data);
            case 'splat': return this.parseSPLAT(data);
            case 'compressed': return this.parseCompressed(data);
            case 'json': return this.parseJSON(data);
            default: throw new Error(`Unsupported format: ${format}`);
        }
    }
    
    parsePLY(buffer) {
        const view = new DataView(buffer);
        const text = new TextDecoder().decode(buffer.slice(0, 16384));
        
        const vertexMatch = text.match(/element vertex (\d+)/);
        const vertexCount = vertexMatch ? parseInt(vertexMatch[1]) : 0;
        
        const headerEnd = text.indexOf('end_header');
        let dataOffset = headerEnd;
        while (dataOffset < buffer.byteLength && text[dataOffset] !== '\n') {
            dataOffset++;
        }
        dataOffset++;
        
        const gaussians = [];
        const limit = Math.min(vertexCount, this.config.maxGaussians);
        const stride = 32;
        
        for (let i = 0; i < limit; i++) {
            const offset = dataOffset + i * stride;
            if (offset + stride > buffer.byteLength) break;
            
            gaussians.push({
                x: view.getFloat32(offset, true),
                y: view.getFloat32(offset + 4, true),
                z: view.getFloat32(offset + 8, true),
                nx: view.getFloat32(offset + 12, true),
                ny: view.getFloat32(offset + 16, true),
                nz: view.getFloat32(offset + 20, true),
                r: view.getUint8(offset + 24) / 255,
                g: view.getUint8(offset + 25) / 255,
                b: view.getUint8(offset + 26) / 255,
                scale: view.getFloat32(offset + 28, true)
            });
        }
        
        return gaussians;
    }
    
    parseSPLAT(buffer) {
        const view = new DataView(buffer);
        const count = Math.min(view.getUint32(0, true), this.config.maxGaussians);
        const gaussians = [];
        
        for (let i = 0; i < count; i++) {
            const offset = 4 + i * 32;
            
            gaussians.push({
                x: view.getFloat32(offset, true),
                y: view.getFloat32(offset + 4, true),
                z: view.getFloat32(offset + 8, true),
                r: view.getFloat32(offset + 12, true),
                g: view.getFloat32(offset + 16, true),
                b: view.getFloat32(offset + 20, true),
                a: view.getFloat32(offset + 24, true),
                scale: view.getFloat32(offset + 28, true)
            });
        }
        
        return gaussians;
    }
    
    async parseCompressed(buffer) {
        if ('DecompressionStream' in window) {
            const ds = new DecompressionStream('gzip');
            const blob = new Blob([buffer]);
            const stream = blob.stream().pipeThrough(ds);
            const response = new Response(stream);
            const decompressed = await response.arrayBuffer();
            return this.parseSPLAT(decompressed);
        }
        return this.parseSPLAT(buffer);
    }
    
    parseJSON(buffer) {
        const text = new TextDecoder().decode(buffer);
        const data = JSON.parse(text);
        const gaussians = data.gaussians || data;
        return gaussians.slice(0, this.config.maxGaussians);
    }
    
    startRenderLoop() {
        const render = async (timestamp) => {
            if (!this.running) return;
            
            this.performance.beginFrame(timestamp);
            this.camera.update();
            
            const cameraMatrix = this.camera.getViewProjectionMatrix();
            const frustum = this.camera.getFrustum();
            const cameraPos = this.camera.getPosition();
            
            let visibleGaussians = this.lodManager.getVisibleGaussians(
                frustum,
                cameraPos,
                Math.floor(this.config.maxGaussians / 10)
            );
            
            if (visibleGaussians.length > 0) {
                visibleGaussians = await this.sorter.sortByCameraDistance(
                    visibleGaussians,
                    cameraPos,
                    'high'
                );
            }
            
            const renderStart = performance.now();
            this.renderer.render(visibleGaussians, cameraMatrix, cameraPos);
            
            this.stats.gaussiansRendered = visibleGaussians.length;
            this.stats.renderTimeMs = performance.now() - renderStart;
            this.stats.fps = this.performance.getFPS();
            this.stats.lodLevel = this.lodManager.getCurrentLevel();
            
            this.events.emit('frame', this.stats);
            
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
    }
    
    resize(width, height) {
        this.renderer.resize(width, height);
        this.camera.resize(width, height);
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    setQuality(level) {
        const qualities = {
            low: { maxGaussians: 1000000, renderScale: 0.5 },
            medium: { maxGaussians: 5000000, renderScale: 0.75 },
            high: { maxGaussians: 20000000, renderScale: 1.0 },
            ultra: { maxGaussians: 1000000000, renderScale: 1.0 }
        };
        
        const quality = qualities[level] || qualities.medium;
        this.config.maxGaussians = quality.maxGaussians;
        this.renderer.setRenderScale(quality.renderScale);
        this.events.emit('qualityChanged', level);
    }
    
    on(event, callback) {
        this.events.on(event, callback);
    }
    
    dispose() {
        this.running = false;
        this.renderer.dispose();
        this.streamManager.stop();
        this.events.emit('disposed');
        console.log('[Herok Rok1] Engine disposed');
    }
}

export default Engine;