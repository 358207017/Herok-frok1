export class OctreeNode {
    constructor(center, size, level, maxLevel) {
        this.center = center;
        this.size = size;
        this.level = level;
        this.maxLevel = maxLevel;
        this.children = null;
        this.gaussians = [];
        this.gaussianCount = 0;
        this.isLeaf = true;
    }
    
    insert(gaussian) {
        if (!this.contains(gaussian)) return false;
        
        if (this.isLeaf && this.shouldSplit()) {
            this.split();
        }
        
        if (!this.isLeaf) {
            for (let child of this.children) {
                if (child.insert(gaussian)) {
                    this.gaussianCount++;
                    return true;
                }
            }
        }
        
        this.gaussians.push(gaussian);
        this.gaussianCount++;
        return true;
    }
    
    contains(gaussian) {
        const half = this.size / 2;
        return Math.abs(gaussian.x - this.center.x) <= half &&
               Math.abs(gaussian.y - this.center.y) <= half &&
               Math.abs(gaussian.z - this.center.z) <= half;
    }
    
    shouldSplit() {
        return this.gaussians.length > 100 && this.level < this.maxLevel;
    }
    
    split() {
        const half = this.size / 4;
        const childSize = this.size / 2;
        const offsets = [
            [-1, -1, -1], [ 1, -1, -1], [-1,  1, -1], [ 1,  1, -1],
            [-1, -1,  1], [ 1, -1,  1], [-1,  1,  1], [ 1,  1,  1]
        ];
        
        this.children = [];
        for (let offset of offsets) {
            const childCenter = {
                x: this.center.x + offset[0] * half,
                y: this.center.y + offset[1] * half,
                z: this.center.z + offset[2] * half
            };
            this.children.push(new OctreeNode(childCenter, childSize, this.level + 1, this.maxLevel));
        }
        
        const oldGaussians = this.gaussians;
        this.gaussians = [];
        this.isLeaf = false;
        
        for (let g of oldGaussians) {
            this.insert(g);
        }
    }
    
    query(frustum, cameraPos, result, maxCount) {
        if (!this.intersectsFrustum(frustum)) return false;
        if (result.length >= maxCount) return true;
        
        if (this.isLeaf) {
            for (let g of this.gaussians) {
                if (result.length < maxCount) {
                    result.push(g);
                } else {
                    return true;
                }
            }
        } else if (this.children) {
            const sortedChildren = [...this.children];
            sortedChildren.sort((a, b) => {
                const da = this.distanceToCenter(cameraPos, a.center);
                const db = this.distanceToCenter(cameraPos, b.center);
                return da - db;
            });
            
            for (let child of sortedChildren) {
                if (child.query(frustum, cameraPos, result, maxCount)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    intersectsFrustum(frustum) {
        const radius = this.size / 2 * Math.sqrt(3);
        return true;
    }
    
    distanceToCenter(cameraPos, center) {
        const dx = cameraPos.x - center.x;
        const dy = cameraPos.y - center.y;
        const dz = cameraPos.z - center.z;
        return dx*dx + dy*dy + dz*dz;
    }
    
    getStatistics() {
        return {
            level: this.level,
            gaussianCount: this.gaussianCount,
            isLeaf: this.isLeaf,
            childrenCount: this.children ? this.children.length : 0
        };
    }
}

export class Octree {
    constructor(bounds, maxLevel = 5) {
        const size = Math.max(bounds.width, bounds.height, bounds.depth);
        this.root = new OctreeNode(bounds.center, size, 0, maxLevel);
        this.totalGaussians = 0;
    }
    
    insert(gaussian) {
        if (this.root.insert(gaussian)) {
            this.totalGaussians++;
            return true;
        }
        return false;
    }
    
    build(gaussians) {
        for (let g of gaussians) {
            this.insert(g);
        }
    }
    
    query(frustum, cameraPos, maxCount) {
        const result = [];
        this.root.query(frustum, cameraPos, result, maxCount);
        return result;
    }
    
    getStatistics() {
        return {
            totalGaussians: this.totalGaussians,
            rootStats: this.root.getStatistics()
        };
    }
}

export default Octree;