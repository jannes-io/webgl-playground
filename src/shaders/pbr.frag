#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#extension GL_OES_standard_derivatives : enable

#define PI 3.14159265359

varying vec2 vTextureCoord;
varying vec3 vWorldPos;
varying vec3 vNormal;

struct PointLight {
    vec3 position;
    vec3 color;
};

struct Material {
    sampler2D albedo;
    sampler2D normal;
    sampler2D metallic;
    sampler2D roughness;
    sampler2D ao;
};

uniform vec3 uViewPos;
uniform Material uMaterial;
#define NR_POINT_LIGHTS 4
uniform PointLight uPointLights[NR_POINT_LIGHTS];

vec3 getNormalFromMap()
{
    vec3 tangentNormal = texture2D(uMaterial.normal, vTextureCoord).xyz * 2.0 - 1.0;

    vec3 Q1 = dFdx(vWorldPos);
    vec3 Q2 = dFdy(vWorldPos);
    vec2 st1 = dFdx(vTextureCoord);
    vec2 st2 = dFdx(vTextureCoord);

    vec3 N = normalize(vNormal);
    vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float distributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

float geometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

void main()
{
    vec3 albedo = pow(texture2D(uMaterial.albedo, vTextureCoord).rgb, vec3(2.2));
    float metallic = texture2D(uMaterial.metallic, vTextureCoord).r;
    float roughness = texture2D(uMaterial.roughness, vTextureCoord).r;
    float ao = texture2D(uMaterial.ao, vTextureCoord).r;

    vec3 N = getNormalFromMap();
    vec3 V = normalize(uViewPos - vWorldPos);

    vec3 Lo = vec3(0.0);
    for (int i = 0; i < NR_POINT_LIGHTS; i++)
    {
        vec3 lightPosDiff = uPointLights[i].position - vWorldPos;
        vec3 L = normalize(lightPosDiff);
        vec3 H = normalize(V + L);

        float distance = length(lightPosDiff);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = uPointLights[i].color * attenuation;

        vec3 F0 = vec3(0.04);
        F0 = mix(F0, albedo, metallic);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        float NDF = distributionGGX(N, H, roughness);
        float G = geometrySmith(N, V, L, roughness);

        float NdotL = max(dot(N, L), 0.0);

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.0001;
        vec3 specular = numerator / denominator;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    vec3 ambient = vec3(0.03) * albedo * ao;
    vec3 color = ambient + Lo;

    color /= color + vec3(1.0);
    color = pow(color, vec3(1.0 / 2.2));

    gl_FragColor = vec4(color, 1.0);
}
