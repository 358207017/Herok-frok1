import { Octree } from './Octree.js';

export class LODManager {
    constructor(config = {}) {
        this.config = config;
        this.levels = config.lod?.levels || 5;
        this.distances = config.lod?.distances || [5, 20, 50, 150, 500];
        this.qualityMultipliers = config.lod?.qualityMultipliers || [1.0, 0.75, 0.5, 0.3, 0.15];
        
        this.octree = null;
        this.cameraState = null;
        this.currentLevel = 0;
    }
    
    async buildOctree(gaussians) {
        const bounds = this.computeBounds(gaussians);
        this.octree = new Octree(bounds, this.levels);
        this.octree.build(gaussians);
        return this.octree;
    }
    
    computeBounds(gaussians) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        
        for (let g of gaussians) {
            minX = Math.min(minX, g.x);
            minY = Math.min(minY, g.y);
            minZ = Math.min(minZ, g.z);
            maxX = Math.max(maxX, g.x);
            maxY = Math.max(maxY, g.y);
            maxZ = Math.max(maxZ, g.z);
        }
        
        return {
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
                z: (minZ + maxZ) / 2
            },
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ - minZ
        };
    }
    
    updateCamera(cameraState) {
        this.cameraState = cameraState;
        this.updateCurrentLevel();
    }
    
    updateCurrentLevel() {
        if (!this.cameraState || !this.octree) return;
        
        const center = this.octree.root.center;
        const dx = this.cameraState.position.x - center.x;
        const dy = this.cameraState.position.y - center.y;
        const dz = this.cameraState.position.z - center.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        for (let i = 0; i < this.distances.length; i++) {
            if (distance < this.distances[i]) {
                this.currentLevel = i;
                return;
            }
        }
        
        this.currentLevel = this.levels - 1;
    }
    
    getVisibleGaussians(frustum, cameraPos, maxCount) {
        if (!this.octree) return [];
        
        const multiplier = this.qualityMultipliers[this.currentLevel];
        const actualMax = Math.floor(maxCount * multiplier);
        
        return this.octree.query(frustum, cameraPos, actualMax);
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    getQualityMultiplier() {
        return this.qualityMultipliers[this.currentLevel];
    }
    
    setLODDistances(distances) {
        if (distances.length === this.levels) {
            this.distances = distances;
        }
    }
}

export default LODManager;