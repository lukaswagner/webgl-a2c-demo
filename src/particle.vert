precision highp float;

layout(location = 0) in vec2 a_uv;
layout(location = 1) in vec3 a_pos;

uniform mat4 u_viewProjection;
uniform float u_aspect;

const float c_pointSize = 0.4;

out vec3 v_color;
out vec2 v_uv;

vec3 hsl2rgb(vec3 c)
{
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

void main()
{
    v_color = hsl2rgb(vec3(float(gl_InstanceID) * 0.1, 1., .5));
    v_uv = a_uv;

    vec4 position = u_viewProjection * vec4(a_pos, 1.0);

    vec2 pointSize = vec2(c_pointSize);
    pointSize.x *= u_aspect;
    pointSize /= position.z;

    position.xy = position.xy + a_uv * pointSize * vec2(position.w);
    gl_Position = position;
}
