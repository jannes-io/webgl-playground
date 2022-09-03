import { SceneLoader } from './scene';
import { parse } from '../objParser';
import boxObj from './assets/smollbox.obj';
import { createSolidColorTexture, initObjectBuffers } from '../gl';
import { glMatrix, mat4, vec3 } from 'gl-matrix';

const loadScene: SceneLoader = (gl) => {
  const parsedBox = parse(boxObj);

  const modelMatrix = mat4.create();

  const boxes = [];
  const count = 3;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      for (let k = 0; k < count; k++) {
        // boxes in all directions around 0, 0
        const x = (i - 1) * count;
        const y = (j - 1) * count;
        const z = (k - 1) * count;

        const boxMatrix = mat4.translate(mat4.create(), modelMatrix, [x, y, z]);

        // funky colors
        const r = 255 / (count - 1) * i;
        const g = 255 / (count - 1) * j;
        const b = 255 / (count - 1) * k;

        const texture = createSolidColorTexture(gl, r, g, b);

        boxes.push({
          objectBuffers: initObjectBuffers(gl, parsedBox),
          texture,
          transform: boxMatrix,
        });
      }
    }
  }

  const camera = {
    position: vec3.fromValues(0, 0, 0),
    target: vec3.fromValues(0, 0, 0),
  };

  const { canvas } = gl;

  const debugInfo = document.createElement('p');
  debugInfo.style.color = 'white';
  canvas.parentElement.append(debugInfo);

  let mouseDown = false;
  let r = 10;
  let camTheta = glMatrix.toRadian(90);
  let camPsi = 0;

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

  canvas.addEventListener('mousedown', () => {
    mouseDown = true;
  });

  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  window.addEventListener('wheel', (e) => {
    r += e.deltaY * 0.01;
    r = Math.max(r, 1);
    updateCamera();
  });

  return {
    objects: boxes,
    camera,
  };
};

export default loadScene;
