import './global.css';
import { mat4, glMatrix, vec3 } from 'gl-matrix';
import pbrVertexShader from './shaders/pbr.vert';
import pbrFragmentShader from './shaders/pbr.frag';
import { bindArrayBuffer, bindTexture, initShaderProgram } from './gl';
import { PBRMaterial, Scene } from './scenes/scene';
import { loadHatch } from './scenes';

interface IProgramInfo {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, any>;
}

const drawScene = (
  gl: WebGLRenderingContext,
  scene: Scene<PBRMaterial>,
  programInfo: IProgramInfo,
) => {
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

  const { program, uniformLocations, attribLocations } = programInfo;
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

    bindTexture(gl, uniformLocations.material.albedo, material.albedo);
    bindTexture(gl, uniformLocations.material.normal, material.normal);
    bindTexture(gl, uniformLocations.material.metallic, material.metallic);
    bindTexture(gl, uniformLocations.material.roughness, material.roughness);
    bindTexture(gl, uniformLocations.material.ao, material.ao);

    gl.drawArrays(gl.TRIANGLES, 0, objectBuffers.vertexCount);
  });
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
  const gl = canvas.getContext('webgl');

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

  gl.getExtension('OES_standard_derivatives');

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  // Init shader programs
  const pbr = initShaderProgram(gl, pbrVertexShader, pbrFragmentShader);
  const pbrShaderInfo: IProgramInfo = {
    program: pbr,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(pbr, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(pbr, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(pbr, 'aTextureCoord'),
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

  // Render scene
  const scene = await loadHatch(gl);

  let prevFrame = 0;
  const render = (currFrame: DOMHighResTimeStamp) => {
    const deltaTime = currFrame - prevFrame;
    prevFrame = currFrame;

    drawScene(gl, scene, pbrShaderInfo);
    if (scene.animate !== undefined) {
      scene.animate(deltaTime);
    }

    debug.innerText = `FPS: ${(1000 / deltaTime).toFixed(0)}`;

    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
};

window.onload = main;
