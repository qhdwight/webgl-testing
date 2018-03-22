var vertexShaderSource = `
    attribute vec4 a_VertexPosition;
    uniform mat4 u_ModelViewProjectionMatrix;
    void main(void) {
        gl_Position = u_ModelViewProjectionMatrix * a_VertexPosition;
    }
`;

const fragmentShaderSource = `
    void main(void) {
        gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
    }
`;

var cubeIndices = [
     0,  1,  2,      0,  2,  3,   // Front
     4,  5,  6,      4,  6,  7,   // Back
     8,  9, 10,      8, 10, 11,   // Top
    12, 13, 14,     12, 14, 15,   // Bottom
    16, 17, 18,     16, 18, 19,   // Right
    20, 21, 22,     20, 22, 23,   // Left
];

var cubeVertices = [
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

var gl;

var fov = 45 * Math.PI / 180;

class Vec {
    constructor(data) {
        this.data = data;
    }
}

class Mat {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.data = new Float32Array(rows * columns);
    }
    static multiply(m1, m2) {
        p = new Mat(m1.rows, m2.columns);
        for (var i = 0; i < m1.rows; i++) {
            for (var j = 0; j < m2.columns; j++) {
                for (var k = 0; k < m1.columns; k++) {
                    p.data[m1.rows * i + j] += m1.data[m1.rows * i + k] * m2.data[m2.rows * k + i];
                }
            }
        }
        return p;
    }
    static perspective(fov, aspect, near, far) {
        var r = new Mat(4, 4);
        var f = 1.0 / Math.tan(fov / 2);
        var nf = 1 / (near - far);
        r.data[ 0] = f / aspect;
        r.data[ 5] = f;
        r.data[10] = (far + near) * nf;
        r.data[11] = -1;
        r.data[14] = 2 * far * near * nf;
        return r;
    }
}

class Game {
    constructor() {
        this.gameCanvas = document.getElementById('gameCanvas');
        window.addEventListener('resize', this.onResize)
        this.onResize();
        gl = this.gameCanvas.getContext('webgl');
        if (!gl) {
            console.log("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        // var aspect = this.gameCanvas.width / this.gameCanvas.height;
        // var closeZ = 0.1;
        // var farZ = 100.0;
        // console.log(Mat.perspective(fov, aspect, closeZ, farZ).data);
        this.initScene();
    }
    initScene() {
        var scene = new Scene();
        var cubeMesh = new Mesh(cubeVertices, cubeIndices, []);
        var cube = new RenderableSceneObject(new Vec([0, 0, 0]), new Vec([0, 0, 0]), cubeMesh);
        scene.addSceneObject(cube)
    }
    onResize() {
        this.gameCanvas.width = window.innerWidth;
        this.gameCanvas.height = window.innerHeight;
    }
    renderScene() {
        gl.clearColor(0.0, 0.0, 0.2, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var aspect = this.gameCanvas.width / this.gameCanvas.height;
        var closeZ = 0.1;
        var farZ = 100.0;
        var perspectiveMatrix = Mat.perspective(fov, aspect, closeZ, farZ);
    }
}

class Mesh {
    constructor(verticies, indices, uvs) {
        this.verticies = verticies;
        this.indices = indices;
        this.uvs = uvs;
    }
    addVertex(vertex) {
        this.verticies.push(vertex);
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
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), gl.STATIC_DRAW);   
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), gl.STATIC_DRAW);
    }
}

new Game();