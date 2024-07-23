/**
 * WebGL Snow Particles Background
 * Author: Lahkro
 * 
 * A snowfall particle simulation using the three.js(https://threejs.org/) (r144) WebGL library.
 * This was created for use in tadmozeltov's (https://git.tadmozeltov.com/tadmozeltov/secret-santa) 
 * Secret Santa "Meowmas" web application (https://santa.tadmozeltov.com/)
 * 
 */

import WebGL from "./utils/WebGL.js";
import vertexShader from "./shaders/vertex.js"
import fragmentShader from "./shaders/fragment.js"

// OPTIONS CONFIGURATION //
const options = {
	backgroundColor: '#0A0E10',
	fog: true,
	fogRange: 80,
	particleCount: 2000,
	ratio: 0.05,
	snowSize: 2,
	spriteSize: 3,
	sizeAttenuation: true,
	alphaTest: 0.85,
	cameraPositionZ: 100,
	rangeX: 400,
	rangeY: 400,
	rangeZ: 100,
	velocityY: 2,
	amplitudeX: 4,
	angleX: 0,
	snowSpritePath: './textures/snow.png',
	spritePath: './textures/OCTad_Xmas.png',
}

// Checks for WebGL support
if (WebGL.isWebGLAvailable()) {

	var windowWidth = window.visualViewport.width;
	var windowHeight = window.visualViewport.height;

	var windowAspectRatio = windowWidth/windowHeight

	var scale = windowHeight;

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(75, windowAspectRatio, 0.1, 1000);
	var renderer = new THREE.WebGLRenderer({antialias: true});

	var stats = new Stats();
	document.body.appendChild(stats.dom);

	init();
	render();

} else {

	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById('container').appendChild(warning);

}

// Initialize renderer
function init() {
	renderer.setSize(windowWidth, windowHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize);

	// GUI
	createGUI();
	
	console.table(options);
}

// Create and animate mesh/particle geometry and materials
var snowSprite, sprite;
var snowMat, spriteMat;

function render() {

	// Environment and Camera Settings
	scene.background = new THREE.Color(options.backgroundColor);
	if (options.fog) {scene.fog = new THREE.Fog(options.backgroundColor, options.fogRange, options.fogRange * 2)};
	camera.position.z = options.cameraPositionZ;

	// Load Sprite Textures
	snowSprite = new THREE.TextureLoader().load(options.snowSpritePath);
	sprite = new THREE.TextureLoader().load(options.spritePath);
	snowSprite.flipY = false;
	sprite.flipY = false;

	// Create Materials
	snowMat = newParticleMaterial(options.snowSize, snowSprite);
	spriteMat = newParticleMaterial(options.spriteSize, sprite);

	// Create Particle Systems
	const snowParticleSystem = newParticleSystem(snowMat, Math.round(options.particleCount * (1.0 - options.ratio)));
	const spriteParticleSystem = newParticleSystem(spriteMat, Math.round(options.particleCount * options.ratio));
	
	// Add to Render Scene
	scene.add(snowParticleSystem);
	scene.add(spriteParticleSystem);

	const clock = new THREE.Clock();
	const tick = () => // Update Loop
	{
		stats.update();

		const time = clock.getElapsedTime();

		snowMat.uniforms.uTime.value = time;
		spriteMat.uniforms.uTime.value = time;

		requestAnimationFrame(tick);
		renderer.render(scene, camera);
	}

	tick();
}

/**
 * Create a new buffer geometry particle system using custom particle shader material.
 *
 * @param {Three.ShaderMaterial} material - shader material to use for the particle system.
 * @param {int} particleCount - number of particles created in the particle system.
 * @returns {THREE.Points}
 */
function newParticleSystem (material, particleCount) {

	const bufferGeometry = new THREE.BufferGeometry();
	var scales = new Float32Array(particleCount).fill(scale);
	const position = [];
	const velocityY = [];
	const amplitudeX = [];
	const angleX = [];
	
	for (let i = 0; i < particleCount; i++) {

		const posOptions = [options.rangeX, options.rangeY, options.rangeZ];

		// Generate random positions based on range defined
		for (let j = 0; j < posOptions.length; j++) {
			position.push(THREE.MathUtils.randFloatSpread(posOptions[j]));
		}

		// Generate random velocities based on range defined
		const vY = THREE.MathUtils.randFloat(-options.velocityY - 1, Math.min(-options.velocityY + 1, 0));
		const aX = THREE.MathUtils.randFloat(Math.max(options.amplitudeX - 1, 0), options.amplitudeX + 1);
		const a = THREE.MathUtils.randFloat(options.angleX - 0.1, options.angleX + 0.1);
		
		velocityY.push(vY);
		amplitudeX.push(aX);
		angleX.push(a);
	}

	bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
	bufferGeometry.setAttribute('scale', new THREE.Float32BufferAttribute(scales, 1));
	bufferGeometry.setAttribute('velocityY', new THREE.Float32BufferAttribute(velocityY, 1));
	bufferGeometry.setAttribute('amplitudeX', new THREE.Float32BufferAttribute(amplitudeX, 1));
	bufferGeometry.setAttribute('angle', new THREE.Float32BufferAttribute(angleX, 1));

	return new THREE.Points(bufferGeometry, material);
}

/**
 * Returns custom shader material for particles
 *
 * @param {float} size - particle size.
 * @param {Three.Texture} sprite - particle sprite texture.
 * @returns {THREE.ShaderMaterial}
 */
function newParticleMaterial (size, sprite) {

	return new THREE.ShaderMaterial({
		uniforms: THREE.UniformsUtils.merge(
			[{
				uTime: { value: 0 },
				size: { value: size },
				rangeY: { value: options.rangeY },
				map: { value: sprite },
				alphaTest: { value: options.alphaTest },
			},
			THREE.UniformsLib['fog']]),

		defines: {
			USE_SIZEATTENUATION: options.sizeAttenuation,
		},

		vertexShader: vertexShader,
		fragmentShader: fragmentShader,

		transparent: true,
		fog: options.fog,
	});
}

function createGUI () {
	var gui = new dat.GUI();

	// SCENE //
	var view = gui.addFolder('Scene');
	view.add(options, "backgroundColor").onFinishChange(function (value) {
		scene.background = new THREE.Color(value);
		if (options.fog) {scene.fog = new THREE.Fog(value, options.fogRange, options.fogRange * 2)};
	});
	view.add(options, "fog").onFinishChange(function (value){
		value ? 	scene.fog = new THREE.Fog(options.backgroundColor, options.fogRange, options.fogRange * 2) :
					scene.fog = null;
	});
	view.add(options, "fogRange", 0, 1000).onChange(function (value){
		options.fog ? 	scene.fog = new THREE.Fog(options.backgroundColor, value, value * 2) :
						scene.fog = null;
	});

	// CAMERA //
	var cam = gui.addFolder('Camera');
	cam.add(options, "cameraPositionZ", 0, options.rangeZ * 5).name('Z').onChange(function (value) {
		camera.position.z = value;
	});

	// SIMULATION //
	var sim = gui.addFolder('Simulation');
	sim.add(options, "particleCount", 1, 1000000, 1000).onFinishChange(remakeSystem);
	sim.add(options, "rangeX", 100, 1000).onFinishChange(remakeSystem);
	sim.add(options, "rangeY", 100, 1000).onFinishChange(remakeSystem);
	sim.add(options, "rangeZ", 100, 1000).onFinishChange(remakeSystem);
	sim.add(options, "velocityY", -1, 20).onFinishChange(remakeSystem);
	sim.add(options, "amplitudeX", -1, 20).onFinishChange(remakeSystem);
	sim.add(options, "angleX",  0, 3).onFinishChange(remakeSystem);

	var sprites = gui.addFolder('Sprites');
	sprites.add(options, "ratio", 0.0, 1.0, 0.01).onFinishChange(updateSprite);
	sprites.add(options, "snowSize", 0, 20).onFinishChange(updateSprite);
	sprites.add(options, "spriteSize", 0, 20).onFinishChange(updateSprite);
}

function remakeSystem() {

	while (scene.children.length > 0) {
		const child = scene.children[0];
		scene.remove(child);
		child.geometry.dispose();
		child.material.dispose();
	}

	snowMat.uniforms.rangeY.value = options.rangeY;
	spriteMat.uniforms.rangeY.value = options.rangeY;
	scene.add(new newParticleSystem(snowMat, Math.round(options.particleCount * (1.0 - options.ratio))));
	scene.add(new newParticleSystem(spriteMat, Math.round(options.particleCount * options.ratio)));
}

function updateSprite() {

	snowMat = newParticleMaterial(options.snowSize, snowSprite);
	spriteMat = newParticleMaterial(options.spriteSize, sprite);

	remakeSystem();
}

// Updates scene render size to always fit window
function onWindowResize() {
	windowWidth = window.visualViewport.width;
	windowHeight = window.visualViewport.height;

	scale = windowHeight;

	for (let i = 0; i < scene.children.length; i++) {
		const child = scene.children[i];
		const scales = new Float32Array(child.geometry.getAttribute('position').count).fill(scale);
		child.geometry.setAttribute('scale', new THREE.Float32BufferAttribute(scales, 1));
		child.geometry.attributes.scale.needsUpdate = true;
	}

	camera.aspect = windowWidth / windowHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( windowWidth, windowHeight );
}