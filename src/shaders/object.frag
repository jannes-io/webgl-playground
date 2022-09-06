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

struct DirLight {
    vec3 direction;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

uniform vec3 uViewPos;
uniform Material uMaterial;
uniform DirLight uDirLight;
#define NR_POINT_LIGHTS 4
uniform PointLight uPointLights[NR_POINT_LIGHTS];

vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir)
{
    vec3 lightDir = normalize(- light.direction);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uMaterial.shininess);

    // combine results
    vec3 ambient = light.ambient * texture2D(uMaterial.diffuse, vTextureCoord).xyz;
    vec3 diffuse = light.diffuse * diff * texture2D(uMaterial.diffuse, vTextureCoord).xyz;
    vec3 specular = light.specular * spec * texture2D(uMaterial.specular, vTextureCoord).xyz;
    return (ambient + diffuse + specular);
}

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
{
    vec3 lightDir = normalize(light.position - fragPos);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uMaterial.shininess);

    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

    // combine results
    vec3 ambient = light.ambient * texture2D(uMaterial.diffuse, vTextureCoord).xyz;
    vec3 diffuse = light.diffuse * diff * texture2D(uMaterial.diffuse, vTextureCoord).xyz;
    vec3 specular = light.specular * spec * texture2D(uMaterial.specular, vTextureCoord).xyz;

    return (ambient * attenuation + diffuse * attenuation + specular * attenuation);
}

void main() {
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(uViewPos - vFragPos);

    vec3 result = CalcDirLight(uDirLight, norm, viewDir);
    for (int i = 0; i < NR_POINT_LIGHTS; i++) {
        result += CalcPointLight(uPointLights[i], norm, vFragPos, viewDir);
    }

    // result
    float alpha = texture2D(uMaterial.diffuse, vTextureCoord).a;
    if (alpha < 0.05) {
        discard;
    }
    gl_FragColor = vec4(result, alpha);
}
