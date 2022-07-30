precision highp float;

in vec2 st;

uniform float time;
uniform sampler2D image;
uniform sampler2D segmentationMask;
uniform vec2 poseLandmarks[33];
uniform vec2 faceLandmarks[478];
uniform vec2 leftHandLandmarks[21];
uniform vec2 rightHandLandmarks[21];

vec3 drawLandmark(vec2 landmark) {
    vec3 color = vec3(0.0);

    float dist = distance(st, landmark);

    return vec3(smoothstep(0.005, 0.0, dist));
}

void main()	{
    vec4 color = vec4(0.0);
    
    color = texture2D(image, st);
    color.g += texture2D(segmentationMask, st).r * 0.5;

    for (int i = 0; i < 33; i++) {
        color.rgb += drawLandmark(poseLandmarks[i]);
    }

    for (int i = 0; i < 478; i++) {
        color.rgb += drawLandmark(faceLandmarks[i]);
    }

    for (int i = 0; i < 21; i++) {
        color.rgb += drawLandmark(leftHandLandmarks[i]);
        color.rgb += drawLandmark(rightHandLandmarks[i]);
    }

    gl_FragColor = color;
}
