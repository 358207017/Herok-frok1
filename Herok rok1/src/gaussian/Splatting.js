export class SplattingRenderer {
    constructor(config = {}) {
        this.config = {
            maxSplats: 1000000000,
            enableBlending: true,
            sortingPrecision: 'high',
            ...config
        };
        
        this.splatCount = 0;
        this.renderQueue = [];
    }
    
    processSplats(gaussians, camera) {
        const visible = this.cullGaussians(gaussians, camera);
        const sorted = this.sortByDepth(visible, camera);
        
        this.renderQueue = sorted;
        this.splatCount = sorted.length;
        
        return sorted;
    }
    
    cullGaussians(gaussians, camera) {
        const pos = camera.getPosition ? camera.getPosition() : { x: 0, y: 0, z: 0 };
        const farPlane = 500;
        const farSq = farPlane * farPlane;
        
        return gaussians.filter(g => {
            const dx = g.x - pos.x;
            const dy = g.y - pos.y;
            const dz = g.z - pos.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            return distSq < farSq;
        });
    }
    
    sortByDepth(gaussians, camera) {
        const pos = camera.getPosition ? camera.getPosition() : { x: 0, y: 0, z: 0 };
        
        return [...gaussians].sort((a, b) => {
            const da = this.distanceSquared(a, pos);
            const db = this.distanceSquared(b, pos);
            return db - da;
        });
    }
    
    distanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return dx*dx + dy*dy + dz*dz;
    }
    
    gaussianKernel(distance, variance = 0.5) {
        return Math.exp(-(distance * distance) / (2 * variance * variance));
    }
    
    blendSplats(splats, weights) {
        let r = 0, g = 0, b = 0, a = 0;
        
        for (let i = 0; i < splats.length; i++) {
            const s = splats[i];
            const w = weights[i];
            r += s.r * w;
            g += s.g * w;
            b += s.b * w;
            a += (s.a || 1) * w;
        }
        
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        if (totalWeight > 0) {
            r /= totalWeight;
            g /= totalWeight;
            b /= totalWeight;
            a /= totalWeight;
        }
        
        return { r, g, b, a };
    }
    
    getSplatCount() {
        return this.splatCount;
    }
    
    getRenderQueue() {
        return this.renderQueue;
    }
    
    clear() {
        this.renderQueue = [];
        this.splatCount = 0;
    }
}

export default SplattingRenderer;