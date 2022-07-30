out vec2 st;

void main() {
    st = 1.0 - uv;
    gl_Position = vec4(position, 1.0);
}
