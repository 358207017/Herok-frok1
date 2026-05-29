/**
 * Compressed Gaussian Points Format Type Definitions
 * @version 1.0.0
 */

export type CompressionAlgorithm = 'gzip' | 'brotli' | 'lz4' | 'zstd' | 'none';

export interface CompressedHeader {
    magic: string;
    version: number;
    algorithm: CompressionAlgorithm;
    originalSize: number;
    compressedSize: number;
    vertexCount: number;
    featureCount: number;
    checksum: string;
    compressionLevel: number;
    createdAt: number;
}

export interface CompressedChunk {
    index: number;
    offset: number;
    compressedSize: number;
    originalSize: number;
    vertexCount: number;
}

export interface QuantizationParams {
    position: {
        precision: number;
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    };
    color: {
        precision: number;
        bitsPerChannel: number;
    };
    scale: {
        precision: number;
        minScale: number;
        maxScale: number;
    };
    alpha?: {
        precision: number;
    };
}

export interface CompressedMetadata {
    source?: string;
    author?: string;
    description?: string;
    quantization?: QuantizationParams;
    bounds?: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    };
    transform?: {
        translate?: [number, number, number];
        scale?: [number, number, number];
        rotate?: [number, number, number, number];
    };
}

export interface DecompressedGaussianVertex {
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
    a: number;
    scale: number;
}

export interface CompressionOptions {
    algorithm?: CompressionAlgorithm;
    level?: number;
    quantize?: boolean;
    quantizePositionPrecision?: number;
    quantizeColorPrecision?: number;
    quantizeScalePrecision?: number;
    chunkSize?: number;
    parallel?: boolean;
    preserveOrder?: boolean;
}

export interface DecompressionOptions {
    lazy?: boolean;
    chunkSize?: number;
    parallel?: boolean;
    validateChecksum?: boolean;
    stream?: boolean;
}

export class CompressedParser {
    constructor(options?: DecompressionOptions);
    parse(buffer: ArrayBuffer): Promise<DecompressedGaussianVertex[]>;
    parseHeader(buffer: ArrayBuffer): CompressedHeader;
    parseMetadata(buffer: ArrayBuffer): CompressedMetadata | null;
    parseChunk(buffer: ArrayBuffer, chunkIndex: number): Promise<DecompressedGaussianVertex[]>;
    parseStream(stream: ReadableStream): AsyncGenerator<DecompressedGaussianVertex[]>;
    validate(buffer: ArrayBuffer): boolean;
    getInfo(buffer: ArrayBuffer): {
        algorithm: string;
        vertexCount: number;
        compressedSize: number;
        originalSize: number;
        compressionRatio: number;
        chunkCount: number;
    };
}

export class CompressedWriter {
    constructor(options?: CompressionOptions);
    write(vertices: DecompressedGaussianVertex[]): Promise<ArrayBuffer>;
    writeStream(vertices: AsyncIterable<DecompressedGaussianVertex[]>): Promise<ArrayBuffer>;
    compress(data: ArrayBuffer): Promise<ArrayBuffer>;
    quantize(vertices: DecompressedGaussianVertex[], params?: Partial<QuantizationParams>): ArrayBuffer;
    calculateOptimalQuantization(vertices: DecompressedGaussianVertex[]): QuantizationParams;
}

export function compressGaussians(
    vertices: DecompressedGaussianVertex[], 
    options?: CompressionOptions
): Promise<ArrayBuffer>;

export function decompressGaussians(
    buffer: ArrayBuffer, 
    options?: DecompressionOptions
): Promise<DecompressedGaussianVertex[]>;

export function getCompressionInfo(buffer: ArrayBuffer): {
    algorithm: string;
    vertexCount: number;
    ratio: number;
    originalSize: number;
    compressedSize: number;
    hasQuantization: boolean;
    chunkCount: number;
};

export function validateCompressed(buffer: ArrayBuffer): boolean;
export function estimateCompressionRatio(vertices: DecompressedGaussianVertex[], algorithm?: CompressionAlgorithm): number;

export default CompressedParser;