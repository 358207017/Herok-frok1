/**
 * Gaussian Points Data Types - Unified Exports
 * @version 1.0.0
 */

// Export all PLY types
export * from './ply.js';
export * from './splat.js';
export * from './compressed.js';

// Unified Gaussian point type
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
    confidence?: number;
    timestamp?: number;
    label?: string;
    id?: number;
}

export interface GaussianPointCloud {
    vertices: GaussianPoint[];
    bounds: {
        min: [number, number, number];
        max: [number, number, number];
    };
    center: [number, number, number];
    count: number;
    metadata?: Record<string, any>;
}

export interface GaussianPointChunk {
    id: number;
    vertices: GaussianPoint[];
    bounds: {
        min: [number, number, number];
        max: [number, number, number];
    };
    lodLevel?: number;
}

export type GaussianFormat = 'ply' | 'splat' | 'compressed' | 'json';

export interface GaussianParserOptions {
    format: GaussianFormat;
    maxPoints?: number;
    lazyLoad?: boolean;
    chunkSize?: number;
    normalizeColors?: boolean;
    defaultAlpha?: number;
    defaultScale?: number;
}

export class GaussianPointParser {
    constructor(options?: GaussianParserOptions);
    parse(buffer: ArrayBuffer, format?: GaussianFormat): Promise<GaussianPoint[]>;
    parseStream(stream: ReadableStream, format?: GaussianFormat): AsyncGenerator<GaussianPoint[]>;
    detectFormat(buffer: ArrayBuffer): GaussianFormat;
    validate(buffer: ArrayBuffer, format?: GaussianFormat): boolean;
    getInfo(buffer: ArrayBuffer): {
        format: GaussianFormat;
        pointCount: number;
        size: number;
        hasColors: boolean;
        hasNormals: boolean;
        compression?: string;
    };
}

export function parseGaussianPoints(
    buffer: ArrayBuffer, 
    format: GaussianFormat, 
    options?: Partial<GaussianParserOptions>
): Promise<GaussianPoint[]>;

export function detectGaussianFormat(buffer: ArrayBuffer): GaussianFormat;
export function validateGaussianData(buffer: ArrayBuffer, format?: GaussianFormat): boolean;
export function getGaussianInfo(buffer: ArrayBuffer): {
    format: GaussianFormat;
    pointCount: number;
    size: number;
    hasColors: boolean;
    hasNormals: boolean;
    estimatedMemoryMB: number;
};

export default GaussianPointParser;