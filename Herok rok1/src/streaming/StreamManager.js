import { ChunkLoader } from './ChunkLoader.js';

export class StreamManager {
    constructor(config = {}) {
        this.config = config;
        this.chunkSize = config.streaming?.chunkSize || 100000;
        this.maxConcurrent = config.streaming?.maxConcurrentChunks || 12;
        this.cacheSize = config.streaming?.cacheSize || 50;
        
        this.loader = new ChunkLoader({ cacheSize: this.cacheSize });
        this.queue = [];
        this.activeLoads = 0;
        this.loadedChunks = new Map();
        this.progressCallbacks = [];
        this.running = false;
    }
    
    start() {
        this.running = true;
        this.processQueue();
    }
    
    stop() {
        this.running = false;
    }
    
    async loadChunks(gaussians) {
        const chunks = this.chunkGaussians(gaussians);
        
        for (let i = 0; i < chunks.length; i++) {
            this.queue.push({
                id: i,
                gaussians: chunks[i],
                priority: this.calculatePriority(chunks[i])
            });
        }
        
        this.queue.sort((a, b) => b.priority - a.priority);
        this.processQueue();
    }
    
    chunkGaussians(gaussians) {
        const chunks = [];
        for (let i = 0; i < gaussians.length; i += this.chunkSize) {
            chunks.push(gaussians.slice(i, i + this.chunkSize));
        }
        return chunks;
    }
    
    calculatePriority(gaussians) {
        if (gaussians.length === 0) return 0;
        
        let totalScale = 0;
        for (let g of gaussians) {
            totalScale += g.scale || 0.1;
        }
        return totalScale / gaussians.length;
    }
    
    async processQueue() {
        while (this.running && this.activeLoads < this.maxConcurrent && this.queue.length > 0) {
            const chunk = this.queue.shift();
            if (chunk && !this.loadedChunks.has(chunk.id)) {
                this.loadChunk(chunk);
            }
        }
        
        if (this.running) {
            setTimeout(() => this.processQueue(), 50);
        }
    }
    
    async loadChunk(chunk) {
        this.activeLoads++;
        
        try {
            const loaded = await this.loader.load(chunk);
            this.loadedChunks.set(chunk.id, loaded);
            this.updateProgress();
        } catch (error) {
            console.error(`Failed to load chunk ${chunk.id}:`, error);
        } finally {
            this.activeLoads--;
            this.processQueue();
        }
    }
    
    updateProgress() {
        const total = this.queue.length + this.loadedChunks.size;
        const progress = total > 0 ? this.loadedChunks.size / total : 0;
        this.progressCallbacks.forEach(cb => cb(progress));
    }
    
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }
    
    getLoadedGaussians() {
        const allGaussians = [];
        for (let chunk of this.loadedChunks.values()) {
            allGaussians.push(...chunk.gaussians);
        }
        return allGaussians;
    }
    
    getProgress() {
        const total = this.queue.length + this.loadedChunks.size;
        return {
            loaded: this.loadedChunks.size,
            total: total,
            active: this.activeLoads,
            percentage: total > 0 ? (this.loadedChunks.size / total) * 100 : 0
        };
    }
}

export default StreamManager;