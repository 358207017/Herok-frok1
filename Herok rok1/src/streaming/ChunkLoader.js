export class ChunkLoader {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxCacheSize = options.cacheSize || 50;
        this.activeLoads = new Map();
    }
    
    async load(chunk) {
        if (this.activeLoads.has(chunk.id)) {
            return this.activeLoads.get(chunk.id);
        }
        
        if (this.cache.has(chunk.id)) {
            const cached = this.cache.get(chunk.id);
            if (Date.now() - cached.timestamp < 60000) {
                return cached.data;
            }
            this.cache.delete(chunk.id);
        }
        
        const loadPromise = this.performLoad(chunk);
        this.activeLoads.set(chunk.id, loadPromise);
        
        try {
            const result = await loadPromise;
            this.updateCache(chunk.id, result);
            return result;
        } finally {
            this.activeLoads.delete(chunk.id);
        }
    }
    
    async performLoad(chunk) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: chunk.id,
                    gaussians: chunk.gaussians,
                    loadedAt: Date.now(),
                    count: chunk.gaussians.length,
                    metadata: {
                        priority: chunk.priority,
                        version: '1.0'
                    }
                });
            }, 0);
        });
    }
    
    updateCache(id, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }
        
        this.cache.set(id, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    async preload(chunks) {
        const promises = chunks.map(chunk => this.load(chunk));
        return Promise.all(promises);
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            activeLoads: this.activeLoads.size
        };
    }
    
    evict(id) {
        this.cache.delete(id);
    }
}

export default ChunkLoader;