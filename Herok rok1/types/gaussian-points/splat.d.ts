/**
 * SPLAT Format Type Definitions for Gaussian Points
 * @version 1.0.0
 */

export interface SplatHeader {
    magic: number;
    version: number;
    vertexCount: number;
    featureCount: number;
    compressionType: SplatCompression;
}

export type SplatCompression = 'none' | 'lz4' | 'zstd' | 'gzip';

export interface SplatGaussianVertex {
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
    a: number;
    scale: number;
    confidence?: number;
    timestamp?: number;
}

export interface SplatMetadata {
    createdAt: number;
    source?: string;
    author?: string;
    description?: string;
    bounds?: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    };
}

export interface SplatChunk {
    id: number;
    offset: number;
    size: number;
    vertexCount: number;
    bounds?: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    };
}

export interface SplatFile {
    header: SplatHeader;
    vertices: SplatGaussianVertex[];
    metadata?: SplatMetadata;
    chunks?: SplatChunk[];
}

export interface SplatParserOptions {
    maxVertices?: number;
    lazyLoading?: boolean;
    chunkSize?: number;
    validateChecksum?: boolean;
    decompress?: boolean;
}

export class SplatParser {
    constructor(options?: SplatParserOptions);
    parse(buffer: ArrayBuffer): Promise<SplatGaussianVertex[]>;
    parseHeader(buffer: ArrayBuffer): SplatHeader;
    parseVertices(buffer: ArrayBuffer, startOffset?: number, count?: number): SplatGaussianVertex[];
    parseMetadata(buffer: ArrayBuffer): SplatMetadata | null;
    parseChunks(buffer: ArrayBuffer): SplatChunk[];
    validate(buffer: ArrayBuffer): boolean;
    getVertexCount(buffer: ArrayBuffer): number;
    extractChunk(buffer: ArrayBuffer, chunk: SplatChunk): SplatGaussianVertex[];
    compress(vertices: SplatGaussianVertex[], level?: number): Promise<ArrayBuffer>;
    decompress(buffer: ArrayBuffer): Promise<ArrayBuffer>;
}

export interface SplatWriter {
    write(vertices: SplatGaussianVertex[], options?: {
        compress?: boolean;
        compressLevel?: number;
        includeMetadata?: boolean;
        chunkSize?: number;
    }): Promise<ArrayBuffer>;
    writeHeader(vertexCount: number): ArrayBuffer;
    writeVertices(vertices: SplatGaussianVertex[]): ArrayBuffer;
    writeMetadata(metadata: SplatMetadata): ArrayBuffer;
    writeChunkInfo(chunks: SplatChunk[]): ArrayBuffer;
}

export function parseSplat(buffer: ArrayBuffer, options?: SplatParserOptions): Promise<SplatGaussianVertex[]>;
export function validateSplat(buffer: ArrayBuffer): boolean;
export function getSplatInfo(buffer: ArrayBuffer): {
    vertexCount: number;
    compressionType: string;
    version: number;
    hasMetadata: boolean;
    chunkCount: number;
};
export function writeSplat(vertices: SplatGaussianVertex[], options?: any): Promise<ArrayBuffer>;

export default SplatParser;