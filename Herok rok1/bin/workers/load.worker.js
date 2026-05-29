/**
 * Herok Rok1 Load Worker
 * Handles data loading in background thread
 */

self.onmessage = async function(e) {
    const { url, chunkId, format } = e.data;
    
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        
        let data;
        
        switch(format) {
            case 'ply':
                data = parsePLY(buffer);
                break;
            case 'splat':
                data = parseSPLAT(buffer);
                break;
            default:
                data = { gaussians: [] };
        }
        
        self.postMessage({
            chunkId: chunkId,
            success: true,
            data: data
        });
    } catch (error) {
        self.postMessage({
            chunkId: chunkId,
            success: false,
            error: error.message
        });
    }
};

function parsePLY(buffer) {
    const view = new DataView(buffer);
    const text = new TextDecoder().decode(buffer.slice(0, 4096));
    
    const vertexMatch = text.match(/element vertex (\d+)/);
    const vertexCount = vertexMatch ? parseInt(vertexMatch[1]) : 0;
    
    const headerEnd = text.indexOf('end_header');
    let dataOffset = headerEnd;
    while (dataOffset < buffer.byteLength && text[dataOffset] !== '\n') {
        dataOffset++;
    }
    dataOffset++;
    
    const gaussians = [];
    const stride = 32;
    
    for (let i = 0; i < vertexCount; i++) {
        const offset = dataOffset + i * stride;
        if (offset + stride > buffer.byteLength) break;
        
        gaussians.push({
            x: view.getFloat32(offset, true),
            y: view.getFloat32(offset + 4, true),
            z: view.getFloat32(offset + 8, true),
            r: view.getUint8(offset + 24) / 255,
            g: view.getUint8(offset + 25) / 255,
            b: view.getUint8(offset + 26) / 255,
            scale: view.getFloat32(offset + 28, true)
        });
    }
    
    return { gaussians };
}

function parseSPLAT(buffer) {
    const view = new DataView(buffer);
    const count = view.getUint32(0, true);
    const gaussians = [];
    
    for (let i = 0; i < count; i++) {
        const offset = 4 + i * 32;
        
        gaussians.push({
            x: view.getFloat32(offset, true),
            y: view.getFloat32(offset + 4, true),
            z: view.getFloat32(offset + 8, true),
            r: view.getFloat32(offset + 12, true),
            g: view.getFloat32(offset + 16, true),
            b: view.getFloat32(offset + 20, true),
            a: view.getFloat32(offset + 24, true),
            scale: view.getFloat32(offset + 28, true)
        });
    }
    
    return { gaussians };
}