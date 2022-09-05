#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vFragPos;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};

struct Light {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform vec3 uViewPos;
uniform Material uMaterial;
uniform Light uLight;

void main() {
    // ambient
    vec3 ambient = uLight.ambient * texture2D(uMaterial.diffuse, vTextureCoord).xyz;

    // diffuse
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(uLight.position - vFragPos);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = uLight.diffuse * diff * texture2D(uMaterial.diffuse, vTextureCoord).xyz;

    // specular
    vec3 viewDir = normalize(uViewPos - vFragPos);
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uMaterial.shininess);
    vec3 specular = uLight.specular * spec * texture2D(uMaterial.specular, vTextureCoord).xyz;

    // result
    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, 1.0);
}
