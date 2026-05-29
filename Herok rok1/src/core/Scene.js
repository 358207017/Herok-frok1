export class Scene {
    constructor() {
        this.gaussianCloud = null;
        this.backgroundColor = { r: 0, g: 0, b: 0, a: 1 };
        this.lights = [];
        this.environmentMap = null;
        
        this.bounds = {
            min: { x: Infinity, y: Infinity, z: Infinity },
            max: { x: -Infinity, y: -Infinity, z: -Infinity }
        };
        
        this.metadata = {
            name: 'Herok Rok1 Scene',
            version: '1.0',
            createdAt: Date.now()
        };
    }
    
    setGaussianCloud(cloud) {
        this.gaussianCloud = cloud;
        this.updateBounds(cloud);
    }
    
    getGaussianCloud() {
        return this.gaussianCloud;
    }
    
    updateBounds(cloud) {
        if (!cloud) return;
        
        const gaussians = cloud.getGaussians();
        
        for (let g of gaussians) {
            this.bounds.min.x = Math.min(this.bounds.min.x, g.x);
            this.bounds.min.y = Math.min(this.bounds.min.y, g.y);
            this.bounds.min.z = Math.min(this.bounds.min.z, g.z);
            this.bounds.max.x = Math.max(this.bounds.max.x, g.x);
            this.bounds.max.y = Math.max(this.bounds.max.y, g.y);
            this.bounds.max.z = Math.max(this.bounds.max.z, g.z);
        }
    }
    
    getCenter() {
        return {
            x: (this.bounds.min.x + this.bounds.max.x) / 2,
            y: (this.bounds.min.y + this.bounds.max.y) / 2,
            z: (this.bounds.min.z + this.bounds.max.z) / 2
        };
    }
    
    getRadius() {
        const center = this.getCenter();
        const dx = this.bounds.max.x - center.x;
        const dy = this.bounds.max.y - center.y;
        const dz = this.bounds.max.z - center.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    setBackgroundColor(r, g, b, a = 1) {
        this.backgroundColor = { r, g, b, a };
    }
    
    addLight(light) {
        this.lights.push(light);
    }
    
    removeLight(index) {
        if (index >= 0 && index < this.lights.length) {
            this.lights.splice(index, 1);
        }
    }
    
    clearLights() {
        this.lights = [];
    }
    
    getStatistics() {
        if (!this.gaussianCloud) {
            return { hasData: false };
        }
        
        return {
            hasData: true,
            gaussianCount: this.gaussianCloud.getCount(),
            bounds: this.bounds,
            center: this.getCenter(),
            radius: this.getRadius(),
            lightCount: this.lights.length
        };
    }
    
    dispose() {
        if (this.gaussianCloud) {
            this.gaussianCloud.clear();
            this.gaussianCloud = null;
        }
        this.lights = [];
        this.environmentMap = null;
    }
}

export default Scene;