precision highp float;

in vec2 st;

uniform float time;
uniform sampler2D image;
uniform sampler2D segmentationMask;
uniform vec2 poseLandmarks[14];
uniform vec2 faceLandmarks[478];
uniform vec2 leftHandLandmarks[21];
uniform vec2 rightHandLandmarks[21];

#define LEFT_SHOULDER 0
#define RIGHT_SHOULDER 1
#define LEFT_ELBOW 2
#define RIGHT_ELBOW 3
#define LEFT_HIP 4
#define RIGHT_HIP 5
#define LEFT_KNEE 6
#define RIGHT_KNEE 7
#define LEFT_ANKLE 8
#define RIGHT_ANKLE 9
#define LEFT_HEEL 10
#define RIGHT_HEEL 11
#define LEFT_FOOT 12
#define RIGHT_FOOT 13

vec3 landmark(vec2 landmark) {
    vec3 color = vec3(0.0);

    float dist = distance(st, landmark);

    return vec3(smoothstep(0.002, 0.0, dist));
}

float edges() {
    const vec2 resolution = vec2(1280.0, 720.0);
    vec2 stp = vec2(0.005); // 1.0 / resolution;

    float center = texture2D(segmentationMask, st).r;
    float left = texture2D(segmentationMask, st - stp * vec2(1.0, 0.0)).r;
    float topLeft = texture2D(segmentationMask, st + stp * vec2(-1.0, 1.0)).r;
    float top = texture2D(segmentationMask, st + stp * vec2(0.0, 1.0)).r;
    float topRight = texture2D(segmentationMask, st + stp).r;
    float right = texture2D(segmentationMask, st + stp * vec2(1.0, 0.0)).r;
    float bottomRight = texture2D(segmentationMask, st + stp * vec2(1.0, -1.0)).r;
    float bottom = texture2D(segmentationMask, st - stp * vec2(0.0, 1.0)).r;
    float bottomLeft = texture2D(segmentationMask, st - stp).r;

    return (abs(center - left) + abs(center - topLeft) + abs(center - top) 
        + abs(center - topRight) + abs(center - right) + abs(center - bottomRight)
        + abs(center - bottom) + abs(center - bottomLeft)) / 8.0;
}

float lineDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * t);
}

float line(vec2 a, vec2 b) {
    float d = lineDist(st, a, b);
    float m = smoothstep(0.005, 0.0, d);
    return m;
}

vec3 hand(vec2 handLandmarks[21]) {
    vec3 color = vec3(0.0);

    // thumnb
    color += line(handLandmarks[0], handLandmarks[1]);
    color += line(handLandmarks[1], handLandmarks[2]);
    color += line(handLandmarks[2], handLandmarks[3]);
    color += line(handLandmarks[3], handLandmarks[4]);

    // palm
    color += line(handLandmarks[0], handLandmarks[5]);
    color += line(handLandmarks[5], handLandmarks[9]);
    color += line(handLandmarks[9], handLandmarks[13]);
    color += line(handLandmarks[13], handLandmarks[17]);
    color += line(handLandmarks[17], handLandmarks[0]);

    // index finger
    color += line(handLandmarks[5], handLandmarks[6]);
    color += line(handLandmarks[6], handLandmarks[7]);
    color += line(handLandmarks[7], handLandmarks[8]);

    // middle finger
    color += line(handLandmarks[9], handLandmarks[10]);
    color += line(handLandmarks[10], handLandmarks[11]);
    color += line(handLandmarks[11], handLandmarks[12]);

    // ring finger
    color += line(handLandmarks[13], handLandmarks[14]);
    color += line(handLandmarks[14], handLandmarks[15]);
    color += line(handLandmarks[15], handLandmarks[16]);

    // pinky
    color += line(handLandmarks[17], handLandmarks[18]);
    color += line(handLandmarks[18], handLandmarks[19]);
    color += line(handLandmarks[19], handLandmarks[20]);

    return color;
}

vec3 faceOval() {
    vec3 color = vec3(0.0);

    color += line(faceLandmarks[10], faceLandmarks[338]);
    color += line(faceLandmarks[338], faceLandmarks[297]);
    color += line(faceLandmarks[297], faceLandmarks[332]);
    color += line(faceLandmarks[332], faceLandmarks[284]);
    color += line(faceLandmarks[284], faceLandmarks[251]);
    color += line(faceLandmarks[251], faceLandmarks[389]);
    color += line(faceLandmarks[389], faceLandmarks[356]);
    color += line(faceLandmarks[356], faceLandmarks[454]);
    color += line(faceLandmarks[454], faceLandmarks[323]);
    color += line(faceLandmarks[323], faceLandmarks[361]);
    color += line(faceLandmarks[361], faceLandmarks[288]);
    color += line(faceLandmarks[288], faceLandmarks[397]);
    color += line(faceLandmarks[397], faceLandmarks[365]);
    color += line(faceLandmarks[365], faceLandmarks[379]);
    color += line(faceLandmarks[379], faceLandmarks[378]);
    color += line(faceLandmarks[378], faceLandmarks[400]);
    color += line(faceLandmarks[400], faceLandmarks[377]);
    color += line(faceLandmarks[377], faceLandmarks[152]);
    color += line(faceLandmarks[152], faceLandmarks[148]);
    color += line(faceLandmarks[148], faceLandmarks[176]);
    color += line(faceLandmarks[176], faceLandmarks[149]);
    color += line(faceLandmarks[149], faceLandmarks[150]);
    color += line(faceLandmarks[150], faceLandmarks[136]);
    color += line(faceLandmarks[136], faceLandmarks[172]);
    color += line(faceLandmarks[172], faceLandmarks[58]);
    color += line(faceLandmarks[58], faceLandmarks[132]);
    color += line(faceLandmarks[132], faceLandmarks[93]);
    color += line(faceLandmarks[93], faceLandmarks[234]);
    color += line(faceLandmarks[234], faceLandmarks[127]);
    color += line(faceLandmarks[127], faceLandmarks[162]);
    color += line(faceLandmarks[162], faceLandmarks[21]);
    color += line(faceLandmarks[21], faceLandmarks[54]);
    color += line(faceLandmarks[54], faceLandmarks[103]);
    color += line(faceLandmarks[103], faceLandmarks[67]);
    color += line(faceLandmarks[67], faceLandmarks[109]);
    color += line(faceLandmarks[109], faceLandmarks[10]);

    return color;
}

vec3 lips() {
    vec3 color = vec3(0.0);

    color += line(faceLandmarks[61], faceLandmarks[146]);
    color += line(faceLandmarks[146], faceLandmarks[91]);
    color += line(faceLandmarks[91], faceLandmarks[181]);
    color += line(faceLandmarks[181], faceLandmarks[84]);
    color += line(faceLandmarks[84], faceLandmarks[17]);
    color += line(faceLandmarks[17], faceLandmarks[314]);
    color += line(faceLandmarks[314], faceLandmarks[405]);
    color += line(faceLandmarks[405], faceLandmarks[321]);
    color += line(faceLandmarks[321], faceLandmarks[375]);
    color += line(faceLandmarks[375], faceLandmarks[291]);
    color += line(faceLandmarks[61], faceLandmarks[185]);
    color += line(faceLandmarks[185], faceLandmarks[40]);
    color += line(faceLandmarks[40], faceLandmarks[39]);
    color += line(faceLandmarks[39], faceLandmarks[37]);
    color += line(faceLandmarks[37], faceLandmarks[0]);
    color += line(faceLandmarks[0], faceLandmarks[267]);
    color += line(faceLandmarks[267], faceLandmarks[269]);
    color += line(faceLandmarks[269], faceLandmarks[270]);
    color += line(faceLandmarks[270], faceLandmarks[409]);
    color += line(faceLandmarks[409], faceLandmarks[291]);
    color += line(faceLandmarks[78], faceLandmarks[95]);
    color += line(faceLandmarks[95], faceLandmarks[88]);
    color += line(faceLandmarks[88], faceLandmarks[178]);
    color += line(faceLandmarks[178], faceLandmarks[87]);
    color += line(faceLandmarks[87], faceLandmarks[14]);
    color += line(faceLandmarks[14], faceLandmarks[317]);
    color += line(faceLandmarks[317], faceLandmarks[402]);
    color += line(faceLandmarks[402], faceLandmarks[318]);
    color += line(faceLandmarks[318], faceLandmarks[324]);
    color += line(faceLandmarks[324], faceLandmarks[308]);
    color += line(faceLandmarks[78], faceLandmarks[191]);
    color += line(faceLandmarks[191], faceLandmarks[80]);
    color += line(faceLandmarks[80], faceLandmarks[81]);
    color += line(faceLandmarks[81], faceLandmarks[82]);
    color += line(faceLandmarks[82], faceLandmarks[13]);
    color += line(faceLandmarks[13], faceLandmarks[312]);
    color += line(faceLandmarks[312], faceLandmarks[311]);
    color += line(faceLandmarks[311], faceLandmarks[310]);
    color += line(faceLandmarks[310], faceLandmarks[415]);
    color += line(faceLandmarks[415], faceLandmarks[308]);

    return color;
}

vec3 leftEye() {
    vec3 color = vec3(0.0);

    color += line(faceLandmarks[263], faceLandmarks[249]);
    color += line(faceLandmarks[249], faceLandmarks[390]);
    color += line(faceLandmarks[390], faceLandmarks[373]);
    color += line(faceLandmarks[373], faceLandmarks[374]);
    color += line(faceLandmarks[374], faceLandmarks[380]);
    color += line(faceLandmarks[380], faceLandmarks[381]);
    color += line(faceLandmarks[381], faceLandmarks[382]);
    color += line(faceLandmarks[382], faceLandmarks[362]);
    color += line(faceLandmarks[263], faceLandmarks[466]);
    color += line(faceLandmarks[466], faceLandmarks[388]);
    color += line(faceLandmarks[388], faceLandmarks[387]);
    color += line(faceLandmarks[387], faceLandmarks[386]);
    color += line(faceLandmarks[386], faceLandmarks[385]);
    color += line(faceLandmarks[385], faceLandmarks[384]);
    color += line(faceLandmarks[384], faceLandmarks[398]);
    color += line(faceLandmarks[398], faceLandmarks[362]);

    return color;
}

vec3 rightEye() {
    vec3 color = vec3(0.0);

    color += line(faceLandmarks[33], faceLandmarks[7]);
    color += line(faceLandmarks[7], faceLandmarks[163]);
    color += line(faceLandmarks[163], faceLandmarks[144]);
    color += line(faceLandmarks[144], faceLandmarks[145]);
    color += line(faceLandmarks[145], faceLandmarks[153]);
    color += line(faceLandmarks[153], faceLandmarks[154]);
    color += line(faceLandmarks[154], faceLandmarks[155]);
    color += line(faceLandmarks[155], faceLandmarks[133]);
    color += line(faceLandmarks[33], faceLandmarks[246]);
    color += line(faceLandmarks[246], faceLandmarks[161]);
    color += line(faceLandmarks[161], faceLandmarks[160]);
    color += line(faceLandmarks[160], faceLandmarks[159]);
    color += line(faceLandmarks[159], faceLandmarks[158]);
    color += line(faceLandmarks[158], faceLandmarks[157]);
    color += line(faceLandmarks[157], faceLandmarks[173]);
    color += line(faceLandmarks[173], faceLandmarks[133]);

    return color;
}

vec3 leftEyebrow() {
    vec3 color = vec3(0.0);

    color += line(faceLandmarks[276], faceLandmarks[283]);
    color += line(faceLandmarks[283], faceLandmarks[282]);
    color += line(faceLandmarks[282], faceLandmarks[295]);
    color += line(faceLandmarks[295], faceLandmarks[285]);
    color += line(faceLandmarks[300], faceLandmarks[293]);
    color += line(faceLandmarks[293], faceLandmarks[334]);
    color += line(faceLandmarks[334], faceLandmarks[296]);
    color += line(faceLandmarks[296], faceLandmarks[336]);

    return color;
}

vec3 rightEyebrow() {
    vec3 color = vec3(0.0);

    color += line(faceLandmarks[46], faceLandmarks[53]);
    color += line(faceLandmarks[53], faceLandmarks[52]);
    color += line(faceLandmarks[52], faceLandmarks[65]);
    color += line(faceLandmarks[65], faceLandmarks[55]);
    color += line(faceLandmarks[70], faceLandmarks[63]);
    color += line(faceLandmarks[63], faceLandmarks[105]);
    color += line(faceLandmarks[105], faceLandmarks[66]);
    color += line(faceLandmarks[66], faceLandmarks[107]);

    return color;
}

void main()	{
    vec3 color = vec3(0.0);
    
    // color = texture2D(image, st).rgb;
    // color.g += texture2D(segmentationMask, st).r * 0.5;
    color = texture2D(image, st).rgb; // * texture2D(segmentationMask, st).r;

    // for (int i = 0; i < 478; i++) {
    //     color += landmark(faceLandmarks[i]);
    // }

    // for (int i = 0; i < 21; i++) {
    //     color += landmark(leftHandLandmarks[i]);
    //     color += landmark(rightHandLandmarks[i]);
    // }

    color += line(poseLandmarks[LEFT_SHOULDER], poseLandmarks[RIGHT_SHOULDER]);

    color += line(poseLandmarks[LEFT_SHOULDER], poseLandmarks[LEFT_ELBOW]);

    color += line(poseLandmarks[RIGHT_SHOULDER], poseLandmarks[RIGHT_ELBOW]);

    if (leftHandLandmarks[0].x > 0.0 && leftHandLandmarks[0].y > 0.0) {
        color += line(poseLandmarks[LEFT_ELBOW], leftHandLandmarks[0]);
        color += hand(leftHandLandmarks);
    }

    if (rightHandLandmarks[0].x > 0.0 && rightHandLandmarks[0].y > 0.0) {
        color += line(poseLandmarks[RIGHT_ELBOW], rightHandLandmarks[0]);
        color += hand(rightHandLandmarks);
    }

    color += line(poseLandmarks[LEFT_SHOULDER], poseLandmarks[LEFT_HIP]);

    color += line(poseLandmarks[RIGHT_SHOULDER], poseLandmarks[RIGHT_HIP]);

    color += line(poseLandmarks[LEFT_HIP], poseLandmarks[RIGHT_HIP]);

    color += line(poseLandmarks[LEFT_HIP], poseLandmarks[LEFT_KNEE]);

    color += line(poseLandmarks[RIGHT_HIP], poseLandmarks[RIGHT_KNEE]);

    color += line(poseLandmarks[LEFT_KNEE], poseLandmarks[LEFT_ANKLE]);

    color += line(poseLandmarks[RIGHT_KNEE], poseLandmarks[RIGHT_ANKLE]);

    color += line(poseLandmarks[LEFT_ANKLE], poseLandmarks[LEFT_HEEL]);

    color += line(poseLandmarks[RIGHT_ANKLE], poseLandmarks[RIGHT_HEEL]);

    color += line(poseLandmarks[LEFT_HEEL], poseLandmarks[LEFT_FOOT]);

    color += line(poseLandmarks[RIGHT_HEEL], poseLandmarks[RIGHT_FOOT]);

    color += faceOval();
    color += lips();
    color += leftEye();
    color += rightEye();
    color += leftEyebrow();
    color += rightEyebrow();

    // color += smoothstep(0.0, 0.05, edges());

    gl_FragColor = vec4(color, 1.0);
}
