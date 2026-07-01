// 3D Game with Three.js

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create terrain features
function createTerrain() {
  // Hills
  const hillGeometry = new THREE.ConeGeometry(15, 20, 32);
  const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x3d7a1f });
  
  for (let i = 0; i < 5; i++) {
    const hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(
      (Math.random() - 0.5) * 150,
      0,
      (Math.random() - 0.5) * 150
    );
    hill.scale.y = Math.random() * 0.8 + 0.6;
    hill.castShadow = true;
    hill.receiveShadow = true;
    scene.add(hill);
  }
  
  // Trees
  for (let i = 0; i < 15; i++) {
    const trunkGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    trunk.position.set(x, 7.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(10, 20, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 22, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
  }
  
  // Rocks
  for (let i = 0; i < 10; i++) {
    const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(
      (Math.random() - 0.5) * 160,
      Math.random() * 2 + 1,
      (Math.random() - 0.5) * 160
    );
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

createTerrain();

// Player (character capsule)
const playerGroup = new THREE.Group();
const bodyGeometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4169e1 });
const playerBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
playerBody.castShadow = true;
playerBody.receiveShadow = true;
playerGroup.add(playerBody);

// Head
const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
const headMaterial = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.y = 2;
head.castShadow = true;
head.receiveShadow = true;
playerGroup.add(head);

// Hat
const hatGeometry = new THREE.ConeGeometry(1.2, 1, 32);
const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const hat = new THREE.Mesh(hatGeometry, hatMaterial);
hat.position.y = 2.9;
hat.castShadow = true;
playerGroup.add(hat);

playerGroup.position.set(0, 2, 0);
scene.add(playerGroup);

// Player physics
const playerPhysics = {
  position: new THREE.Vector3(0, 2, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  isGrounded: false,
  moveSpeed: 0.3,
  sprintSpeed: 0.5,
  jumpForce: 0.15,
  gravity: 0.01
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mouse controls for camera
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;

document.addEventListener('mousemove', (e) => {
  if (mouseDown) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }
});

document.addEventListener('mousedown', () => {
  mouseDown = true;
  document.pointerLockElement || renderer.domElement.requestPointerLock();
});

document.addEventListener('mouseup', () => {
  mouseDown = false;
});

// Camera rotation based on mouse
let cameraRotationX = 0;
let cameraRotationY = 0;

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === renderer.domElement) {
    cameraRotationY += e.movementX * 0.002;
    cameraRotationX += e.movementY * 0.002;
    
    if (cameraRotationX > Math.PI / 2) cameraRotationX = Math.PI / 2;
    if (cameraRotationX < -Math.PI / 2) cameraRotationX = -Math.PI / 2;
  }
});

// Update HUD
function updateHUD() {
  document.getElementById('posX').textContent = playerPhysics.position.x.toFixed(1);
  document.getElementById('posY').textContent = playerPhysics.position.y.toFixed(1);
  document.getElementById('posZ').textContent = playerPhysics.position.z.toFixed(1);
}

// Game loop
let frameCount = 0;
let lastTime = Date.now();
let fps = 0;

function animate() {
  requestAnimationFrame(animate);
  
  // FPS calculation
  frameCount++;
  const currentTime = Date.now();
  if (currentTime - lastTime >= 1000) {
    fps = frameCount;
    document.getElementById('fps').textContent = fps;
    frameCount = 0;
    lastTime = currentTime;
  }
  
  // Player movement
  const moveSpeed = keys['shift'] ? playerPhysics.sprintSpeed : playerPhysics.moveSpeed;
  const forwardDirection = new THREE.Vector3(
    Math.sin(cameraRotationY),
    0,
    Math.cos(cameraRotationY)
  );
  const rightDirection = new THREE.Vector3(
    Math.cos(cameraRotationY),
    0,
    -Math.sin(cameraRotationY)
  );
  
  if (keys['w']) {
    playerPhysics.position.add(forwardDirection.multiplyScalar(moveSpeed));
  }
  if (keys['s']) {
    playerPhysics.position.sub(forwardDirection.multiplyScalar(moveSpeed));
  }
  if (keys['d']) {
    playerPhysics.position.add(rightDirection.multiplyScalar(moveSpeed));
  }
  if (keys['a']) {
    playerPhysics.position.sub(rightDirection.multiplyScalar(moveSpeed));
  }
  
  // Jumping
  if (keys[' '] && playerPhysics.isGrounded) {
    playerPhysics.velocity.y = playerPhysics.jumpForce;
    playerPhysics.isGrounded = false;
  }
  
  // Gravity
  playerPhysics.velocity.y -= playerPhysics.gravity;
  playerPhysics.position.y += playerPhysics.velocity.y;
  
  // Ground collision
  if (playerPhysics.position.y <= 2) {
    playerPhysics.position.y = 2;
    playerPhysics.velocity.y = 0;
    playerPhysics.isGrounded = true;
  }
  
  // Boundary check
  const boundarySize = 95;
  if (playerPhysics.position.x > boundarySize) playerPhysics.position.x = boundarySize;
  if (playerPhysics.position.x < -boundarySize) playerPhysics.position.x = -boundarySize;
  if (playerPhysics.position.z > boundarySize) playerPhysics.position.z = boundarySize;
  if (playerPhysics.position.z < -boundarySize) playerPhysics.position.z = -boundarySize;
  
  // Update player position
  playerGroup.position.copy(playerPhysics.position);
  
  // Update camera
  const cameraDistance = 5;
  const cameraHeight = 1.5;
  camera.position.x = playerPhysics.position.x - Math.sin(cameraRotationY) * cameraDistance;
  camera.position.y = playerPhysics.position.y + cameraHeight;
  camera.position.z = playerPhysics.position.z - Math.cos(cameraRotationY) * cameraDistance;
  
  camera.lookAt(
    playerPhysics.position.x + Math.sin(cameraRotationY) * 10,
    playerPhysics.position.y + cameraHeight + Math.tan(cameraRotationX) * 10,
    playerPhysics.position.z + Math.cos(cameraRotationY) * 10
  );
  
  updateHUD();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Enable pointer lock
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

animate();