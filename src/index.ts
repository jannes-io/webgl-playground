import './global.css';
import { mat4 } from 'gl-matrix';
import vsSource from './shaders/vertex.vert';
import fsSource from './shaders/fragment.frag';
import bottleTex from './bottle.png';
import bottleObj from './bottle.obj';
import { parse } from './objParser';

parse(bottleObj);

let squareRotation = 0.0;

const loadShader = (
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);

  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);

    return null;
  }

  return shader;
};

const initShaderProgram = (gl: WebGLRenderingContext) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize shader program', gl.getProgramInfoLog(shaderProgram));

    return null;
  }

  return shaderProgram;
};

const initBuffers = (gl: WebGLRenderingContext) => {
  const positions = [
    // Front face
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const textureCoordinates = [
    // Front
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Back
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Top
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Bottom
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Right
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Left
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ];

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

  const indices = [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23,   // left
  ];

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const vertexNormals = [
    // Front
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,

    // Back
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,

    // Top
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,

    // Bottom
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,

    // Right
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    texture: textureCoordBuffer,
    indices: indexBuffer,
  };
};

const loadTexture = (gl: WebGLRenderingContext, url: string) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);

  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, 1, 1, 0, srcFormat, srcType, pixel);

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = url;

  return texture;
};

interface IProgramInfo {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, WebGLUniformLocation>;
}

const drawScene = (
  gl: WebGLRenderingContext,
  programInfo: IProgramInfo,
  buffers: ReturnType<typeof initBuffers>,
  texture: WebGLTexture,
  deltaTime: DOMHighResTimeStamp,
) => {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectMatrix = mat4.create();
  mat4.perspective(projectMatrix, fieldOfView, aspect, 0.1, 100.0);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0, 0, 1]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [1, 0, 0]);

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    3,
    gl.FLOAT,
    false,
    0,
    0,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexNormal,
    3,
    gl.FLOAT,
    false,
    0,
    0,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    2,
    gl.FLOAT,
    false,
    0,
    0,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  const vertexCount = 36;
  gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);

  squareRotation += deltaTime;
};

const main = () => {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);

  canvas.width = parseInt(window.getComputedStyle(document.body).width, 10);
  canvas.height = canvas.width / 16 * 9;
  const gl = canvas.getContext('webgl');

  const shaderProgram = initShaderProgram(gl);

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

  const buffers = initBuffers(gl);
  const texture = loadTexture(gl, bottleTex);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let then = 0;
  const render = (now: DOMHighResTimeStamp) => {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, texture, deltaTime);

    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
};

window.onload = main;
