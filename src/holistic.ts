// based on: https://codepen.io/mediapipe/pen/LYRRYEw
import * as cameraUtils from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";
import * as mpHolistic from "@mediapipe/holistic";
import * as THREE from "three";

import fragmentShader from "./glsl/main.frag";
import vertexShader from "./glsl/main.vert";

const config = {
    locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@` +
        `${mpHolistic.VERSION}/${file}`,
};

function removeElements(
    landmarks: mpHolistic.NormalizedLandmarkList,
    elements: number[]
) {
    for (const element of elements) {
        delete landmarks[element];
    }
}

function removeLandmarks(results: mpHolistic.Results) {
    if (results.poseLandmarks) {
        removeElements(
            results.poseLandmarks,
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]
        );
    }
}

function connect(
    ctx: CanvasRenderingContext2D,
    connectors: Array<
        [mpHolistic.NormalizedLandmark, mpHolistic.NormalizedLandmark]
    >
): void {
    const canvas = ctx.canvas;
    for (const connector of connectors) {
        const from = connector[0];
        const to = connector[1];
        if (from && to) {
            if (
                from.visibility &&
                to.visibility &&
                (from.visibility < 0.1 || to.visibility < 0.1)
            ) {
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
            ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
            ctx.stroke();
        }
    }
}

async function makeOnResults3D(canvasElement: HTMLCanvasElement) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const scene = new THREE.Scene();

    const geometry = new THREE.PlaneGeometry(2, 2);

    const imageTexture = new THREE.CanvasTexture(canvasElement);

    const createLandmarksArray = (length: number) => new Array(length * 2).fill(0);

    const initialPoseLandmarks = createLandmarksArray(14);
    const initialFaceLandmarks = createLandmarksArray(478);
    const initialHandLandmarks = createLandmarksArray(21);

    const uniforms = {
        time: { value: 1.0 },
        image: { value: imageTexture },
        segmentationMask: { value: imageTexture },
        poseLandmarks: {
            value: initialPoseLandmarks,
        },
        faceLandmarks: {
            value: initialFaceLandmarks,
        },
        leftHandLandmarks: {
            value: initialHandLandmarks,
        },
        rightHandLandmarks: {
            value: initialHandLandmarks,
        },
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader,
        fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement });
    // renderer.setPixelRatio(window.devicePixelRatio);

    const prepareLandmarks = (landmarks: mpHolistic.NormalizedLandmarkList) => 
        landmarks.reduce<number[]>((acc, l) => [...acc, l.x, l.y], []);

    return (results: mpHolistic.Results) => {
        document.body.classList.add("loaded");

        // Remove landmarks we don't want to draw.
        removeLandmarks(results);

        // Update the frame rate.
        // fpsControl.tick();

        uniforms.image.value = new THREE.CanvasTexture(results.image);

        uniforms.segmentationMask.value = new THREE.CanvasTexture(results.segmentationMask);

        if (results.poseLandmarks) {
            uniforms.poseLandmarks.value = prepareLandmarks(results.poseLandmarks);
        } else {
            uniforms.poseLandmarks.value = initialPoseLandmarks;
        }

        if (results.faceLandmarks) {
            uniforms.faceLandmarks.value = prepareLandmarks(results.faceLandmarks);
        } else {
            uniforms.faceLandmarks.value = initialFaceLandmarks;
        }

        if (results.leftHandLandmarks) {
            uniforms.leftHandLandmarks.value = prepareLandmarks(results.leftHandLandmarks);
        } else {
            uniforms.leftHandLandmarks.value = initialHandLandmarks;
        }

        if (results.rightHandLandmarks) {
            uniforms.rightHandLandmarks.value = prepareLandmarks(results.rightHandLandmarks);
        } else {
            uniforms.rightHandLandmarks.value = initialHandLandmarks;
        }

        uniforms.time.value = performance.now() / 1000;

        renderer.render(scene, camera);
    };
}

let activeEffect = "mask";
function makeOnResults2D(canvasElement: HTMLCanvasElement) {
    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) {
        throw new Error("unavle to get drawing context");
    }

    return (results: mpHolistic.Results) => {
        document.body.classList.add("loaded");

        // Remove landmarks we don't want to draw.
        removeLandmarks(results);

        // Update the frame rate.
        // fpsControl.tick();

        // Draw the overlays.
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (results.segmentationMask) {
            canvasCtx.drawImage(
                results.segmentationMask,
                0,
                0,
                canvasElement.width,
                canvasElement.height
            );

            // Only overwrite existing pixels.
            if (activeEffect === "mask" || activeEffect === "both") {
                canvasCtx.globalCompositeOperation = "source-in";
                // This can be a color or a texture or whatever...
                canvasCtx.fillStyle = "#00FF007F";
                canvasCtx.fillRect(
                    0,
                    0,
                    canvasElement.width,
                    canvasElement.height
                );
            } else {
                canvasCtx.globalCompositeOperation = "source-out";
                canvasCtx.fillStyle = "#0000FF7F";
                canvasCtx.fillRect(
                    0,
                    0,
                    canvasElement.width,
                    canvasElement.height
                );
            }

            // Only overwrite missing pixels.
            canvasCtx.globalCompositeOperation = "destination-atop";
            canvasCtx.drawImage(
                results.image,
                0,
                0,
                canvasElement.width,
                canvasElement.height
            );

            canvasCtx.globalCompositeOperation = "source-over";
        } else {
            canvasCtx.drawImage(
                results.image,
                0,
                0,
                canvasElement.width,
                canvasElement.height
            );
        }

        // Connect elbows to hands. Do this first so that the other graphics will draw
        // on top of these marks.
        canvasCtx.lineWidth = 5;
        if (results.poseLandmarks) {
            if (results.rightHandLandmarks) {
                canvasCtx.strokeStyle = "white";
                connect(canvasCtx, [
                    [
                        results.poseLandmarks[
                            mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW
                        ],
                        results.rightHandLandmarks[0],
                    ],
                ]);
            }
            if (results.leftHandLandmarks) {
                canvasCtx.strokeStyle = "white";
                connect(canvasCtx, [
                    [
                        results.poseLandmarks[
                            mpHolistic.POSE_LANDMARKS.LEFT_ELBOW
                        ],
                        results.leftHandLandmarks[0],
                    ],
                ]);
            }
        }

        // Pose...
        drawingUtils.drawConnectors(
            canvasCtx,
            results.poseLandmarks,
            mpHolistic.POSE_CONNECTIONS,
            { color: "white" }
        );
        drawingUtils.drawLandmarks(
            canvasCtx,
            Object.values(mpHolistic.POSE_LANDMARKS_LEFT).map(
                (index) => results.poseLandmarks[index]
            ),
            { visibilityMin: 0.65, color: "white", fillColor: "rgb(255,138,0)" }
        );
        drawingUtils.drawLandmarks(
            canvasCtx,
            Object.values(mpHolistic.POSE_LANDMARKS_RIGHT).map(
                (index) => results.poseLandmarks[index]
            ),
            { visibilityMin: 0.65, color: "white", fillColor: "rgb(0,217,231)" }
        );

        // Hands...
        drawingUtils.drawConnectors(
            canvasCtx,
            results.rightHandLandmarks,
            mpHolistic.HAND_CONNECTIONS,
            { color: "white" }
        );
        drawingUtils.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
            color: "white",
            fillColor: "rgb(0,217,231)",
            lineWidth: 2,
            radius: (data: drawingUtils.Data) => {
                return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1);
            },
        });
        drawingUtils.drawConnectors(
            canvasCtx,
            results.leftHandLandmarks,
            mpHolistic.HAND_CONNECTIONS,
            { color: "white" }
        );
        drawingUtils.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
            color: "white",
            fillColor: "rgb(255,138,0)",
            lineWidth: 2,
            radius: (data: drawingUtils.Data) => {
                return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1);
            },
        });

        // Face...
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_TESSELATION,
            { color: "#C0C0C070", lineWidth: 1 }
        );
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_RIGHT_EYE,
            { color: "rgb(0,217,231)" }
        );
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_RIGHT_EYEBROW,
            { color: "rgb(0,217,231)" }
        );
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_LEFT_EYE,
            { color: "rgb(255,138,0)" }
        );
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_LEFT_EYEBROW,
            { color: "rgb(255,138,0)" }
        );
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_FACE_OVAL,
            { color: "#E0E0E0", lineWidth: 5 }
        );
        drawingUtils.drawConnectors(
            canvasCtx,
            results.faceLandmarks,
            mpHolistic.FACEMESH_LIPS,
            { color: "#E0E0E0", lineWidth: 5 }
        );

        canvasCtx.restore();
    };
}

export async function startHolisticDetector(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
) {
    const holistic = new mpHolistic.Holistic(config);
    holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableFaceGeometry: false, // doesn't work
        enableSegmentation: true,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    holistic.onResults(await makeOnResults3D(canvasElement));

    const camera = new cameraUtils.Camera(videoElement, {
        onFrame: async () => {
            await holistic.send({ image: videoElement });
        },
        width: 1280,
        height: 720,
    });

    camera.start();
}
