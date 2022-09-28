#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec3 aPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

varying vec3 vLocalPos;

void main()
{
    vLocalPos = aPosition;
    gl_Position = uProjectionMatrix * uViewMatrix * vec4(vLocalPos, 1.0);
}
