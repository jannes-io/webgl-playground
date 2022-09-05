import { Camera } from '../scenes/scene';
import { vec3 } from 'gl-matrix';

export const orbitCamera = (
  gl: WebGLRenderingContext,
  camera: Camera,
  initialRadius: number = 10,
) => {
  let mouseDown = false;
  let r = initialRadius;
  let camPhi = 0;
  let camTetha = 0;

  const { min, max, cos, sin, PI } = Math;
  const updateCamera = () => {
    const camX = r * cos(camPhi) * sin(camTetha);
    const camY = r * sin(camPhi);
    const camZ = r * cos(camTetha) * cos(camPhi);

    vec3.add(camera.position, camera.target, [camX, camY, camZ]);
  };
  updateCamera();

  window.addEventListener('mousemove', (e) => {
    if (mouseDown) {
      const speed = 0.005;
      camTetha = (camTetha - e.movementX * speed) % (PI * 2);
      camPhi = camPhi + e.movementY * speed;

      camPhi = min(max(camPhi, -3.14 / 2), 3.14 / 2);
      camTetha = camTetha < 0 ? PI * 2 - camTetha : camTetha;

      updateCamera();
    }
  });

  gl.canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouseDown = true;
    }
  });

  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  window.addEventListener('wheel', (e) => {
    r += e.deltaY * 0.01;
    r = max(r, 1);
    updateCamera();
  });

  return camera;
};

export default orbitCamera;
