import './global.css';
import { mat4 } from 'gl-matrix';
import vsSource from './shaders/vertex.vert';
import fsSource from './shaders/fragment.frag';
import {
  bindArrayBuffer,
  bindTexture,
  initShaderProgram,
} from './gl';
import { Scene } from './scenes/scene';
import { loadBoxAndBottle } from './scenes';

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
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectMatrix = mat4.create();
  mat4.perspective(projectMatrix, fieldOfView, aspect, 0.1, 1000.0);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectMatrix);

  scene.objects.forEach(({ objectBuffers, texture, transform }, i) => {
    bindArrayBuffer(gl, objectBuffers.position, programInfo.attribLocations.vertexPosition);
    bindArrayBuffer(gl, objectBuffers.normal, programInfo.attribLocations.vertexNormal);
    bindArrayBuffer(gl, objectBuffers.texture, programInfo.attribLocations.textureCoord);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, transform);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, transform);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

    bindTexture(gl, texture, i, programInfo.uniformLocations.uSampler);
    gl.drawArrays(gl.TRIANGLES, 0, objectBuffers.vertexCount);
  });
};

const main = () => {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);

  canvas.width = parseInt(window.getComputedStyle(document.body).width, 10);
  canvas.height = canvas.width / 16 * 9;
  const gl = canvas.getContext('webgl2');

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo: IProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const scene = loadBoxAndBottle(gl);

  let prevFrame = 0;
  const render = (currFrame: DOMHighResTimeStamp) => {
    const deltaTime = currFrame - prevFrame;
    prevFrame = currFrame;

    drawScene(gl, scene, programInfo);
    scene.animate(deltaTime);

    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
};

window.onload = main;
