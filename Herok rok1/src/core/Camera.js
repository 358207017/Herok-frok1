import { MathUtils } from '../utils/MathUtils.js';

export class Camera {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = config;
        
        this.position = { x: 0, y: 0, z: 5 };
        this.target = { x: 0, y: 0, z: 0 };
        this.up = { x: 0, y: 1, z: 0 };
        
        this.fov = config.fov || 65;
        this.near = config.near || 0.1;
        this.far = config.far || 1000;
        
        this.radius = 5;
        this.theta = 0;
        this.phi = Math.PI / 4;
        
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        this.viewProjectionMatrix = new Float32Array(16);
        
        this.changeCallbacks = [];
        
        this.initEvents();
        this.updateProjection();
        this.updatePositionFromAngles();
        this.updateView();
    }
    
    initEvents() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        this.canvas.style.cursor = 'grab';
    }
    
    updateProjection() {
        const aspect = this.canvas.width / this.canvas.height;
        MathUtils.perspective(this.projectionMatrix, this.fov * Math.PI / 180, aspect, this.near, this.far);
    }
    
    updatePositionFromAngles() {
        this.position.x = this.radius * Math.sin(this.theta) * Math.cos(this.phi);
        this.position.y = this.radius * Math.sin(this.phi);
        this.position.z = this.radius * Math.cos(this.theta) * Math.cos(this.phi);
    }
    
    updateView() {
        MathUtils.lookAt(this.viewMatrix, this.position, this.target, this.up);
        MathUtils.multiplyMatrices(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }
    
    update() {
        this.updateView();
        this.notifyChange();
    }
    
    getViewProjectionMatrix() {
        return this.viewProjectionMatrix;
    }
    
    getViewMatrix() {
        return this.viewMatrix;
    }
    
    getProjectionMatrix() {
        return this.projectionMatrix;
    }
    
    getPosition() {
        return { ...this.position };
    }
    
    getState() {
        return {
            position: { ...this.position },
            target: { ...this.target },
            fov: this.fov,
            radius: this.radius,
            theta: this.theta,
            phi: this.phi
        };
    }
    
    getFrustum() {
        const m = this.viewProjectionMatrix;
        return {
            left: m[12] + m[0],
            right: m[12] - m[0],
            bottom: m[12] + m[1],
            top: m[12] - m[1],
            near: m[12] + m[2],
            far: m[12] - m[2]
        };
    }
    
    onChange(callback) {
        this.changeCallbacks.push(callback);
    }
    
    notifyChange() {
        this.changeCallbacks.forEach(cb => cb());
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        
        this.theta += dx * 0.01;
        this.phi += dy * 0.01;
        
        this.phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.phi));
        
        this.updatePositionFromAngles();
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.isDragging = true;
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        const touch = e.touches[0];
        const dx = touch.clientX - this.lastX;
        const dy = touch.clientY - this.lastY;
        
        this.theta += dx * 0.01;
        this.phi += dy * 0.01;
        
        this.phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.phi));
        
        this.updatePositionFromAngles();
        
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
    }
    
    onTouchEnd(e) {
        this.isDragging = false;
    }
    
    onWheel(e) {
        const delta = e.deltaY > 0 ? 1.1 : 0.9;
        this.radius *= delta;
        this.radius = Math.max(1, Math.min(100, this.radius));
        this.updatePositionFromAngles();
        e.preventDefault();
    }
    
    resize(width, height) {
        this.updateProjection();
    }
}

export default Camera;