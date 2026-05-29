/**
 * Herok Rok1 - 3D Gaussian Splatting Render Engine
 * High-performance browser-based renderer for up to 1 billion Gaussian points
 * @version 1.0.0
 * @license MIT
 */

import { Engine } from './src/core/Engine.js';
import { Camera } from './src/core/Camera.js';
import { Scene } from './src/core/Scene.js';
import { GaussianCloud } from './src/gaussian/GaussianCloud.js';
import { SplattingRenderer } from './src/gaussian/Splatting.js';
import { GaussianSorter } from './src/gaussian/Sorting.js';
import { LODManager } from './src/lod/LODManager.js';
import { Octree } from './src/lod/Octree.js';
import { StreamManager } from './src/streaming/StreamManager.js';
import { ChunkLoader } from './src/streaming/ChunkLoader.js';
import { PerformanceMonitor } from './src/utils/PerformanceMonitor.js';
import { EventBus } from './src/utils/EventBus.js';
import { MathUtils } from './src/utils/MathUtils.js';

let instance = null;

/**
 * Initialize Herok Rok1 engine
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object} options - Configuration options
 * @returns {Engine} Engine instance
 */
export function initHerokRok1(canvas, options = {}) {
    instance = new Engine(canvas, options);
    return instance;
}

/**
 * Load Gaussian splatting scene
 * @param {ArrayBuffer|String} data - Scene data
 * @param {String} format - Format (ply/splat/compressed)
 * @returns {Promise<GaussianCloud>}
 */
export async function loadScene(data, format = 'splat') {
    if (!instance) {
        throw new Error('Engine not initialized. Call initHerokRok1 first.');
    }
    return await instance.loadGaussians(data, format);
}

/**
 * Get current engine instance
 * @returns {Engine}
 */
export function getEngine() {
    return instance;
}

/**
 * Create a splatting renderer
 * @param {Object} config - Renderer configuration
 * @returns {SplattingRenderer}
 */
export function createSplattingRenderer(config = {}) {
    return new SplattingRenderer(config);
}

/**
 * Get engine version
 * @returns {string}
 */
export function getVersion() {
    return '1.0.0';
}

/**
 * Check if WebGL2 is supported
 * @returns {boolean}
 */
export function isWebGL2Supported() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
}

/**
 * Check if WebGPU is supported
 * @returns {boolean}
 */
export function isWebGPUSupported() {
    return 'gpu' in navigator;
}

export {
    Engine,
    Camera,
    Scene,
    GaussianCloud,
    SplattingRenderer,
    GaussianSorter,
    LODManager,
    Octree,
    StreamManager,
    ChunkLoader,
    PerformanceMonitor,
    EventBus,
    MathUtils
};

export default {
    initHerokRok1,
    loadScene,
    getEngine,
    createSplattingRenderer,
    getVersion,
    isWebGL2Supported,
    isWebGPUSupported,
    version: '1.0.0'
};