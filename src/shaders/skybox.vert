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

    mat4 rotView = mat4(mat3(uViewMatrix));
    vec4 clipPos = uProjectionMatrix * rotView * vec4(vLocalPos, 1.0);

    gl_Position = clipPos.xyww;
}
