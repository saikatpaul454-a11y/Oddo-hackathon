import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

const FaceScanner = ({ onScanComplete, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, scanning, success, error
  const [errorMessage, setErrorMessage] = useState('');

  // Start webcam stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStatus('scanning');
      } catch (err) {
        console.error('Camera access error:', err);
        setStatus('error');
        setErrorMessage('Unable to access webcam. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      // Clean up stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Draw face-tracking graphic markers onto canvas
  useEffect(() => {
    if (status !== 'scanning') return;

    let animationFrameId;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');

    const drawGrid = () => {
      if (video.paused || video.ended) return;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw custom cyberpunk face tracker HUD
      ctx.strokeStyle = '#10b981'; // Emerald color
      ctx.lineWidth = 2;

      // Center rectangle bounds
      const rectX = canvas.width / 2 - 110;
      const rectY = canvas.height / 2 - 140;
      const rectW = 220;
      const rectH = 280;

      // Draw bracket corners
      ctx.beginPath();
      // Top Left
      ctx.moveTo(rectX, rectY + 30);
      ctx.lineTo(rectX, rectY);
      ctx.lineTo(rectX + 30, rectY);
      // Top Right
      ctx.moveTo(rectX + rectW - 30, rectY);
      ctx.lineTo(rectX + rectW, rectY);
      ctx.lineTo(rectX + rectW, rectY + 30);
      // Bottom Left
      ctx.moveTo(rectX, rectY + rectH - 30);
      ctx.lineTo(rectX, rectY + rectH);
      ctx.lineTo(rectX + 30, rectY + rectH);
      // Bottom Right
      ctx.moveTo(rectX + rectW - 30, rectY + rectH);
      ctx.lineTo(rectX + rectW, rectY + rectH);
      ctx.lineTo(rectX + rectW, rectY + rectH - 30);
      ctx.stroke();

      // Simulated facial coordinates
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      const points = [
        { x: canvas.width / 2, y: canvas.height / 2 - 50 }, // nose
        { x: canvas.width / 2 - 45, y: canvas.height / 2 - 80 }, // left eye
        { x: canvas.width / 2 + 45, y: canvas.height / 2 - 80 }, // right eye
        { x: canvas.width / 2, y: canvas.height / 2 + 40 }, // mouth
        { x: canvas.width / 2 - 75, y: canvas.height / 2 }, // left cheek
        { x: canvas.width / 2 + 75, y: canvas.height / 2 }, // right cheek
        { x: canvas.width / 2 - 60, y: canvas.height / 2 + 90 }, // jaw left
        { x: canvas.width / 2 + 60, y: canvas.height / 2 + 90 }, // jaw right
      ];

      points.forEach((pt) => {
        ctx.beginPath();
        // Add random jitter to simulate micro face movement
        const jitterX = (Math.random() - 0.5) * 1.5;
        const jitterY = (Math.random() - 0.5) * 1.5;
        ctx.arc(pt.x + jitterX, pt.y + jitterY, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw mesh connection lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(points[1].x, points[1].y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.lineTo(points[3].x, points[0].y);
      ctx.lineTo(points[4].x, points[4].y);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(drawGrid);
    };

    // Wait for video load metadata to establish aspect match
    video.addEventListener('play', () => {
      animationFrameId = requestAnimationFrame(drawGrid);
    });

    if (!video.paused) {
      animationFrameId = requestAnimationFrame(drawGrid);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  // Simulate scanning duration and complete verification
  useEffect(() => {
    if (status !== 'scanning') return;

    const timer = setTimeout(() => {
      setStatus('success');
      // Delay response bubble to let success screen show briefly
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        onScanComplete(true);
      }, 1500);
    }, 4000); // 4 seconds of scanning animation

    return () => clearTimeout(timer);
  }, [status, stream]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
        <h3 className="text-xl font-bold tracking-tight text-center mb-1">
          Facial Recognition Terminal
        </h3>
        <p className="text-xs text-slate-400 text-center mb-6">
          Align your face within the scanner boundaries
        </p>

        <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-2xl border border-indigo-500/20 bg-black shadow-inner">
          {/* Webcam hidden tag */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
            width="640"
            height="480"
          ></video>

          {/* Canvas scanner layer */}
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="h-full w-full object-cover"
          ></canvas>

          {/* Green laser overlay line */}
          {status === 'scanning' && (
            <div className="absolute left-0 w-full h-1 bg-emerald-500 shadow-md shadow-emerald-500/50 animate-scan"></div>
          )}

          {/* Core HUD status elements */}
          {status === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
              <Camera className="h-8 w-8 animate-pulse text-indigo-400" />
              <p className="text-xs text-slate-400">Initializing Camera...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
              <p className="text-sm font-semibold text-emerald-400">Face Match Verified</p>
              <p className="text-xs text-slate-500">Checking you in...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
              <ShieldAlert className="h-10 w-10 text-rose-500" />
              <p className="text-sm font-semibold text-rose-400">{errorMessage}</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {status === 'scanning' && (
          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              ANALYZING FACIAL MESH LAYERS
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Secured Biometric Verification
            </p>
          </div>
        )}

        {status !== 'error' && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                if (stream) stream.getTracks().forEach(t => t.stop());
                onClose();
              }}
              className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 px-5 py-2 text-sm font-semibold transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceScanner;
