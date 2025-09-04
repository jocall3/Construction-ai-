import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface ImageEditorProps {
  imageUrl: string;
  isLoading: boolean;
  activeFeature: string | null;
  onReset: () => void;
  isModified: boolean;
  onImageError: (message: string) => void;
}

export interface ImageEditorRef {
  getMask: () => Promise<Blob | null>;
  clearMask: () => void;
}

const loadingMessages = [
    "Analyzing image...",
    "Applying AI magic...",
    "Adding final touches...",
    "This can take a moment...",
    "Rendering new architecture...",
];

const LoadingOverlay: React.FC<{ activeFeature: string | null }> = ({ activeFeature }) => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 rounded-xl">
            <div className="w-16 h-16 border-4 border-t-cyan-400 border-gray-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-semibold">{message}</p>
            {activeFeature && <p className="mt-1 text-gray-300 max-w-sm text-center truncate">Applying: {activeFeature}</p>}
        </div>
    );
}

export const ImageEditor = forwardRef<ImageEditorRef, ImageEditorProps>(({ 
    imageUrl, 
    isLoading, 
    activeFeature,
    onReset,
    isModified,
    onImageError
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
    const [isCursorVisible, setIsCursorVisible] = useState(false);

    // Effect to load the image from imageUrl
    useEffect(() => {
        setImage(null);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                onImageError("The image file seems to be corrupted or empty. Please try another one.");
                return;
            }
            setImage(img);
        };
        img.onerror = () => {
            onImageError("Failed to load the image. It might be an unsupported format or a network issue.");
        };
    }, [imageUrl, onImageError]);

    // Effect to observe container size changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    // Effect to draw the image on the canvas when the image or dimensions change
    useEffect(() => {
        const imageCanvas = imageCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;

        if (!image || !imageCanvas || !drawingCanvas || dimensions.width === 0 || dimensions.height === 0) {
            return;
        }

        const { width: containerWidth, height: containerHeight } = dimensions;
        
        imageCanvas.width = drawingCanvas.width = containerWidth;
        imageCanvas.height = drawingCanvas.height = containerHeight;

        const canvasAspectRatio = containerWidth / containerHeight;
        const imageAspectRatio = image.naturalWidth / image.naturalHeight;

        let renderWidth, renderHeight, x, y;

        if (imageAspectRatio > canvasAspectRatio) {
            renderWidth = containerWidth;
            renderHeight = containerWidth / imageAspectRatio;
        } else {
            renderHeight = containerHeight;
            renderWidth = containerHeight * imageAspectRatio;
        }

        x = (containerWidth - renderWidth) / 2;
        y = (containerHeight - renderHeight) / 2;

        const imageCtx = imageCanvas.getContext('2d');
        if (imageCtx) {
            imageCtx.clearRect(0, 0, containerWidth, containerHeight);
            imageCtx.drawImage(image, x, y, renderWidth, renderHeight);
        }
    }, [image, dimensions]);

    const getCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = getCoords(e);
        if(coords) {
            setCursorPos(coords)
            if (isDrawing) {
                draw(coords);
            }
        }
    }

    const startDrawing = (e: React.MouseEvent) => {
        const coords = getCoords(e);
        if (coords) {
            setIsDrawing(true);
            lastPos.current = coords;
            draw(coords); // Draw a dot on click
        }
    };
    
    const draw = (currentPos: {x: number, y: number}) => {
        const canvas = drawingCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !lastPos.current) return;

        ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.fillStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(lastPos.current.x, lastPos.current.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        lastPos.current = currentPos;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearMask = useCallback(() => {
        const canvas = drawingCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, []);
    
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ai-house-architect-edit.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useImperativeHandle(ref, () => ({
        getMask: () => {
            return new Promise((resolve) => {
                const drawingCanvas = drawingCanvasRef.current;
                if (!drawingCanvas) { resolve(null); return; }
                const drawingCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
                if (!drawingCtx) { resolve(null); return; }

                const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
                const hasDrawing = imageData.data.some(channel => channel > 0);
                if (!hasDrawing) { resolve(null); return; }
                
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = drawingCanvas.width;
                maskCanvas.height = drawingCanvas.height;
                const maskCtx = maskCanvas.getContext('2d');
                if (!maskCtx) { resolve(null); return; }

                maskCtx.fillStyle = 'black';
                maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

                const originalData = imageData.data;
                const maskImageData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);
                const maskData = maskImageData.data;

                for (let i = 0; i < originalData.length; i += 4) {
                    if (originalData[i + 3] > 0) { // If pixel is not transparent
                        maskData[i] = 255; maskData[i + 1] = 255; maskData[i + 2] = 255; maskData[i + 3] = 255;
                    }
                }
                maskCtx.putImageData(maskImageData, 0, 0);
                maskCanvas.toBlob(blob => resolve(blob), 'image/png');
            });
        },
        clearMask,
    }));


  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-gray-800 border-2 border-gray-700 rounded-xl overflow-hidden shadow-2xl">
        {isLoading && <LoadingOverlay activeFeature={activeFeature} />}

        <div className="absolute top-4 right-4 z-20 flex space-x-2">
            {isModified && (
                <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-cyan-600/80 text-white text-sm font-semibold rounded-md hover:bg-cyan-700 transition-colors shadow-lg backdrop-blur-sm flex items-center space-x-2"
                    aria-label="Download modified image"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download</span>
                </button>
            )}
            <button
                onClick={onReset}
                className="px-3 py-1.5 bg-gray-600/50 text-white text-sm font-semibold rounded-md hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
            >
                {isModified ? 'Start Over' : 'Remove Image'}
            </button>
        </div>
        
        <canvas ref={imageCanvasRef} className="absolute top-0 left-0 w-full h-full" />
        <canvas 
            ref={drawingCanvasRef}
            className="absolute top-0 left-0 w-full h-full z-10 cursor-none"
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={() => { stopDrawing(); setIsCursorVisible(false); }}
            onMouseEnter={() => setIsCursorVisible(true)}
        />
        {isCursorVisible && !isLoading && (
            <div 
                className="absolute top-0 left-0 rounded-full border-2 border-cyan-400 bg-cyan-400/20 pointer-events-none z-40"
                style={{ 
                    width: `${brushSize}px`, 
                    height: `${brushSize}px`,
                    transform: `translate(${cursorPos.x - brushSize/2}px, ${cursorPos.y - brushSize/2}px)`,
                }}
            />
        )}


        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/30 backdrop-blur-sm z-20 flex items-center justify-center gap-4">
            <label htmlFor="brush-size" className="text-sm font-medium text-white">Brush Size:</label>
            <input
                type="range"
                id="brush-size"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-40"
            />
            <button
                onClick={clearMask}
                className="px-3 py-1.5 bg-gray-600/50 text-white text-sm font-semibold rounded-md hover:bg-gray-700 transition-colors"
            >
                Clear Selection
            </button>
        </div>
    </div>
  );
});