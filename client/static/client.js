var game;

const fov = 60 * Math.PI / 180;
const closeZ = 0.1;
const farZ = 500;
const fixedUpdateRate = 1 / 30;
const mouseSensitivity = 0.002;
const moveSpeed = 0.1;

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
        } else {
            console.log('OpenGL Version: ' + this.gl.getParameter(this.gl.VERSION));
            console.log('GLSL Shading Language: ' + this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION));
            this.configGL();
            this.initShaders();
            this.initScene();
            this.initInput();
            this.localPlayer = new Player(new Vec3(0, 0, 0), new Vec3(0, 0, 0));
            requestAnimationFrame(game.renderScene);
            setInterval(this.fixedUpdate, fixedUpdateRate);
        }
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
        const cubeMesh = new Mesh(cubeVertices, cubeIndices, cubeNormals, []);
        const cube = new RenderableSceneObject(new Vec3(0, 0, 0), new Vec3(0, 0, 0), cubeMesh);
        this.scene.addSceneObject(cube)
    }
    initInput() {
        this.inputs = { 87 : false, 83 : false, 68 : false, 65: false };
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('click', this.onClick);
        document.addEventListener('mousemove', this.onMouseMove);
    }
    onResize() {
        this.gameCanvas.width = window.innerWidth;
        this.gameCanvas.height = window.innerHeight;
    }
    onKeyDown(event) {
        if (game.inputs[event.keyCode] !== undefined)
            game.inputs[event.keyCode] = true;
    }
    onKeyUp(event) {
        if (game.inputs[event.keyCode] !== undefined)
            game.inputs[event.keyCode] = false;
    }
    getKey(keyCode) {
        return game.inputs[keyCode] === undefined ? false : game.inputs[keyCode];
    }
    onClick(event) {
        game.gameCanvas.requestPointerLock();
    }
    onMouseMove(event) {
        game.localPlayer.rot.addTo(new Vec3(-event.movementY*mouseSensitivity, 0, -event.movementX*mouseSensitivity));
        // if (this.mouseX && this.mouseY)
        //     game.localPlayer.rot.addTo(new Vec3((this.mouseY - event.pageY)*mouseSensitivity, 0, (this.mouseX - event.pageX)*mouseSensitivity));
        // this.mouseX = event.pageX;
        // this.mouseY = event.pageY;
    }
    fixedUpdate() {
        const forwardInput = game.getKey(87) ? 1 : 0 + game.getKey(83) ? -1 : 0;
        const lateralInput = game.getKey(68) ? 1 : 0 + game.getKey(65) ? -1 : 0;
        game.localPlayer.pos.addTo(game.localPlayer.forward().multiply(forwardInput * moveSpeed));
        game.localPlayer.pos.addTo(game.localPlayer.right().multiply(lateralInput * moveSpeed));
    }
    renderScene(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        game.fpsText.innerHTML = 'FPS: ' + (1 / deltaTime).toFixed(0);
        game.time += deltaTime;
        game.gl.viewport(0, 0, game.gameCanvas.width, game.gameCanvas.height);
        game.gl.clear(game.gl.COLOR_BUFFER_BIT | game.gl.DEPTH_BUFFER_BIT);
        const aspect = game.gameCanvas.width / game.gameCanvas.height;
        const modelMatrix = Mat.identity(4);
        const pos = game.localPlayer.pos;
        const forward = game.localPlayer.forward();
        const viewMatrix = Mat.lookAt(pos, pos.add(forward), Vec3.up());
        const projectionMatrix = Mat.perspective(fov, aspect, closeZ, farZ);
        const modelViewProjectionMatrix = projectionMatrix.multiply(viewMatrix).multiply(modelMatrix);
        game.gl.useProgram(game.program.glProgram);
        const timePos = game.gl.getUniformLocation(game.program.glProgram, 'u_Time');
        const modelViewMatrixPos = game.gl.getUniformLocation(game.program.glProgram, 'u_ModelViewMatrix');
        const modelViewProjectionMatrixPos = game.gl.getUniformLocation(game.program.glProgram, 'u_ModelViewProjectionMatrix');
        game.gl.uniform1f(timePos, game.time);
        game.gl.uniformMatrix4fv(modelViewMatrixPos, false, viewMatrix.multiply(modelMatrix).data);
        game.gl.uniformMatrix4fv(modelViewProjectionMatrixPos, false, modelViewProjectionMatrix.data);
        game.scene.render();
        requestAnimationFrame(game.renderScene);
    }
}


class Mesh {
    constructor(vertices, indices, normals, uvs) {
        this.vertices = vertices;
        this.indices = indices;
        this.normals = normals;
        this.uvs = uvs;
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
    forward() {
        return new Vec3(
            Math.cos(this.rot.x) * Math.sin(this.rot.z),
            Math.sin(this.rot.x),
            Math.cos(this.rot.x) * Math.cos(-this.rot.z));
    }
    right() {
        return new Vec3(
            Math.sin(this.rot.z - Math.PI / 2),
            0,
            Math.cos(this.rot.z - Math.PI / 2));
    }
}

class RenderableSceneObject extends SpacialSceneObject {
    constructor(pos, rot, mesh) {
        super(pos, rot);
        this.mesh = mesh;
        this.bindBuffers();
    }
    bindBuffers() {
        if (this.mesh) {
            this.vertexBuffer = game.gl.createBuffer();
            game.gl.bindBuffer(game.gl.ARRAY_BUFFER, this.vertexBuffer);
            game.gl.bufferData(game.gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), game.gl.STATIC_DRAW);   
            this.normalBuffer = game.gl.createBuffer();
            game.gl.bindBuffer(game.gl.ARRAY_BUFFER, this.normalBuffer);
            game.gl.bufferData(game.gl.ARRAY_BUFFER, new Float32Array(this.mesh.normals), game.gl.STATIC_DRAW);
            this.indexBuffer = game.gl.createBuffer();
            game.gl.bindBuffer(game.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            game.gl.bufferData(game.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), game.gl.STATIC_DRAW);
        }
    }
    render() {
        game.gl.bindBuffer(game.gl.ARRAY_BUFFER, this.vertexBuffer);
        game.gl.vertexAttribPointer(0, 3, game.gl.FLOAT, false, 0, 0);
        game.gl.enableVertexAttribArray(0);
        game.gl.bindBuffer(game.gl.ARRAY_BUFFER, this.normalBuffer);
        game.gl.vertexAttribPointer(1, 3, game.gl.FLOAT, false, 0, 0);
        game.gl.enableVertexAttribArray(1);
        game.gl.bindBuffer(game.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        game.gl.drawElements(game.gl.TRIANGLES, 36, game.gl.UNSIGNED_SHORT, 0);
        game.gl.disableVertexAttribArray(0);
        game.gl.disableVertexAttribArray(1);
    }
}

class Player extends RenderableSceneObject {
    constructor(pos, rot) {
        super(pos, rot, null);
    }
}

new Game();