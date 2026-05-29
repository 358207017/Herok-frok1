export class MathUtils {
    static identity(out = new Float32Array(16)) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    }
    
    static perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
        return out;
    }
    
    static lookAt(out, eye, center, up) {
        const zx = eye.x - center.x;
        const zy = eye.y - center.y;
        const zz = eye.z - center.z;
        let len = Math.hypot(zx, zy, zz);
        const zdir = { x: zx / len, y: zy / len, z: zz / len };
        
        const xdir = {
            x: up.y * zdir.z - up.z * zdir.y,
            y: up.z * zdir.x - up.x * zdir.z,
            z: up.x * zdir.y - up.y * zdir.x
        };
        len = Math.hypot(xdir.x, xdir.y, xdir.z);
        const xnorm = { x: xdir.x / len, y: xdir.y / len, z: xdir.z / len };
        
        const ydir = {
            x: zdir.y * xnorm.z - zdir.z * xnorm.y,
            y: zdir.z * xnorm.x - zdir.x * xnorm.z,
            z: zdir.x * xnorm.y - zdir.y * xnorm.x
        };
        
        out[0] = xnorm.x;
        out[1] = ydir.x;
        out[2] = zdir.x;
        out[3] = 0;
        out[4] = xnorm.y;
        out[5] = ydir.y;
        out[6] = zdir.y;
        out[7] = 0;
        out[8] = xnorm.z;
        out[9] = ydir.z;
        out[10] = zdir.z;
        out[11] = 0;
        out[12] = -(xnorm.x * eye.x + xnorm.y * eye.y + xnorm.z * eye.z);
        out[13] = -(ydir.x * eye.x + ydir.y * eye.y + ydir.z * eye.z);
        out[14] = -(zdir.x * eye.x + zdir.y * eye.y + zdir.z * eye.z);
        out[15] = 1;
        
        return out;
    }
    
    static multiplyMatrices(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        
        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        
        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        
        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        
        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        
        return out;
    }
    
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    static randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
}

export default MathUtils;