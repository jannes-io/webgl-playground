import { Camera } from '../scenes/scene';
import { glMatrix, vec3 } from 'gl-matrix';

export const orbitCamera = (
  gl: WebGLRenderingContext,
  camera: Camera,
  initialRadius: number = 10,
) => {
  let mouseDown = false;
  let r = initialRadius;
  let camPhi = 0;
  let camTetha = 0;

  const { canvas } = gl;

  const debugInfo = document.createElement('p');
  debugInfo.style.color = 'white';
  canvas.parentElement.append(debugInfo);

  const { cos, sin } = Math;
  const updateCamera = () => {
    debugInfo.innerText = `φ: ${(camPhi * 180 / Math.PI).toFixed(2)}deg, θ: ${(camTetha * 180 / Math.PI).toFixed(2)}deg r: ${r.toFixed(2)}`;
    const camX = r * cos(camPhi) * sin(camTetha);
    const camY = r * sin(camPhi);
    const camZ = r * cos(camTetha) * cos(camPhi);

    vec3.add(camera.position, camera.target, [camX, camY, camZ]);
  };
  updateCamera();

  window.addEventListener('mousemove', (e) => {
    if (mouseDown) {
      const speed = 0.005;
      camTetha = (camTetha - e.movementX * speed) % (Math.PI * 2);
      camPhi = camPhi + e.movementY * speed;

      camPhi = Math.min(Math.max(camPhi, -3.14 / 2), 3.14 / 2);
      camTetha = camTetha < 0 ? Math.PI * 2 - camTetha : camTetha;

      updateCamera();
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouseDown = true;
    }
  });

  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  window.addEventListener('wheel', (e) => {
    r += e.deltaY * 0.01;
    r = Math.max(r, 1);
    updateCamera();
  });

  return camera;
};

export default orbitCamera;
