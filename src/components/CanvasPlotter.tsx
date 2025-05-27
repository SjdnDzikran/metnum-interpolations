import React from "react";
import { Point } from "@/lib/types";
import { DrawingParams } from "@/hooks/useCanvasDrawing"; // Assuming DrawingParams is exported from useCanvasDrawing

interface CanvasPlotterProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  canvasDims: { width: number; height: number };
  drawingParams: DrawingParams;
  points: Point[];
  setPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  selectedPointIndex: number | null;
  setSelectedPointIndex: React.Dispatch<React.SetStateAction<number | null>>;
  dragThreshold: number;
}

export const CanvasPlotter: React.FC<CanvasPlotterProps> = ({
  canvasRef,
  canvasContainerRef,
  canvasDims,
  drawingParams,
  points,
  setPoints,
  selectedPointIndex,
  setSelectedPointIndex,
  dragThreshold,
}) => {
  const { toCanvasX, toCanvasY, toDataX, toDataY, isValid: drawingParamsValid } = drawingParams;

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingParamsValid) return;

    const rect = canvas.getBoundingClientRect();
    const canvasElementX = event.clientX - rect.left;
    const canvasElementY = event.clientY - rect.top;

    const dataX = toDataX(canvasElementX);
    const dataY = toDataY(canvasElementY);

    const roundedDataX = parseFloat(dataX.toFixed(2));
    const roundedDataY = parseFloat(dataY.toFixed(2));

    if (event.button === 0) { // Left click
      let foundPoint = false;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(
          (toCanvasX(p.x) - canvasElementX) ** 2 + (toCanvasY(p.y) - canvasElementY) ** 2
        );
        if (dist < dragThreshold * 2) {
          setSelectedPointIndex(i);
          foundPoint = true;
          break;
        }
      }
      if (!foundPoint) {
        setPoints((prev) => [...prev, { x: roundedDataX, y: roundedDataY }]);
      }
    } else if (event.button === 2) { // Right click
      event.preventDefault();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(
          (toCanvasX(p.x) - canvasElementX) ** 2 + (toCanvasY(p.y) - canvasElementY) ** 2
        );
        if (dist < dragThreshold * 2) {
          setPoints((prev) => prev.filter((_, index) => index !== i));
          break;
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedPointIndex === null || !drawingParamsValid) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasElementX = event.clientX - rect.left;
    const canvasElementY = event.clientY - rect.top;

    const dataX = toDataX(canvasElementX);
    const dataY = toDataY(canvasElementY);
    
    const roundedDataX = parseFloat(dataX.toFixed(2));
    const roundedDataY = parseFloat(dataY.toFixed(2));

    setPoints((prev) =>
      prev.map((p, i) => (i === selectedPointIndex ? { x: roundedDataX, y: roundedDataY } : p))
    );
  };

  const handleMouseUp = () => {
    setSelectedPointIndex(null);
  };

  return (
    <div
      ref={canvasContainerRef}
      className="relative w-full aspect-[4/3] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={canvasDims.width}
        height={canvasDims.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="cursor-crosshair block"
      />
      <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-black/70 px-1 rounded">
        L-Klik: Add/Drag | R-Klik: Hapus
      </div>
    </div>
  );
};
