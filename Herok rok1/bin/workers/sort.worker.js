/**
 * Herok Rok1 Sort Worker
 * Handles GPU sorting in background thread
 */

self.onmessage = function(e) {
    const { gaussians, cameraPos, method } = e.data;
    
    const distanceToCamera = (g, pos) => {
        const dx = g.x - pos.x;
        const dy = g.y - pos.y;
        const dz = g.z - pos.z;
        return dx * dx + dy * dy + dz * dz;
    };
    
    let sorted;
    
    if (method === 'quick') {
        sorted = quickSort([...gaussians], cameraPos, distanceToCamera);
    } else {
        sorted = radixSort([...gaussians], cameraPos, distanceToCamera);
    }
    
    self.postMessage({ sorted });
};

function quickSort(gaussians, cameraPos, distanceFn) {
    if (gaussians.length <= 1) return gaussians;
    
    const pivot = gaussians[Math.floor(gaussians.length / 2)];
    const pivotDist = distanceFn(pivot, cameraPos);
    
    const left = [];
    const right = [];
    
    for (let i = 0; i < gaussians.length; i++) {
        if (i === Math.floor(gaussians.length / 2)) continue;
        
        const dist = distanceFn(gaussians[i], cameraPos);
        if (dist >= pivotDist) {
            left.push(gaussians[i]);
        } else {
            right.push(gaussians[i]);
        }
    }
    
    return [...quickSort(left, cameraPos, distanceFn), pivot, ...quickSort(right, cameraPos, distanceFn)];
}

function radixSort(gaussians, cameraPos, distanceFn) {
    const items = gaussians.map((g, idx) => ({
        idx: idx,
        dist: distanceFn(g, cameraPos)
    }));
    
    const maxDist = Math.max(...items.map(i => i.dist));
    const bits = Math.ceil(Math.log2(maxDist + 1));
    
    let sorted = radixSortByBits(items, 0, bits);
    
    return sorted.map(item => gaussians[item.idx]);
}

function radixSortByBits(items, bit, maxBit) {
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
    
    return [...radixSortByBits(zero, bit + 1, maxBit), ...radixSortByBits(one, bit + 1, maxBit)];
}