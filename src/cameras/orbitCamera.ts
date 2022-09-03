import { Camera } from '../scenes/scene';
import { glMatrix, vec3 } from 'gl-matrix';

export const orbitCamera = (
  gl: WebGLRenderingContext,
  camera: Camera,
  initialRadius: number = 10,
) => {
  let mouseDown = false;
  let r = initialRadius;
  let camTheta = glMatrix.toRadian(90);
  let camPsi = 0;

  const { canvas } = gl;

  const debugInfo = document.createElement('p');
  debugInfo.style.color = 'white';
  canvas.parentElement.append(debugInfo);

  const { cos, sin } = Math;
  const updateCamera = () => {
    debugInfo.innerText = `θ: ${(camTheta * 180 / Math.PI).toFixed(2)}deg, ψ: ${(camPsi * 180 / Math.PI).toFixed(2)}deg r: ${r.toFixed(2)}`;
    const camX = r * cos(camPsi) * sin(camTheta);
    const camY = r * sin(camPsi) * sin(camTheta);
    const camZ = r * cos(camTheta);

    camera.position = vec3.fromValues(camX, camY, camZ);
  };
  updateCamera();

  window.addEventListener('mousemove', (e) => {
    if (mouseDown) {
      const speed = 0.005;
      camTheta = (camTheta - e.movementX * speed) % (Math.PI * 2);
      camPsi = (camPsi + e.movementY * speed) % (Math.PI * 2);

      camTheta = camTheta < 0 ? Math.PI * 2 - camTheta : camTheta;
      camPsi = camPsi < 0 ? Math.PI * 2 - camPsi : camPsi;

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
