#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec3 vLocalPos;

uniform samplerCube uEnvironmentMap;

void main()
{
    vec3 envColor = textureCube(uEnvironmentMap, vLocalPos).rgb;

    envColor = envColor / (envColor + vec3(1.0));
    envColor = pow(envColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(envColor, 1.0);
}
