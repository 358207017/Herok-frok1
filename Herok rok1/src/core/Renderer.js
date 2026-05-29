export class Renderer {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.config = config;
        this.gl = null;
        this.program = null;
        this.vertexBuffer = null;
        this.instanceBuffer = null;
        this.renderScale = 1.0;
        
        this.vertexShaderSource = `#version 300 es
            in vec2 a_position;
            in vec3 a_center;
            in vec4 a_color;
            in float a_scale;
            
            uniform mat4 u_viewProjection;
            uniform vec3 u_cameraPos;
            
            out vec4 v_color;
            
            void main() {
                vec3 camDir = normalize(a_center - u_cameraPos);
                vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), camDir));
                vec3 up = cross(camDir, right);
                
                vec2 offset = a_position * a_scale;
                vec3 worldPos = a_center + right * offset.x + up * offset.y;
                
                vec4 clipPos = u_viewProjection * vec4(worldPos, 1.0);
                gl_Position = clipPos;
                
                float size = 400.0 / clipPos.w;
                gl_PointSize = clamp(size, 8.0, 200.0);
                
                v_color = a_color;
            }
        `;
        
        this.fragmentShaderSource = `#version 300 es
            precision highp float;
            
            in vec4 v_color;
            out vec4 outColor;
            
            void main() {
                vec2 coord = gl_PointCoord * 2.0 - 1.0;
                float r2 = dot(coord, coord);
                if (r2 > 1.0) discard;
                
                float alpha = exp(-2.0 * r2) * v_color.a;
                outColor = vec4(v_color.rgb, alpha);
            }
        `;
    }
    
    async init() {
        this.gl = this.canvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            depth: false,
            powerPreference: 'high-performance'
        });
        
        if (!this.gl) {
            throw new Error('WebGL2 is not supported');
        }
        
        this.program = this.createProgram();
        this.createGeometry();
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clearColor(
            this.config.backgroundColor?.[0] || 0,
            this.config.backgroundColor?.[1] || 0,
            this.config.backgroundColor?.[2] || 0,
            this.config.backgroundColor?.[3] || 1
        );
        
        return true;
    }
    
    createProgram() {
        const vs = this.compileShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Shader program link failed');
        }
        
        return program;
    }
    
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compile failed: ${info}`);
        }
        
        return shader;
    }
    
    createGeometry() {
        const vertices = new Float32Array([
            -1, -1,  1, -1,  1,  1,
            -1, -1,  1,  1, -1,  1
        ]);
        
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }
    
    render(gaussians, viewProjectionMatrix, cameraPos) {
        const gl = this.gl;
        const count = gaussians.length;
        
        if (count === 0) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }
        
        const width = this.canvas.width * this.renderScale;
        const height = this.canvas.height * this.renderScale;
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        
        const vpLoc = gl.getUniformLocation(this.program, 'u_viewProjection');
        gl.uniformMatrix4fv(vpLoc, false, viewProjectionMatrix);
        
        const camLoc = gl.getUniformLocation(this.program, 'u_cameraPos');
        gl.uniform3fv(camLoc, [cameraPos.x, cameraPos.y, cameraPos.z]);
        
        this.updateInstanceBuffer(gaussians);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 0);
        gl.vertexAttribDivisor(1, 1);
        
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 12);
        gl.vertexAttribDivisor(2, 1);
        
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 40, 28);
        gl.vertexAttribDivisor(3, 1);
        
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    }
    
    updateInstanceBuffer(gaussians) {
        const data = new Float32Array(gaussians.length * 10);
        
        for (let i = 0; i < gaussians.length; i++) {
            const g = gaussians[i];
            const offset = i * 10;
            
            data[offset] = g.x;
            data[offset + 1] = g.y;
            data[offset + 2] = g.z;
            data[offset + 3] = g.r;
            data[offset + 4] = g.g;
            data[offset + 5] = g.b;
            data[offset + 6] = g.a !== undefined ? g.a : 1.0;
            data[offset + 7] = g.scale || 0.1;
            data[offset + 8] = g.nx || 0;
            data[offset + 9] = g.ny || 0;
        }
        
        if (!this.instanceBuffer) {
            this.instanceBuffer = this.gl.createBuffer();
        }
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
    }
    
    setRenderScale(scale) {
        this.renderScale = Math.max(0.25, Math.min(1.0, scale));
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width * this.renderScale, height * this.renderScale);
    }
    
    getGPUInfo() {
        const gl = this.gl;
        return {
            renderer: gl.getParameter(gl.RENDERER),
            vendor: gl.getParameter(gl.VENDOR),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
        };
    }
    
    dispose() {
        const gl = this.gl;
        gl.deleteProgram(this.program);
        gl.deleteBuffer(this.vertexBuffer);
        if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
    }
}

export default Renderer;