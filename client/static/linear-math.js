class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static empty() {
        return new Vec3(0, 0, 0);
    }
    static up() {
        return new Vec3(0, 1, 0);
    }
    addTo(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    }
    add(v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    subtract(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    multiply(c) {
        return new Vec3(this.x * c, this.y * c, this.z * c);
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalize() {
        const magnitudeRecip = 1 / this.magnitude();
        this.x *= magnitudeRecip;
        this.y *= magnitudeRecip;
        this.z *= magnitudeRecip;
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        )
    }
}

class Mat {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
    }   
    multiply(m) {
        const p = Mat.empty(this.rows, m.columns);
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < m.columns; j++) {
                for (var k = 0; k < this.columns; k++) {
                    p.data[i + this.columns * j] += this.data[i + this.columns * k] * m.data[k + m.columns * j];
                }
            }
        }
        return p;
    }
    static empty(rows, columns) {
        const e = new Mat(rows, columns)
        e.data = new Float32Array(rows * columns);
        return e;
    }
    static identity(size) {
        const im = Mat.empty(size, size);
        for (var i = 0; i < size; i++) {
            im.data[i + i * size] = 1;
        }
        return im;
    }
    static perspective(fov, aspect, near, far) {
        const r = Mat.empty(4, 4);
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        r.data[ 0] = f / aspect;
        r.data[ 5] = f;
        r.data[10] = (far + near) * nf;
        r.data[11] = -1;
        r.data[14] = 2 * far * near * nf;
        return r;
    }
    static lookAt(eye, center, up) {
        const l = Mat.empty(4, 4);
        const f = center.subtract(eye);
        f.normalize();
        const s = f.cross(up);
        s.normalize();
        const u = s.cross(f);
        l.data[ 0] =  s.x;
        l.data[ 1] =  u.x;
        l.data[ 2] = -f.x;  
        l.data[ 4] =  s.y;
        l.data[ 5] =  u.y;
        l.data[ 6] = -f.y;
        l.data[ 8] =  s.z;
        l.data[ 9] =  u.z;
        l.data[10] = -f.z;
        l.data[12] = -s.dot(eye);
        l.data[13] = -u.dot(eye);
        l.data[14] =  f.dot(eye);
        l.data[15] =  1;
        return l;
    }
    print() {
        var p = '';
        for (var i = 0; i < this.rows; i++) {
            p += '[';
            for (var j = 0; j < this.columns; j++) {
                if (j != 0) p += ',';
                p += this.data[i * this.rows + j].toFixed(4);
            }
            p += ']\n'
        }
        console.log(p);
    }
}