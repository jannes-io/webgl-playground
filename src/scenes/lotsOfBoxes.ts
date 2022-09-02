import { SceneLoader } from './scene';
import { parse } from '../objParser';
import boxObj from './assets/smollbox.obj';
import boxTex from './assets/box.png';
import { initObjectBuffers, loadTexture } from '../gl';
import { glMatrix, mat4, vec3 } from 'gl-matrix';

const loadScene: SceneLoader = (gl) => {
  const parsedBox = parse(boxObj);
  const boxTexture = loadTexture(gl, boxTex);

  const modelMatrix = mat4.create();

  const boxes = [];
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      for (let k = -1; k < 2; k++) {
        const boxMatrix = mat4.translate(mat4.create(), modelMatrix, [i * 3, j * -3, k * 3]);

        boxes.push({
          objectBuffers: initObjectBuffers(gl, parsedBox),
          texture: boxTexture,
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
