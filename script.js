import * as THREE from 'https://unpkg.com/three@0.139.1/build/three.module.js';

const canvasEl = document.querySelector('#canvas');

const pointer = {
    x: .5,
    y: .6,
    moved: false,
    speed: 0,
    vanishMode: false,
    drawingAllowed: true,
};

window.setTimeout(() => {
    pointer.x = .7;
    pointer.y = .5;
    pointer.moved = true;
}, 100);

let basicMaterial, shaderMaterial;

let renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

let sceneShader = new THREE.Scene();
let sceneBasic = new THREE.Scene();
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
let clock = new THREE.Clock();

let renderTargets = [
    new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
    new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)
];

createPlane();
updateSize();
window.addEventListener("resize", updateSize);

render();

/* ========================= */
/* INTERACTION */
/* ========================= */

window.addEventListener("mousemove", (e) => {
    pointer.moved = true;

    const dx = 12 * (e.pageX / window.innerWidth - pointer.x);
    const dy = 12 * (e.pageY / window.innerHeight - pointer.y);

    pointer.x = e.pageX / window.innerWidth;
    pointer.y = e.pageY / window.innerHeight;

    pointer.speed = Math.min(2, dx * dx + dy * dy);
});

window.addEventListener("touchmove", (e) => {
    pointer.moved = true;

    const t = e.targetTouches[0];

    const dx = 5 * (t.pageX / window.innerWidth - pointer.x);
    const dy = 5 * (t.pageY / window.innerHeight - pointer.y);

    pointer.x = t.pageX / window.innerWidth;
    pointer.y = t.pageY / window.innerHeight;

    pointer.speed = Math.min(2, dx * dx + dy * dy);
});

/* ========================= */
/* THREE SETUP */
/* ========================= */

function createPlane() {
    shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_stop_time: { value: 0. },
            u_point: { value: new THREE.Vector2(pointer.x, pointer.y) },
            u_moving: { value: 0. },
            u_speed: { value: 0. },
            u_stop_randomizer: { value: new THREE.Vector2(Math.random(), Math.random()) },
            u_clean: { value: 1. },
            u_ratio: { value: window.innerWidth / window.innerHeight },
            u_texture: { value: null }
        },
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent
    });

    basicMaterial = new THREE.MeshBasicMaterial();

    const geometry = new THREE.PlaneGeometry(2, 2);

    sceneShader.add(new THREE.Mesh(geometry, shaderMaterial));
    sceneBasic.add(new THREE.Mesh(geometry, basicMaterial));
}

/* ========================= */
/* RENDER */
/* ========================= */

function render() {
    requestAnimationFrame(render);

    shaderMaterial.uniforms.u_point.value.set(pointer.x, 1 - pointer.y);
    shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture;
    shaderMaterial.uniforms.u_ratio.value = window.innerWidth / window.innerHeight;

    if (pointer.moved) {
        shaderMaterial.uniforms.u_moving.value = 1.;
        shaderMaterial.uniforms.u_stop_randomizer.value.set(Math.random(), Math.random());
        shaderMaterial.uniforms.u_stop_time.value = 0.;
        pointer.moved = false;
    } else {
        shaderMaterial.uniforms.u_moving.value = 0.;
    }

    shaderMaterial.uniforms.u_stop_time.value += clock.getDelta();
    shaderMaterial.uniforms.u_speed.value = pointer.speed;

    renderer.setRenderTarget(renderTargets[1]);
    renderer.render(sceneShader, camera);

    basicMaterial.map = renderTargets[1].texture;

    renderer.setRenderTarget(null);
    renderer.render(sceneBasic, camera);

    let temp = renderTargets[0];
    renderTargets[0] = renderTargets[1];
    renderTargets[1] = temp;
}

/* ========================= */
/* RESIZE */
/* ========================= */

function updateSize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    shaderMaterial.uniforms.u_ratio.value = window.innerWidth / window.innerHeight;
}