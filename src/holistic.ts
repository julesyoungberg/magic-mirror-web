// based on: https://codepen.io/mediapipe/pen/LYRRYEw
import * as cameraUtils from "@mediapipe/camera_utils";
import * as mpHolistic from "@mediapipe/holistic";
import cv from "@techstark/opencv-js";
import Delaunator from "delaunator";
import * as THREE from "three";

import fragmentShader from "./glsl/main.frag";
import vertexShader from "./glsl/main.vert";

import { FACE_MESH_POINTS } from "./landmarks";
import { Filter, FILTERS } from "./filters";

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

function prepareLandmarks(landmarks: mpHolistic.NormalizedLandmarkList) {
    return landmarks.reduce<number[]>(
        (acc, l) => [...acc, l.x, l.y, l.visibility || 0.0],
        []
    );
}

function preparePoints(landmarks: mpHolistic.NormalizedLandmarkList) {
    return landmarks
        .map(
            (l) =>
                new THREE.Vector3(
                    l.x * 2.0 - 1.0,
                    (1.0 - l.y) * 2.0 - 1.0,
                    l.z * 0.5 - 0.1
                )
        )
        .filter(Boolean);
}

class HolisticUniforms {
    private initialPoseLandmarks: number[];
    private initialFaceLandmarks: number[];
    private initialHandLandmarks: number[];
    private data: Record<
        | "time"
        | "image"
        | "segmentationMask"
        | "poseLandmarks"
        | "faceLandmarks"
        | "leftHandLandmarks"
        | "rightHandLandmarks",
        { value: any }
    >;

    constructor(imageTexture: THREE.Texture) {
        const createLandmarksArray = (length: number) =>
            new Array(length * 3).fill(0);
        this.initialPoseLandmarks = createLandmarksArray(14);
        this.initialFaceLandmarks = createLandmarksArray(478);
        this.initialHandLandmarks = createLandmarksArray(21);

        this.data = {
            time: { value: 1.0 },
            image: { value: imageTexture },
            segmentationMask: { value: imageTexture },
            poseLandmarks: {
                value: this.initialPoseLandmarks,
            },
            faceLandmarks: {
                value: this.initialFaceLandmarks,
            },
            leftHandLandmarks: {
                value: this.initialHandLandmarks,
            },
            rightHandLandmarks: {
                value: this.initialHandLandmarks,
            },
        };
    }

    getData() {
        return this.data;
    }

    updateTime() {
        this.data.time.value = performance.now() / 1000;
    }

    update(results: mpHolistic.Results) {
        this.updateTime();
        this.data.image.value = new THREE.CanvasTexture(results.image);
        this.data.segmentationMask.value = new THREE.CanvasTexture(
            results.segmentationMask
        );

        if (results.faceLandmarks) {
            this.data.faceLandmarks.value = prepareLandmarks(
                results.faceLandmarks
            );
        } else {
            this.data.faceLandmarks.value = this.initialFaceLandmarks;
        }

        if (results.poseLandmarks) {
            this.data.poseLandmarks.value = prepareLandmarks(
                results.poseLandmarks
            );
        } else {
            this.data.poseLandmarks.value = this.initialPoseLandmarks;
        }

        if (results.leftHandLandmarks) {
            this.data.leftHandLandmarks.value = prepareLandmarks(
                results.leftHandLandmarks
            );
        } else {
            this.data.leftHandLandmarks.value = this.initialHandLandmarks;
        }

        if (results.rightHandLandmarks) {
            this.data.rightHandLandmarks.value = prepareLandmarks(
                results.rightHandLandmarks
            );
        } else {
            this.data.rightHandLandmarks.value = this.initialHandLandmarks;
        }
    }
}

function generateGeometryFromAnnotations(
    annotations: number[][],
    maskWidth: number,
    maskHeight: number
) {
    const maskPoints = annotations.map((p) => [
        1.0 - p[0] / maskWidth,
        1.0 - p[1] / maskHeight,
    ]);
    const maskDelaunay = Delaunator.from(maskPoints);
    console.log(maskDelaunay);
    const mask3DPoints = maskPoints.map(
        (p) => new THREE.Vector3(p[0] * 2.0 - 1.0, p[1] * 2.0 - 1.0, -0.1)
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(mask3DPoints);
    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            new Float32Array(mask3DPoints.map((p) => p.toArray()).flat()),
            3
        )
    );
    geometry.setAttribute(
        "uv",
        new THREE.BufferAttribute(
            new Float32Array(maskPoints.map((p) => [1.0 - p[0], p[1]]).flat()),
            2
        )
    );
    geometry.setIndex([...maskDelaunay.triangles]);
    // geometry.computeVertexNormals();
    return geometry;
}

function loadFilter(filter: Filter) {
    const filterGeometry = generateGeometryFromAnnotations(
        filter.annotations,
        filter.width,
        filter.height
    );
    const loader = new THREE.TextureLoader();
    const filterTexture = loader.load(
        filter.path // "https://threejs.org/examples/textures/uv_grid_opengl.jpg"
    ); //filter.path);
    return { filterGeometry, filterTexture };
}

function createPointsCloud(geometry: THREE.BufferGeometry) {
    return new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ color: 0x99ccff, size: 2 })
    );
}

function getHolisticParticles(results: mpHolistic.Results) {
    const points: THREE.Vector3[] = [];

    if (results.faceLandmarks) {
        points.push(...preparePoints(results.faceLandmarks));
    }

    if (results.poseLandmarks) {
        points.push(...preparePoints(results.poseLandmarks));
    }

    if (results.leftHandLandmarks) {
        points.push(...preparePoints(results.leftHandLandmarks));
    }

    if (results.rightHandLandmarks) {
        points.push(...preparePoints(results.rightHandLandmarks));
    }

    if (points.length === 0) {
        return undefined;
    }

    const positions = new Float32Array(3 * points.length);
    points.forEach((p, i) => p.toArray(positions, i * 3));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ size: 10.0 })
    );
    return particles;
}

class HolisticFilter {
    camera: THREE.OrthographicCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    filterMesh: THREE.Mesh;
    uniforms: HolisticUniforms;
    prevFacePoints?: THREE.Vector3[];
    prevImageGray?: cv.Mat;

    constructor(
        readonly canvasElement: HTMLCanvasElement,
        readonly videoElement: HTMLVideoElement
    ) {
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ canvas: canvasElement });
        // renderer.setPixelRatio(window.devicePixelRatio);

        const { filterGeometry, filterTexture } = loadFilter(FILTERS.skeleton);
        this.filterMesh = new THREE.Mesh(
            filterGeometry,
            new THREE.MeshBasicMaterial({
                map: filterTexture,
                alphaMap: filterTexture,
                transparent: true,
                opacity: 0.6,
                // blending: THREE.AdditiveBlending,
            })
        );
        this.scene.add(this.filterMesh);
        // filterMesh.geometry.attributes.position.needsUpdate = true;
        this.scene.add(createPointsCloud(filterGeometry));

        const planeGeometry = new THREE.PlaneGeometry(2, 2);
        const canvasTexture = new THREE.CanvasTexture(canvasElement);
        this.uniforms = new HolisticUniforms(canvasTexture); // filterTexture);
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms.getData(),
            vertexShader,
            fragmentShader,
        });
        const mesh = new THREE.Mesh(planeGeometry, material);
        this.scene.add(mesh);
    }

    getPoints = (results: mpHolistic.Results) => {
        if (!results.faceLandmarks) {
            return undefined;
        }

        const allFacePoints = preparePoints(results.faceLandmarks);
        const facePoints = FACE_MESH_POINTS.map((p) => allFacePoints[p]);

        // @todo optical flow
        // const imgMat = cv.imread(this.videoElement);
        // const imgGray = imgMat.clone();
        // cv.cvtColor(imgMat, imgGray, cv.COLOR_BGR2GRAY);

        // if (!this.prevFacePoints) {
        //     this.prevFacePoints = facePoints;
        // }

        // if (!this.prevImageGray) {
        //     this.prevImageGray = imgGray;
        // }

        // const facePointsNext = cv.calcOpticalFlowPyrLK(
        //     this.prevImageGray,
        //     imgGray,
        //     this.prevFacePoints,
        //     facePoints,
        //     imgGray.clone(),
        //     imgGray.clone(),
        //     [101, 101],
        //     15,
        //     [cv.TermCriteria_EPS | cv.TermCriteria_COUNT, 20, 0.001]
        // );

        this.prevFacePoints = facePoints;
        // this.prevImageGray = imgGray;

        return facePoints;
    };

    onResults = (results: mpHolistic.Results) => {
        document.body.classList.add("loaded");

        // Remove landmarks we don't want to draw.
        removeLandmarks(results);
        this.uniforms.update(results);

        const facePoints = this.getPoints(results);
        if (!facePoints) {
            return;
        }

        facePoints.forEach((p, i) =>
            p.toArray(this.filterMesh.geometry.attributes.position.array, i * 3)
        );

        this.filterMesh.geometry.attributes.position.needsUpdate = true;
        // filterMesh.geometry.computeVertexNormals();
        // filterMesh.geometry.computeBoundingBox();
        // filterMesh.geometry.computeBoundingSphere();

        // const particles = getHolisticParticles(results);
        // if (particles) {
        //     scene.add(particles);
        // }

        this.renderer.render(this.scene, this.camera);

        // if (particles) {
        //     scene.remove(particles);
        // }
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
        // enableFaceGeometry: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        //mrefineFaceLandmarks: true, // doesn't work with enableFaceGeometry
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    const holisticFilter = new HolisticFilter(canvasElement, videoElement);

    holistic.onResults(holisticFilter.onResults);

    const camera = new cameraUtils.Camera(videoElement, {
        onFrame: async () => {
            await holistic.send({ image: videoElement });
        },
        width: 1280,
        height: 720,
    });

    camera.start();
}
