import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const SPEED = 4.4;
const PLAYER_HEIGHT = 1.65;
const RADIUS = 0.34;

export function createControls(camera, domElement, blocks) {
  const controls = new PointerLockControls(camera, domElement);
  camera.position.set(-6.49, PLAYER_HEIGHT, 9.55);
  camera.lookAt(-6.49, 1.15, -2);

  const keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
  };

  const onKey = (event, pressed) => {
    switch (event.code) {
      case 'KeyW':
      case 'KeyZ':
      case 'ArrowUp':
        keys.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.back = pressed;
        break;
      case 'KeyA':
      case 'KeyQ':
      case 'ArrowLeft':
        keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = pressed;
        break;
      default:
        break;
    }
  };

  document.addEventListener('keydown', (event) => onKey(event, true));
  document.addEventListener('keyup', (event) => onKey(event, false));

  function hits(x, z) {
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block.cos == null) {
        if (x > block.minX - RADIUS && x < block.maxX + RADIUS && z > block.minZ - RADIUS && z < block.maxZ + RADIUS) {
          return true;
        }
        continue;
      }
      const dx = x - block.cx;
      const dz = z - block.cz;
      const lx = dx * block.cos - dz * block.sin;
      const lz = dx * block.sin + dz * block.cos;
      if (
        lx > block.minLX - RADIUS
        && lx < block.maxLX + RADIUS
        && lz > block.minLZ - RADIUS
        && lz < block.maxLZ + RADIUS
      ) {
        return true;
      }
    }
    return false;
  }

  function update(dt) {
    if (!controls.isLocked || controls.enabled === false) return;

    const prevX = camera.position.x;
    const prevZ = camera.position.z;
    const distance = SPEED * dt;
    if (keys.forward) controls.moveForward(distance);
    if (keys.back) controls.moveForward(-distance);
    if (keys.right) controls.moveRight(distance);
    if (keys.left) controls.moveRight(-distance);

    const nextX = camera.position.x;
    const nextZ = camera.position.z;
    camera.position.x = prevX;
    camera.position.z = prevZ;
    if (!hits(nextX, prevZ)) camera.position.x = nextX;
    if (!hits(camera.position.x, nextZ)) camera.position.z = nextZ;
    camera.position.y = PLAYER_HEIGHT;
  }

  return { controls, update };
}
