attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uLightPos;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

    vTextureCoord = aTextureCoord.xy;
    vFragPos = vec3(uModelMatrix * aVertexPosition);
    vNormal = aVertexNormal;
}
