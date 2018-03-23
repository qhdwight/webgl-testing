const vertexShaderSource = `
    attribute vec4 a_VertexPosition;
    uniform mat4 u_ModelViewProjectionMatrix;
    void main(void) {
        gl_Position = u_ModelViewProjectionMatrix * a_VertexPosition;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform float u_Time;
    void main(void) {
        gl_FragColor = vec4(0.0, 0.2, 1.0, 1.0);
    }
`;

const shaders = {
    'standardVertex' : { type : 'vertex'  , source : vertexShaderSource   },
    'flatFragment'   : { type : 'fragment', source : fragmentShaderSource }
}

const cubeIndices = [
     0,  1,  2,    0,  2,  3,   // Front
     4,  5,  6,    4,  6,  7,   // Back
     8,  9, 10,    8, 10, 11,   // Top
    12, 13, 14,   12, 14, 15,   // Bottom
    16, 17, 18,   16, 18, 19,   // Right
    20, 21, 22,   20, 22, 23,   // Left
];

const cubeVertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];

var game;

const fov = 45 * Math.PI / 180;
const closeZ = 0.1;
const farZ = 500.0;

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
    subtract(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
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
        l.data[ 3] = -s.dot(eye);
        l.data[ 4] =  s.y;
        l.data[ 5] =  u.y;
        l.data[ 6] = -f.y;
        l.data[ 7] = -u.dot(eye);
        l.data[ 8] =  s.z;
        l.data[ 9] =  u.z;
        l.data[10] = -f.z;
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
                p += this.data[i * this.rows + j];
            }
            p += ']\n'
        }
        console.log(p);
    }
}

class Shader {
    constructor(name) {
        this.name = name;
        this.glShader = this.compile();
    }
    compile() {
        const shaderData = shaders[this.name];
        const glShader = game.gl.createShader(shaderData.type == 'vertex' ? game.gl.VERTEX_SHADER : game.gl.FRAGMENT_SHADER);
        game.gl.shaderSource(glShader, shaders[this.name].source);
        game.gl.compileShader(glShader);
        if (!game.gl.getShaderParameter(glShader, game.gl.COMPILE_STATUS)) {
            console.log('An error ocurred while compiling the ' + shaderData.type + ' shader with name: ' + this.name)
            console.log('Shader compile log for ' + shaderData.type + ' shader named ' + this.name + ': ' + game.gl.getShaderInfoLog(glShader));
            game.gl.deleteShader(glShader);
            return null;
        } else {
            console.log('Successfully compiled ' + shaderData.type + ' shader with name: ' + this.name);
        }
        return glShader;
    }
}

class ShaderProgram {
    constructor(vertexShader, fragmentShader) {
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.glProgram = this.link();
    }
    link() {
        const glProgram = game.gl.createProgram();
        game.gl.attachShader(glProgram, this.vertexShader.glShader);
        game.gl.attachShader(glProgram, this.fragmentShader.glShader);
        game.gl.linkProgram(glProgram);
        if (!game.gl.getProgramParameter(glProgram, game.gl.LINK_STATUS)) {
            console.log('An error ocurred while linking the program with shader names: ' + this.vertexShader.name + ', ' + this.fragmentShader.name);
            console.log('Shader pogram linking log for program with names: ' + this.vertexShader.name + ', ' + this.fragmentShader.name + ': ' + game.gl.getProgramInfoLog(glProgram));
            gl.deleteProgram(glProgram);
            return null;
        } else {
            console.log('Successfully linked shader program with names: ' + this.vertexShader.name + ', ' + this.fragmentShader.name)
        }
        return glProgram;
    }
}

var then = 0;

function renderScene(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    game.fpsText.innerHTML = 'FPS: ' + (1 / deltaTime).toFixed(0);
    game.time += deltaTime;
    game.gl.viewport(0, 0, game.gameCanvas.width, game.gameCanvas.height);
    game.gl.clear(game.gl.COLOR_BUFFER_BIT | game.gl.DEPTH_BUFFER_BIT);
    const aspect = game.gameCanvas.width / game.gameCanvas.height;
    const modelMatrix = Mat.identity(4);
    const viewMatrix = Mat.lookAt(new Vec3(4, 3, -3), Vec3.empty(), Vec3.up());
    const projectionMatrix = Mat.perspective(fov, aspect, closeZ, farZ);
    const modelViewProjectionMatrix = projectionMatrix.multiply(viewMatrix).multiply(modelMatrix);
    game.gl.useProgram(game.program.glProgram);
    const timePos = game.gl.getUniformLocation(game.program.glProgram, 'u_Time');
    const modelViewProjectionMatrixPos = game.gl.getUniformLocation(game.program.glProgram, 'u_ModelViewProjectionMatrix');
    game.gl.uniform1f(timePos, game.time);
    game.gl.uniformMatrix4fv(modelViewProjectionMatrixPos, false, modelViewProjectionMatrix.data);
    game.scene.render();
    requestAnimationFrame(renderScene);
}

class Game {
    constructor() {
        game = this;
        this.time = 0;
        this.gameCanvas = document.getElementById('gameCanvas');
        this.fpsText = document.getElementById('fps');
        window.addEventListener('resize', this.onResize)
        this.onResize();
        this.gl = this.gameCanvas.getContext('webgl');
        if (!this.gl) {
            console.log('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }
        this.configGL();
        this.initShaders();
        this.initScene();
        requestAnimationFrame(renderScene);
    }
    configGL() {
        this.gl.clearColor(0.0, 0.0, 0.2, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
    }
    initShaders() {
        const vertexShader = new Shader('standardVertex');
        const fragmentShader = new Shader('flatFragment');
        this.program = new ShaderProgram(vertexShader, fragmentShader);
    }
    initScene() {
        this.scene = new Scene();
        const cubeMesh = new Mesh(cubeVertices, cubeIndices, []);
        const cube = new RenderableSceneObject(new Vec3(0, 0, 0), new Vec3(0, 0, 0), cubeMesh);
        this.scene.addSceneObject(cube)
    }
    onResize() {
        this.gameCanvas.width = window.innerWidth;
        this.gameCanvas.height = window.innerHeight;
    }
}

class Mesh {
    constructor(vertices, indices, uvs) {
        this.vertices = vertices;
        this.indices = indices;
        this.uvs = uvs;
    }
    addVertex(vertex) {
        this.vertices.push(vertex);
    }
    addIndices(index) {
        this.indices.push(face);
    }
    addUV(uv) {
        this.uvs.push(uv);
    }
}

class Scene {
    constructor() {
        this.sceneObjects = [];
    }
    addSceneObject(sceneObject) {
        this.sceneObjects.push(sceneObject);
    }
    render() {
        for (var i = 0; i < this.sceneObjects.length; i++) {
            this.sceneObjects[i].render();
        }
    }
}

class SceneObject {
    constructor() {
    }
}

class SpacialSceneObject extends SceneObject {
    constructor(pos, rot) {
        super();
        this.pos = pos;
        this.rot = rot;
    }
}

class RenderableSceneObject extends SpacialSceneObject {
    constructor(pos, rot, mesh) {
        super(pos, rot)
        this.mesh = mesh;
        this.bindBuffers();
    }
    bindBuffers() {
        this.vertexBuffer = game.gl.createBuffer();
        game.gl.bindBuffer(game.gl.ARRAY_BUFFER, this.vertexBuffer);
        game.gl.bufferData(game.gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), game.gl.STATIC_DRAW);   
        this.indexBuffer = game.gl.createBuffer();
        game.gl.bindBuffer(game.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        game.gl.bufferData(game.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), game.gl.STATIC_DRAW);
    }
    render() {
        game.gl.bindBuffer(game.gl.ARRAY_BUFFER, this.vertexBuffer);
        game.gl.vertexAttribPointer(0, 3, game.gl.FLOAT, false, 0, 0);
        game.gl.enableVertexAttribArray(0);
        game.gl.bindBuffer(game.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        game.gl.drawElements(game.gl.TRIANGLES, 36, game.gl.UNSIGNED_SHORT, 0);
        game.gl.disableVertexAttribArray(0);
    }
}

new Game();