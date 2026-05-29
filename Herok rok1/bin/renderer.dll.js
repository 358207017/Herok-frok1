/**
 * Herok Rok1 Renderer DLL
 * Dynamic library for rendering functionality
 */

export const RendererDLL = {
    version: '1.0.0',
    
    shaders: {
        vertex: {
            source: null,
            compile: (source) => {
                RendererDLL.shaders.vertex.source = source;
                return true;
            }
        },
        
        fragment: {
            source: null,
            compile: (source) => {
                RendererDLL.shaders.fragment.source = source;
                return true;
            }
        }
    },
    
    pipelines: {
        create: (config) => {
            return {
                id: Math.random(),
                config: config,
                active: true
            };
        },
        
        destroy: (pipeline) => {
            pipeline.active = false;
        }
    },
    
    textures: {
        create: (width, height, data) => {
            return {
                id: Math.random(),
                width, height,
                data: data || null
            };
        },
        
        destroy: (texture) => {
            texture.data = null;
        }
    }
};

export default RendererDLL;