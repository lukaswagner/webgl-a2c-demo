precision highp float;
precision highp int;

layout(location = 0) out vec4 f_color;

in vec3 v_color;
in vec2 v_uv;

void main()
{
    float radius = length(v_uv);
    float edge = 0.95;
    float feather = fwidth(radius) / 2.0;
    float alpha = 1.0 - smoothstep(edge - feather, edge + feather, radius);

    f_color = vec4(v_color, alpha);
}
