/**
 * Herok Rok1 - TypeScript Definitions
 * @version 1.0.0
 */

// Core Types
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Vector4 {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a?: number;
}

export interface GaussianPoint {
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
    a: number;
    scale: number;
    nx?: number;
    ny?: number;
    nz?: number;
}

export interface Bounds3D {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
}

export interface CameraState {
    position: Vector3;
    target: Vector3;
    fov: number;
    near: number;
    far: number;
}

export interface EngineStats {
    gaussiansLoaded: number;
    gaussiansRendered: number;
    fps: number;
    memoryUsageMB: number;
    renderTimeMs: number;
    lodLevel: number;
    streamingProgress: number;
}

export interface EngineConfig {
    maxGaussians?: number;
    targetFPS?: number;
    memoryLimitMB?: number;
    fov?: number;
    near?: number;
    far?: number;
    backgroundColor?: [number, number, number, number];
    renderScale?: number;
}

// Core Classes
export class Engine {
    constructor(canvas: HTMLCanvasElement, options?: EngineConfig);
    loadGaussians(data: ArrayBuffer, format: 'ply' | 'splat' | 'compressed' | 'json'): Promise<GaussianCloud>;
    resize(width: number, height: number): void;
    getStats(): EngineStats;
    setQuality(level: 'low' | 'medium' | 'high' | 'ultra'): void;
    on(event: string, callback: (data: any) => void): void;
    dispose(): void;
}

export class Camera {
    constructor(canvas: HTMLCanvasElement, config?: EngineConfig);
    update(): void;
    getViewProjectionMatrix(): Float32Array;
    getViewMatrix(): Float32Array;
    getProjectionMatrix(): Float32Array;
    getPosition(): Vector3;
    getState(): CameraState;
    getFrustum(): any;
    onChange(callback: () => void): void;
    resize(width: number, height: number): void;
}

export class Scene {
    constructor();
    setGaussianCloud(cloud: GaussianCloud): void;
    getGaussianCloud(): GaussianCloud | null;
    setBackgroundColor(r: number, g: number, b: number, a?: number): void;
    getCenter(): Vector3;
    getRadius(): number;
    getStatistics(): SceneStatistics;
    dispose(): void;
}

export interface SceneStatistics {
    hasData: boolean;
    gaussianCount?: number;
    bounds?: Bounds3D;
    center?: Vector3;
    radius?: number;
    lightCount?: number;
}

// Gaussian Types
export class GaussianCloud {
    constructor(maxSize?: number);
    addGaussian(g: GaussianPoint): boolean;
    addBatch(gaussians: GaussianPoint[]): number;
    getGaussians(): GaussianPoint[];
    getCount(): number;
    getMemoryUsage(): number;
    getBounds(): Bounds3D;
    getCenter(): Vector3;
    getSize(): { width: number; height: number; depth: number };
    clear(): void;
    compress(): CompressedData;
}

export interface CompressedData {
    positions: Float32Array;
    colors: Float32Array;
    scales: Float32Array;
}

export class SplattingRenderer {
    constructor(config?: any);
    processSplats(gaussians: GaussianPoint[], camera: Camera): GaussianPoint[];
    cullGaussians(gaussians: GaussianPoint[], camera: Camera): GaussianPoint[];
    sortByDepth(gaussians: GaussianPoint[], camera: Camera): GaussianPoint[];
    gaussianKernel(distance: number, variance?: number): number;
    blendSplats(splats: GaussianPoint[], weights: number[]): Color;
    getSplatCount(): number;
    getRenderQueue(): GaussianPoint[];
    clear(): void;
}

export class GaussianSorter {
    constructor();
    sortByCameraDistance(gaussians: GaussianPoint[], cameraPos: Vector3, precision?: 'low' | 'medium' | 'high'): Promise<GaussianPoint[]>;
    quickSort(gaussians: GaussianPoint[], cameraPos: Vector3): GaussianPoint[];
    radixSort(gaussians: GaussianPoint[], cameraPos: Vector3): GaussianPoint[];
    sortWithWorker(gaussians: GaussianPoint[], cameraPos: Vector3): Promise<GaussianPoint[]>;
}

// LOD Types
export class LODManager {
    constructor(config?: any);
    buildOctree(gaussians: GaussianPoint[]): Promise<Octree>;
    updateCamera(cameraState: CameraState): void;
    getVisibleGaussians(frustum: any, cameraPos: Vector3, maxCount: number): GaussianPoint[];
    getCurrentLevel(): number;
    getQualityMultiplier(): number;
    setLODDistances(distances: number[]): void;
}

export class Octree {
    constructor(bounds: { center: Vector3; width: number; height: number; depth: number }, maxLevel?: number);
    insert(gaussian: GaussianPoint): boolean;
    build(gaussians: GaussianPoint[]): void;
    query(frustum: any, cameraPos: Vector3, maxCount: number): GaussianPoint[];
    getStatistics(): OctreeStats;
}

export interface OctreeStats {
    totalGaussians: number;
    rootStats: {
        level: number;
        gaussianCount: number;
        isLeaf: boolean;
        childrenCount: number;
    };
}

// Streaming Types
export class StreamManager {
    constructor(config?: any);
    start(): void;
    stop(): void;
    loadChunks(gaussians: GaussianPoint[]): Promise<void>;
    onProgress(callback: (progress: number) => void): void;
    getLoadedGaussians(): GaussianPoint[];
    getProgress(): StreamProgress;
}

export interface StreamProgress {
    loaded: number;
    total: number;
    active: number;
    percentage: number;
}

export class ChunkLoader {
    constructor(options?: { cacheSize?: number });
    load(chunk: any): Promise<any>;
    preload(chunks: any[]): Promise<any[]>;
    clearCache(): void;
    getCacheStats(): { size: number; maxSize: number; activeLoads: number };
    evict(id: string | number): void;
}

// Utility Types
export class PerformanceMonitor {
    constructor(targetFPS?: number);
    beginFrame(timestamp: number): void;
    getFPS(): number;
    getAverageFrameTime(): number;
    isDroppingFrames(): boolean;
    reset(): void;
}

export class EventBus {
    constructor();
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    emit(event: string, data?: any): void;
    once(event: string, callback: (data: any) => void): void;
    clear(): void;
}

export const MathUtils: {
    identity(out?: Float32Array): Float32Array;
    perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number): Float32Array;
    lookAt(out: Float32Array, eye: Vector3, center: Vector3, up: Vector3): Float32Array;
    multiplyMatrices(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array;
    clamp(value: number, min: number, max: number): number;
    lerp(a: number, b: number, t: number): number;
    randomRange(min: number, max: number): number;
};

// Main API Functions
export function initHerokRok1(canvas: HTMLCanvasElement, options?: EngineConfig): Engine;
export function loadScene(data: ArrayBuffer, format: 'ply' | 'splat' | 'compressed' | 'json'): Promise<GaussianCloud>;
export function getEngine(): Engine | null;
export function createSplattingRenderer(config?: any): SplattingRenderer;
export function getVersion(): string;
export function isWebGL2Supported(): boolean;
export function isWebGPUSupported(): boolean;

// Default export
declare const HerokRok1: {
    initHerokRok1: typeof initHerokRok1;
    loadScene: typeof loadScene;
    getEngine: typeof getEngine;
    createSplattingRenderer: typeof createSplattingRenderer;
    getVersion: typeof getVersion;
    isWebGL2Supported: typeof isWebGL2Supported;
    isWebGPUSupported: typeof isWebGPUSupported;
    version: string;
    Engine: typeof Engine;
    Camera: typeof Camera;
    Scene: typeof Scene;
    GaussianCloud: typeof GaussianCloud;
    SplattingRenderer: typeof SplattingRenderer;
    GaussianSorter: typeof GaussianSorter;
    LODManager: typeof LODManager;
    Octree: typeof Octree;
    StreamManager: typeof StreamManager;
    ChunkLoader: typeof ChunkLoader;
    PerformanceMonitor: typeof PerformanceMonitor;
    EventBus: typeof EventBus;
    MathUtils: typeof MathUtils;
};

export default HerokRok1;