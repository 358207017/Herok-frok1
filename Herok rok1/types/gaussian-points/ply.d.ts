/**
 * PLY (Polygon File Format) Type Definitions for Gaussian Points
 * @version 1.0.0
 */

export interface PLYHeader {
    format: 'ascii' | 'binary_little_endian' | 'binary_big_endian';
    version: string;
    elements: PLYElement[];
    comments: string[];
    objInfo: string[];
}

export interface PLYElement {
    name: string;
    count: number;
    properties: PLYProperty[];
}

export interface PLYProperty {
    name: string;
    type: PLYDataType;
    isList?: boolean;
    listCountType?: PLYDataType;
}

export type PLYDataType = 
    | 'char' | 'uchar' 
    | 'short' | 'ushort' 
    | 'int' | 'uint' 
    | 'float' | 'double'
    | 'int8' | 'uint8'
    | 'int16' | 'uint16'
    | 'int32' | 'uint32'
    | 'float32' | 'float64';

export interface PLYGaussianVertex {
    x: number;
    y: number;
    z: number;
    nx?: number;
    ny?: number;
    nz?: number;
    red?: number;
    green?: number;
    blue?: number;
    alpha?: number;
    scale?: number;
    confidence?: number;
    [key: string]: number | undefined;
}

export interface PLYParserOptions {
    skipHeader?: boolean;
    maxVertices?: number;
    validateData?: boolean;
    normalizeColors?: boolean;
    defaultScale?: number;
}

export class PLYParser {
    constructor(options?: PLYParserOptions);
    parse(buffer: ArrayBuffer): Promise<PLYGaussianVertex[]>;
    parseHeader(buffer: ArrayBuffer): PLYHeader;
    parseVertices(buffer: ArrayBuffer, header: PLYHeader, maxCount?: number): PLYGaussianVertex[];
    validate(vertices: PLYGaussianVertex[]): boolean;
    getVertexCount(buffer: ArrayBuffer): number;
    getDataOffset(buffer: ArrayBuffer): number;
}

export function parsePLY(buffer: ArrayBuffer, options?: PLYParserOptions): Promise<PLYGaussianVertex[]>;
export function validatePLY(buffer: ArrayBuffer): boolean;
export function getPLYInfo(buffer: ArrayBuffer): {
    vertexCount: number;
    hasColors: boolean;
    hasNormals: boolean;
    format: string;
};

export default PLYParser;