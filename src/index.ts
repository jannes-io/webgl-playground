import './global.css';
import { mat4, glMatrix, vec3, ReadonlyVec3 } from 'gl-matrix';
import pbrVertexShader from './shaders/pbr.vert';
import pbrFragmentShader from './shaders/pbr.frag';
import cubeVertexShader from './shaders/cubemap.vert';
import cubeFragmentShader from './shaders/cubemap.frag';
import skyboxVertexShader from './shaders/skybox.vert';
import skyboxFragmentShader from './shaders/skybox.frag';
import {
  bindArrayBuffer,
  bindTexture,
  initGl,
  initShaderProgram, textureAtlas, WebGLContext,
} from './gl';
import { loadPbrBalls } from './scenes';
import box from './box';
import { parseHdr } from './hdrParser';
import bridgeHdr from './scenes/assets/bridge.hdr';

interface IProgramInfo {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, any>;
}

let cubeVBO: WebGLBuffer | null = null;
let cubeVAO: WebGLVertexArrayObject | null = null;

const renderCube = (gl: WebGLContext, vertexPositionLocation: number) => {
  if (cubeVAO === null) {
    cubeVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, box, gl.STATIC_DRAW);

    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  gl.bindVertexArray(cubeVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
  gl.bindVertexArray(null);
};

const main = async () => {
  // Init canvas
  const canvas = document.createElement('canvas');
  canvas.width = parseInt(window.getComputedStyle(document.body).width, 10);
  canvas.height = canvas.width / 16 * 9;

  document.body.append(canvas);

  // Init debug field
  const debug = document.createElement('p');
  debug.id = 'gl-debug';

  document.body.append(debug);

  // Init GL
  const gl = initGl(canvas);

  // Init shader programs
  const pbr = initShaderProgram(gl, pbrVertexShader, pbrFragmentShader);
  const pbrShaderInfo: IProgramInfo = {
    program: pbr,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(pbr, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(pbr, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(pbr, 'aTextureCoord'),
      tangent: gl.getAttribLocation(pbr, 'aTangent'),
      bitangent: gl.getAttribLocation(pbr, 'aBitangent'),
    },
    uniformLocations: {
      modelMatrix: gl.getUniformLocation(pbr, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(pbr, 'uViewMatrix'),
      projectionMatrix: gl.getUniformLocation(pbr, 'uProjectionMatrix'),
      viewPos: gl.getUniformLocation(pbr, 'uViewPos'),
      material: {
        albedo: gl.getUniformLocation(pbr, 'uMaterial.albedo'),
        normal: gl.getUniformLocation(pbr, 'uMaterial.normal'),
        metallic: gl.getUniformLocation(pbr, 'uMaterial.metallic'),
        roughness: gl.getUniformLocation(pbr, 'uMaterial.roughness'),
        ao: gl.getUniformLocation(pbr, 'uMaterial.ao'),
      },
    },
  };

  const skybox = initShaderProgram(gl, skyboxVertexShader, skyboxFragmentShader);
  const skyboxShaderInfo: IProgramInfo = {
    program: skybox,
    attribLocations: {
      position: gl.getAttribLocation(skybox, 'aPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(skybox, 'uProjectionMatrix'),
      viewMatrix: gl.getUniformLocation(skybox, 'uViewMatrix'),
    },
  };

  // Render scene
  const scene = await loadPbrBalls(gl);
  const { data, width, height } = await parseHdr(bridgeHdr);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const hdrTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    data,
  );

  gl.generateMipmap(gl.TEXTURE_2D);

  textureAtlas.push(hdrTexture);
  const hdr = textureAtlas.length - 1;

  const cubeMapShader = initShaderProgram(gl, cubeVertexShader, cubeFragmentShader);
  gl.useProgram(cubeMapShader);

  const captureFBO = gl.createFramebuffer();
  const captureRBO = gl.createRenderbuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
  gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 1024, 1024);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

  const uViewMatrix = gl.getUniformLocation(cubeMapShader, 'uViewMatrix');
  const uProjectionMatrix = gl.getUniformLocation(cubeMapShader, 'uProjectionMatrix');
  const uEquirectangularMap = gl.getUniformLocation(cubeMapShader, 'uEquirectangularMap');

  const cubeMap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, 1024, 1024, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const captureProjection = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1.0, 0.1, 10.0);
  const eye: ReadonlyVec3 = [0.0, 0.0, 0.0];
  const captureViews = [
    mat4.lookAt(mat4.create(), eye, [1.0, 0.0, 0.0], [0.0, -1.0, 0.0]),
    mat4.lookAt(mat4.create(), eye, [-1.0, 0.0, 0.0], [0.0, -1.0, 0.0]),
    mat4.lookAt(mat4.create(), eye, [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]),
    mat4.lookAt(mat4.create(), eye, [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]),
    mat4.lookAt(mat4.create(), eye, [0.0, 0.0, 1.0], [0.0, -1.0, 0.0]),
    mat4.lookAt(mat4.create(), eye, [0.0, 0.0, -1.0], [0.0, -1.0, 0.0]),
  ];

  bindTexture(gl, uEquirectangularMap, hdr);
  gl.uniformMatrix4fv(uProjectionMatrix, false, captureProjection);
  gl.viewport(0, 0, 1024, 1024);
  gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

  const aPosition = gl.getAttribLocation(cubeMapShader, 'aPosition');
  for (let i = 0; i < 6; i++) {
    gl.uniformMatrix4fv(uViewMatrix, false, captureViews[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubeMap, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderCube(gl, aPosition);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  let prevFrame = 0;
  gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
  const render = (currFrame: DOMHighResTimeStamp) => {
    const deltaTime = currFrame - prevFrame;
    prevFrame = currFrame;

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const cameraPosition = scene.camera?.position || vec3.fromValues(0, 0, 10);
    const cameraTarget = scene.camera?.target || vec3.fromValues(0, 0, 0);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, vec3.fromValues(0, 1, 0));

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectMatrix = mat4.create();
    mat4.perspective(projectMatrix, glMatrix.toRadian(45), aspect, 0.1, 1000.0);

    // Render scene
    {
      const { program, uniformLocations, attribLocations } = pbrShaderInfo;
      gl.useProgram(program);

      gl.uniformMatrix4fv(uniformLocations.viewMatrix, false, viewMatrix);
      gl.uniformMatrix4fv(uniformLocations.projectionMatrix, false, projectMatrix);
      gl.uniform3fv(uniformLocations.viewPos, scene.camera.position);

      scene.lights.forEach((lightPos, i) => {
        gl.uniform3fv(
          gl.getUniformLocation(program, `uPointLights[${i}].position`),
          lightPos,
        );
        gl.uniform3fv(
          gl.getUniformLocation(program, `uPointLights[${i}].color`),
          new Float32Array([300, 300, 300]),
        );
      });

      scene.objects.forEach(({ objectBuffers, material, transform }) => {
        gl.uniformMatrix4fv(uniformLocations.modelMatrix, false, transform);

        bindArrayBuffer(gl, attribLocations.vertexPosition, objectBuffers.position);
        bindArrayBuffer(gl, attribLocations.vertexNormal, objectBuffers.normal);
        bindArrayBuffer(gl, attribLocations.textureCoord, objectBuffers.texture);
        bindArrayBuffer(gl, attribLocations.tangent, objectBuffers.tangent);
        bindArrayBuffer(gl, attribLocations.bitangent, objectBuffers.bitangent);

        bindTexture(gl, uniformLocations.material.albedo, material.albedo);
        bindTexture(gl, uniformLocations.material.normal, material.normal);
        bindTexture(gl, uniformLocations.material.metallic, material.metallic);
        bindTexture(gl, uniformLocations.material.roughness, material.roughness);
        bindTexture(gl, uniformLocations.material.ao, material.ao);

        gl.drawArrays(gl.TRIANGLES, 0, objectBuffers.vertexCount);
      });
    }

    // Render skybox
    {
      const { program, uniformLocations, attribLocations } = skyboxShaderInfo;
      gl.useProgram(program);
      gl.uniformMatrix4fv(uniformLocations.projectionMatrix, false, projectMatrix);
      gl.uniformMatrix4fv(uniformLocations.viewMatrix, false, viewMatrix);

      renderCube(gl, attribLocations.position);
    }

    if (scene.animate !== undefined) {
      scene.animate(deltaTime);
    }

    debug.innerText = `FPS: ${(1000 / deltaTime).toFixed(0)}`;

    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
};

window.onload = main;
