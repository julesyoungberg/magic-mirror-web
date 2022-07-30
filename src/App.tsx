import { useLayoutEffect, useRef } from "react";

import { startHolisticDetector } from "./holistic";

import "./App.css";

export default function App() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useLayoutEffect(() => {
        if (!videoRef.current || !canvasRef.current) {
            return;
        }

        startHolisticDetector(videoRef.current, canvasRef.current);
    }, [videoRef.current, canvasRef.current]);

    return (
        <div className="container">
            <video className="input_video" ref={videoRef} />
            <div className="canvas-container">
                <canvas
                    className="output_canvas"
                    width="1280px"
                    height="720px"
                    ref={canvasRef}
                />
            </div>
        </div>
    );
}
