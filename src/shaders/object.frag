varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;
varying highp vec3 vFragPos;

uniform sampler2D uSampler;
uniform highp vec3 uLightColor;
uniform highp vec3 uLightPos;
uniform highp vec3 uViewPos;

void main() {
    highp vec3 objectColor = texture2D(uSampler, vTextureCoord).xyz;

    // ambient
    lowp float ambientStrength = 0.1;
    lowp vec3 ambient = ambientStrength * uLightColor;

    highp vec3 norm = normalize(vNormal);
    highp vec3 lightDir = normalize(uLightPos - vFragPos);

    // diffuse
    highp float diff = max(dot(norm, lightDir), 0.0);
    highp vec3 diffuse = diff * uLightColor;

    // specular
    lowp float specularStrength = 0.5;
    highp vec3 viewDir = normalize(uViewPos - vFragPos);
    highp vec3 reflectDir = reflect(-lightDir, norm);

    highp float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    highp vec3 specular = specularStrength * spec * uLightColor;

    // result
    highp vec3 result = (ambient + diffuse + specular) * objectColor;
    gl_FragColor = vec4(result, 1.0);
}
