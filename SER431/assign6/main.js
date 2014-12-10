var scene, renderer, camera, controls, counter, sphere1;
var depthMaterial, depthTarget, composer;
init();
animate();


function render() {
	scene.everrideMaterial = depthMaterial;
	renderer.render(scene, camera);
	//scene.overrideMaterial = null;
	composer.render();
	//sphere1.position.y = 32 + 8 * Math.sin(counter);
	//counter = (counter > 100) ? counter = 0.0 : counter + 0.01;
	//console.log(counter);
}

function animate() {
	requestAnimationFrame( animate );
	render();
	controls.update();
}

function drawSphere(size, material){
	var geo = new THREE.SphereGeometry(size, size*2, size*2);
	var mesh = new THREE.Mesh(geo, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
}

function drawFloor(size, material) {
	var geo = new THREE.PlaneGeometry(size, size);
	var mesh = new THREE.Mesh(geo, material);
	mesh.rotation.x = -Math.PI / 2;
	mesh.receiveShadow = true;
	return mesh;
}

function init() {
	counter = 0.0;
	scene = new THREE.Scene();
				
	camera = new THREE.PerspectiveCamera(75,
			window.innerWidth/window.innerHeight, 1, 5000);
	camera.position.set(35,60,60);
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;

	var dLight = new THREE.DirectionalLight(0xffffff, 0.2);
	var sLight = new THREE.SpotLight(0xcccccc);
	sLight.position.set(0, 200, 0);
	sLight.castShadow = true;
	scene.add(sLight);
	scene.add(dLight);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	document.body.appendChild(renderer.domElement);
	controls.addEventListener('change', render);

	//var mirrorCam = new THREE.CubeCamera( 0.1, 500, 64 );
	//scene.add(mirrorCam);

	var sphereSize = 16;

	sphere1 = drawSphere(sphereSize, new THREE.MeshLambertMaterial({color: 0x0000ff}));
	sphere1.position.x = -sphereSize*2 + 2;
	sphere1.position.y = sphereSize + 4;

	var sphere2 = drawSphere(sphereSize, new THREE.MeshLambertMaterial({color: 0x00ff00}));
	sphere2.position.y = sphereSize + 4;

	sphereSize = 8;
	var sphere3 = drawSphere(sphereSize, new THREE.MeshLambertMaterial({color: 0xff0000}));
	sphere3.position.x = sphereSize*2 - 2;
	sphere3.position.y = 24;

	var floor = drawFloor(100, new THREE.MeshLambertMaterial({color: 0xffff00,
				side: THREE.DoubleSide}));

	scene.add(sphere1);
	scene.add(sphere2);
	scene.add(sphere3);
	scene.add(floor);





	var depthShader = THREE.ShaderLib[ "depthRGBA" ];
	var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

	depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
	depthMaterial.blending = THREE.NoBlending;

	// postprocessing
	
	composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );

	depthTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
	
	var effect = new THREE.ShaderPass( THREE.SSAOShader );
	effect.uniforms[ 'tDepth' ].value = depthTarget;
	effect.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight );
	effect.uniforms[ 'cameraNear' ].value = camera.near;
	effect.uniforms[ 'cameraFar' ].value = camera.far;
	effect.renderToScreen = true;
	composer.addPass( effect );

}