export class GaussianCloud {
    constructor(maxSize = 1000000000) {
        this.maxSize = maxSize;
        this.gaussians = [];
        
        this.bounds = {
            minX: Infinity, minY: Infinity, minZ: Infinity,
            maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity
        };
        
        this.metadata = {
            version: '1.0',
            pointCount: 0,
            format: 'splat',
            createdAt: Date.now()
        };
    }
    
    addGaussian(g) {
        if (this.gaussians.length >= this.maxSize) {
            console.warn('GaussianCloud: Max size reached');
            return false;
        }
        
        const gaussian = {
            x: g.x, y: g.y, z: g.z,
            r: g.r, g: g.g, b: g.b,
            a: g.a !== undefined ? g.a : 1.0,
            scale: g.scale !== undefined ? g.scale : 0.1,
            nx: g.nx || 0, ny: g.ny || 0, nz: g.nz || 0
        };
        
        this.gaussians.push(gaussian);
        this.updateBounds(gaussian);
        this.metadata.pointCount = this.gaussians.length;
        
        return true;
    }
    
    addBatch(gaussians) {
        const available = this.maxSize - this.gaussians.length;
        const toAdd = gaussians.slice(0, available);
        
        for (let g of toAdd) {
            this.addGaussian(g);
        }
        
        return toAdd.length;
    }
    
    updateBounds(g) {
        this.bounds.minX = Math.min(this.bounds.minX, g.x);
        this.bounds.minY = Math.min(this.bounds.minY, g.y);
        this.bounds.minZ = Math.min(this.bounds.minZ, g.z);
        this.bounds.maxX = Math.max(this.bounds.maxX, g.x);
        this.bounds.maxY = Math.max(this.bounds.maxY, g.y);
        this.bounds.maxZ = Math.max(this.bounds.maxZ, g.z);
    }
    
    getGaussians() {
        return this.gaussians;
    }
    
    getCount() {
        return this.gaussians.length;
    }
    
    getMemoryUsage() {
        return this.gaussians.length * 48;
    }
    
    getBounds() {
        return { ...this.bounds };
    }
    
    getCenter() {
        return {
            x: (this.bounds.minX + this.bounds.maxX) / 2,
            y: (this.bounds.minY + this.bounds.maxY) / 2,
            z: (this.bounds.minZ + this.bounds.maxZ) / 2
        };
    }
    
    getSize() {
        return {
            width: this.bounds.maxX - this.bounds.minX,
            height: this.bounds.maxY - this.bounds.minY,
            depth: this.bounds.maxZ - this.bounds.minZ
        };
    }
    
    clear() {
        this.gaussians = [];
        this.metadata.pointCount = 0;
        this.bounds = {
            minX: Infinity, minY: Infinity, minZ: Infinity,
            maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity
        };
    }
    
    compress() {
        const count = this.gaussians.length;
        
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 4);
        const scales = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const g = this.gaussians[i];
            positions[i*3] = g.x;
            positions[i*3+1] = g.y;
            positions[i*3+2] = g.z;
            colors[i*4] = g.r;
            colors[i*4+1] = g.g;
            colors[i*4+2] = g.b;
            colors[i*4+3] = g.a;
            scales[i] = g.scale;
        }
        
        return { positions, colors, scales };
    }
}

export default GaussianCloud;