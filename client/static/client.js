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

class Game {
    constructor() {
        this.gameCanvas = document.getElementById('gameCanvas');
        window.addEventListener('resize', this.onResize)
        this.onResize();
        this.gl = this.gameCanvas.getContext('webgl');
        if (!this.gl) {
            console.log("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        this.initGL();
        this.initScene();
    }
    initGL() {
        this.gl.clearColor(0.0, 0.0, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    }
    initScene() {
        var scene = new Scene();
        var cubeMesh = new Mesh(cubeVertices, cubeIndices, []);
        var cube = new RenderableSceneObject(this, new Vec([0, 0, 0]), new Vec([0, 0, 0]), cubeMesh);
        scene.addSceneObject(cube)
    }
    onResize() {
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;
    }
}

class Vec {
    constructor(data) {
        this.data = data;
    }
}

class Mat {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.data = []
    }
    static multiply(m1, m2) {
        p = new Mat(m1.rows, m2.columns);
        for (var i = 0; i < m1.rows; i++) {
            for (var j = 0; j < m2.columns; j++) {
                for (var k = 0; k < m1.columns; k++) {
                    p.data[i][j] += m1.data[i][k] * m2.data[k][i];
                }
            }
        }
        return p;
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
    constructor(game) {
        this.game = game;
    }
}

class SpacialSceneObject extends SceneObject {
    constructor(game, pos, rot) {
        super(game);
        this.pos = pos;
        this.rot = rot;
    }
}

class RenderableSceneObject extends SpacialSceneObject {
    constructor(game, pos, rot, mesh) {
        super(game, pos, rot)
        this.mesh = mesh;
        this.bindBuffers();
    }
    bindBuffers() {
        this.vertexBuffer = this.game.gl.createBuffer();
        this.game.gl.bindBuffer(this.game.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.game.gl.bufferData(this.game.gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), this.game.gl.STATIC_DRAW);   
        this.indexBuffer = this.game.gl.createBuffer();
        this.game.gl.bindBuffer(this.game.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.game.gl.bufferData(this.game.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), this.game.gl.STATIC_DRAW);
    }
}

var game = new Game();