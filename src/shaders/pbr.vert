#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTextureCoord;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main()
{
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

    vTextureCoord = aTextureCoord.xy;
    vWorldPos = vec3(uModelMatrix * aVertexPosition);
    vNormal = aVertexNormal;
}
