precision highp float;

in vec2 st;

uniform float time;
uniform sampler2D image;
uniform sampler2D segmentationMask;

void main()	{
    // gl_FragColor = vec4(st, sin(time) * 0.5 + 0.5, 1);
    // gl_FragColor = texture2D(segmentationMask, vec2(1.0 - st.x, st.y));
    vec2 texCoord = vec2(1.0 - st.x, st.y);
    vec4 color = texture2D(image, texCoord);
    color.g += texture2D(segmentationMask, texCoord).r * 0.5;
    gl_FragColor = color;
}
