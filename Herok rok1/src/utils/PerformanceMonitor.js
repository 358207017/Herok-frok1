export class PerformanceMonitor {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.frameTimes = [];
        this.lastFrameTime = 0;
        this.currentFPS = 0;
        this.maxSamples = 60;
    }
    
    beginFrame(timestamp) {
        if (this.lastFrameTime > 0) {
            const delta = timestamp - this.lastFrameTime;
            this.frameTimes.push(delta);
            
            if (this.frameTimes.length > this.maxSamples) {
                this.frameTimes.shift();
            }
            
            const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            this.currentFPS = avgDelta > 0 ? 1000 / avgDelta : 0;
        }
        
        this.lastFrameTime = timestamp;
    }
    
    getFPS() {
        return Math.round(this.currentFPS);
    }
    
    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }
    
    isDroppingFrames() {
        return this.currentFPS < this.targetFPS * 0.8;
    }
    
    reset() {
        this.frameTimes = [];
        this.lastFrameTime = 0;
        this.currentFPS = 0;
    }
}

export default PerformanceMonitor;