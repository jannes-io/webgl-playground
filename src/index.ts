import './global.css';
import { mat4, glMatrix, vec3 } from 'gl-matrix';
import vsSource from './shaders/vertex.vert';
import fsSource from './shaders/fragment.frag';
import {
  bindArrayBuffer,
  bindTexture,
  initShaderProgram,
} from './gl';
import { Scene } from './scenes/scene';
import { loadBoxAndBottle, loadLotsOfBoxes } from './scenes';

interface IProgramInfo {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, WebGLUniformLocation>;
}

const drawScene = (
  gl: WebGLRenderingContext,
  scene: Scene,
  programInfo: IProgramInfo,
) => {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const cameraPosition = scene.camera?.position || vec3.fromValues(0, 0, -3);
  const cameraTarget = scene.camera?.target || vec3.fromValues(0, 0, 0);

  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, vec3.fromValues(0, 1, 0));

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectMatrix = mat4.create();
  mat4.perspective(projectMatrix, glMatrix.toRadian(45), aspect, 0.1, 1000.0);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectMatrix);

  scene.objects.forEach(({ objectBuffers, texture, transform }) => {
    bindArrayBuffer(gl, objectBuffers.position, programInfo.attribLocations.vertexPosition);
    bindArrayBuffer(gl, objectBuffers.texture, programInfo.attribLocations.textureCoord);

    gl.uniformMatrix4fv(programInfo.uniformLocations.modelMatrix, false, transform);

    bindTexture(gl, texture, programInfo.uniformLocations.uSampler);
    gl.drawArrays(gl.TRIANGLES, 0, objectBuffers.vertexCount);
  });
};

const main = () => {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);

  canvas.width = parseInt(window.getComputedStyle(document.body).width, 10);
  canvas.height = canvas.width / 16 * 9;
  const gl = canvas.getContext('webgl2');

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo: IProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  // const scene = loadBoxAndBottle(gl);
  const scene = loadLotsOfBoxes(gl);

  let prevFrame = 0;
  const render = (currFrame: DOMHighResTimeStamp) => {
    const deltaTime = currFrame - prevFrame;
    prevFrame = currFrame;

    drawScene(gl, scene, programInfo);
    if (scene.animate !== undefined) {
      scene.animate(deltaTime);
    }

    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
};

window.onload = main;
