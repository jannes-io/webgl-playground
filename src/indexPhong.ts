import './global.css';
import { mat4, glMatrix, vec3 } from 'gl-matrix';
import objectVertexShader from './shaders/object.vert';
import objectFragmentShader from './shaders/object.frag';
import lightVertexShader from './shaders/light.vert';
import lightFragmentShader from './shaders/light.frag';
import { bindArrayBuffer, bindTexture, initGl, initShaderProgram } from './gl';
import { PhongMaterial, Scene } from './scenes/scene';
import { loadWalls } from './scenes';
import box from './box';

interface IProgramInfo {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, any>;
}

const drawScene = (
  gl: WebGLRenderingContext,
  scene: Scene<PhongMaterial>,
  objectShader: IProgramInfo,
  lightShader: IProgramInfo,
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

  // Object shader
  {
    const { program, uniformLocations } = objectShader;
    gl.useProgram(program);

    gl.uniformMatrix4fv(uniformLocations.viewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(uniformLocations.projectionMatrix, false, projectMatrix);
    gl.uniform3fv(uniformLocations.lightColor, new Float32Array([1.0, 1.0, 1.0]));
    gl.uniform3fv(uniformLocations.viewPos, scene.camera.position);

    gl.uniform3fv(
      gl.getUniformLocation(program, 'uDirLight.direction'),
      new Float32Array([-0.2, -1, -0.3]),
    );

    gl.uniform3fv(
      gl.getUniformLocation(program, 'uDirLight.ambient'),
      new Float32Array([0.2, 0.2, 0.2]),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uDirLight.diffuse'),
      new Float32Array([0.5, 0.5, 0.5]),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uDirLight.specular'),
      new Float32Array([1, 1, 1]),
    );

    scene.lights.forEach((lightPos, i) => {
      gl.uniform3fv(
        gl.getUniformLocation(program, `uPointLights[${i}].position`),
        lightPos,
      );

      gl.uniform3fv(
        gl.getUniformLocation(program, `uPointLights[${i}].ambient`),
        new Float32Array([0.2, 0.2, 0.2]),
      );
      gl.uniform3fv(
        gl.getUniformLocation(program, `uPointLights[${i}].diffuse`),
        new Float32Array([0.5, 0.5, 0.5]),
      );
      gl.uniform3fv(
        gl.getUniformLocation(program, `uPointLights[${i}].specular`),
        new Float32Array([1, 1, 1]),
      );

      gl.uniform1f(
        gl.getUniformLocation(program, `uPointLights[${i}].constant`),
        1,
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `uPointLights[${i}].linear`),
        0.22,
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `uPointLights[${i}].quadratic`),
        0.20,
      );
    });

    scene.objects.forEach(({ objectBuffers, material, transform }) => {
      gl.uniformMatrix4fv(objectShader.uniformLocations.modelMatrix, false, transform);

      bindArrayBuffer(gl, objectShader.attribLocations.vertexPosition, objectBuffers.position);
      bindArrayBuffer(gl, objectShader.attribLocations.vertexNormal, objectBuffers.normal);
      bindArrayBuffer(gl, objectShader.attribLocations.textureCoord, objectBuffers.texture);
      bindArrayBuffer(gl, objectShader.attribLocations.tangent, objectBuffers.tangent);
      bindArrayBuffer(gl, objectShader.attribLocations.bitangent, objectBuffers.bitangent);

      bindTexture(gl, objectShader.uniformLocations.material.diffuse, material.diffuse);
      bindTexture(gl, objectShader.uniformLocations.material.specular, material.specular);
      bindTexture(gl, objectShader.uniformLocations.material.normals, material.normals);

      gl.uniform1f(objectShader.uniformLocations.material.shininess, material.shininess);

      gl.drawArrays(gl.TRIANGLES, 0, objectBuffers.vertexCount);
    });
  }

  // Light shader
  if (scene.lights !== undefined) {
    gl.useProgram(lightShader.program);

    gl.uniformMatrix4fv(lightShader.uniformLocations.viewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(lightShader.uniformLocations.projectionMatrix, false, projectMatrix);

    scene.lights.forEach((location) => {
      const modelMatrix = mat4.create();
      mat4.translate(modelMatrix, modelMatrix, location);
      mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(0.2, 0.2, 0.2));

      gl.uniformMatrix4fv(lightShader.uniformLocations.modelMatrix, false, modelMatrix);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box), gl.STATIC_DRAW);

      const vertexPosition = gl.getAttribLocation(lightShader.program, 'aVertexPosition');
      gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPosition);

      gl.drawArrays(gl.TRIANGLES, 0, 32);
    });
  }
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
  const objectShader = initShaderProgram(gl, objectVertexShader, objectFragmentShader);
  const objectShaderInfo: IProgramInfo = {
    program: objectShader,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(objectShader, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(objectShader, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(objectShader, 'aTextureCoord'),
      tangent: gl.getAttribLocation(objectShader, 'aTangent'),
      bitangent: gl.getAttribLocation(objectShader, 'aBitangent'),
    },
    uniformLocations: {
      modelMatrix: gl.getUniformLocation(objectShader, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(objectShader, 'uViewMatrix'),
      projectionMatrix: gl.getUniformLocation(objectShader, 'uProjectionMatrix'),
      viewPos: gl.getUniformLocation(objectShader, 'uViewPos'),
      material: {
        diffuse: gl.getUniformLocation(objectShader, 'uMaterial.diffuse'),
        specular: gl.getUniformLocation(objectShader, 'uMaterial.specular'),
        normals: gl.getUniformLocation(objectShader, 'uMaterial.normals'),
        shininess: gl.getUniformLocation(objectShader, 'uMaterial.shininess'),
      },
    },
  };

  const lightShader = initShaderProgram(gl, lightVertexShader, lightFragmentShader);
  const lightShaderInfo: IProgramInfo = {
    program: lightShader,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(lightShader, 'aVertexPosition'),
    },
    uniformLocations: {
      modelMatrix: gl.getUniformLocation(lightShader, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(lightShader, 'uViewMatrix'),
      projectionMatrix: gl.getUniformLocation(lightShader, 'uProjectionMatrix'),
    },
  };

  // Render scene
  // const scene = loadBoxAndBottle(gl);
  // const scene = await loadLotsOfBoxes(gl);
  const scene = await loadWalls(gl);

  let prevFrame = 0;
  const render = (currFrame: DOMHighResTimeStamp) => {
    const deltaTime = currFrame - prevFrame;
    prevFrame = currFrame;

    drawScene(gl, scene, objectShaderInfo, lightShaderInfo);
    if (scene.animate !== undefined) {
      scene.animate(deltaTime);
    }

    debug.innerText = `FPS: ${(1000 / deltaTime).toFixed(0)}`;

    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
};

window.onload = main;
