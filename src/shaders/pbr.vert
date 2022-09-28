#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aTextureCoord;
attribute vec3 aTangent;
attribute vec3 aBitangent;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTextureCoord;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying mat3 vTBN;

void main()
{
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

    vTextureCoord = aTextureCoord.xy;
    vWorldPos = vec3(uModelMatrix * aVertexPosition);
    vNormal = aVertexNormal;

    vec3 T = normalize(vec3(uModelMatrix * vec4(aTangent, 0.0)));
    vec3 B = normalize(vec3(uModelMatrix * vec4(aBitangent, 0.0)));
    vec3 N = normalize(vec3(uModelMatrix * vec4(aVertexNormal, 0.0)));
    vTBN = mat3(T, B, N);
}
