export class GaussianSorter {
    constructor() {
        this.useWorker = typeof Worker !== 'undefined';
        this.worker = null;
    }
    
    async sortByCameraDistance(gaussians, cameraPos, precision = 'high') {
        if (gaussians.length <= 1) return gaussians;
        
        if (gaussians.length < 50000) {
            return this.quickSort(gaussians, cameraPos);
        }
        
        return this.radixSort(gaussians, cameraPos);
    }
    
    quickSort(gaussians, cameraPos) {
        if (gaussians.length <= 1) return gaussians;
        
        const pivot = gaussians[Math.floor(gaussians.length / 2)];
        const pivotDist = this.distanceToCamera(pivot, cameraPos);
        
        const left = [];
        const right = [];
        
        for (let i = 0; i < gaussians.length; i++) {
            if (i === Math.floor(gaussians.length / 2)) continue;
            
            const dist = this.distanceToCamera(gaussians[i], cameraPos);
            if (dist >= pivotDist) {
                left.push(gaussians[i]);
            } else {
                right.push(gaussians[i]);
            }
        }
        
        return [
            ...this.quickSort(left, cameraPos),
            pivot,
            ...this.quickSort(right, cameraPos)
        ];
    }
    
    radixSort(gaussians, cameraPos) {
        const items = gaussians.map((g, idx) => ({
            idx: idx,
            dist: this.distanceToCamera(g, cameraPos)
        }));
        
        const maxDist = Math.max(...items.map(i => i.dist));
        const bits = Math.ceil(Math.log2(maxDist + 1));
        
        let sorted = this.radixSortByBits(items, 0, bits);
        
        return sorted.map(item => gaussians[item.idx]);
    }
    
    radixSortByBits(items, bit, maxBit) {
        if (bit >= maxBit || items.length <= 1) return items;
        
        const zero = [];
        const one = [];
        const mask = 1 << bit;
        
        for (let item of items) {
            if (Math.floor(item.dist) & mask) {
                one.push(item);
            } else {
                zero.push(item);
            }
        }
        
        return [
            ...this.radixSortByBits(zero, bit + 1, maxBit),
            ...this.radixSortByBits(one, bit + 1, maxBit)
        ];
    }
    
    distanceToCamera(gaussian, cameraPos) {
        const dx = gaussian.x - cameraPos.x;
        const dy = gaussian.y - cameraPos.y;
        const dz = gaussian.z - cameraPos.z;
        return dx * dx + dy * dy + dz * dz;
    }
    
    createWorker() {
        const workerCode = `
            self.onmessage = function(e) {
                const { gaussians, cameraPos } = e.data;
                
                const distanceToCamera = (g, pos) => {
                    const dx = g.x - pos.x;
                    const dy = g.y - pos.y;
                    const dz = g.z - pos.z;
                    return dx*dx + dy*dy + dz*dz;
                };
                
                const sorted = [...gaussians].sort((a, b) => {
                    const da = distanceToCamera(a, cameraPos);
                    const db = distanceToCamera(b, cameraPos);
                    return db - da;
                });
                
                self.postMessage({ sorted });
            };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }
    
    async sortWithWorker(gaussians, cameraPos) {
        return new Promise((resolve) => {
            const worker = this.createWorker();
            worker.onmessage = (e) => {
                resolve(e.data.sorted);
                worker.terminate();
            };
            worker.postMessage({ gaussians, cameraPos });
        });
    }
}

export const SortingUtils = {
    distanceToCamera: (g, cam) => {
        const dx = g.x - cam.x;
        const dy = g.y - cam.y;
        const dz = g.z - cam.z;
        return dx * dx + dy * dy + dz * dz;
    },
    
    sphericalToCartesian: (radius, theta, phi) => {
        return {
            x: radius * Math.sin(theta) * Math.cos(phi),
            y: radius * Math.sin(phi),
            z: radius * Math.cos(theta) * Math.cos(phi)
        };
    },
    
    cartesianToSpherical: (x, y, z) => {
        const radius = Math.sqrt(x*x + y*y + z*z);
        const theta = Math.acos(z / radius);
        const phi = Math.atan2(y, x);
        return { radius, theta, phi };
    }
};

export default GaussianSorter;