out vec2 st;

void main() {
    st = vec2(uv.x, 1.0 - uv.y);
    gl_Position = vec4(position, 1.0);
}
