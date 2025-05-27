"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Point {
  x: number;
  y: number;
}

// --- Helper Functions (Unchanged) ---
// Function to evaluate the Lagrange polynomial at a given x
function evaluateLagrangePolynomial(
  x: number,
  xCoords: number[],
  yCoords: number[]
): number {
  const n = xCoords.length;
  let result = 0;

  for (let i = 0; i < n; i++) {
    let term = yCoords[i];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const denominator = xCoords[i] - xCoords[j];
        if (denominator === 0) {
          console.error("Error: Duplicate x-coordinates detected for Lagrange interpolation.");
          return NaN; // Handle division by zero
        }
        term *= (x - xCoords[j]) / denominator;
      }
    }
    result += term;
  }
  return result;
}

// Function to calculate divided differences for Newton's interpolation
function calculateDividedDifferences(
  xCoords: number[],
  yCoords: number[]
): number[] {
  const n = xCoords.length;
  if (n === 0) return [];

  const ddTable: number[][] = [];
  ddTable.push([...yCoords]);

  for (let k = 1; k < n; k++) {
    const prevCol = ddTable[k - 1];
    const newCol: number[] = [];
    for (let i = 0; i < n - k; i++) {
      const denominator = xCoords[i + k] - xCoords[i];
      if (denominator === 0) {
        console.error("Error: Duplicate x-coordinates detected.");
        return [];
      }
      const diff = (prevCol[i + 1] - prevCol[i]) / denominator;
      newCol.push(diff);
    }
    if (newCol.length === 0) break;
    ddTable.push(newCol);
  }
  const coefficients = ddTable.map((col) => col[0]);
  return coefficients;
}

// Function to generate the Newton polynomial formula string
function generateNewtonPolynomialFormula(
  xCoords: number[],
  coefficients: number[]
): string {
  if (coefficients.length === 0) return "(belum ada/cukup titik)";

  let formula = `P(x) = ${coefficients[0].toFixed(2)}`;
  let productTerm = "";

  for (let i = 1; i < coefficients.length; i++) {
    productTerm += `(x - ${xCoords[i - 1].toFixed(1)})`;
    const coeff = coefficients[i];
    if (coeff >= 0) {
      formula += ` + ${coeff.toFixed(2)}${productTerm}`;
    } else {
      formula += ` - ${Math.abs(coeff).toFixed(2)}${productTerm}`;
    }
  }
  return formula;
}

// Function to evaluate the Newton polynomial at a given x
function evaluateNewtonPolynomial(
  x: number,
  xCoords: number[],
  coefficients: number[]
): number {
  if (coefficients.length === 0) return NaN;

  let result = coefficients[0];
  let productTerm = 1;

  for (let i = 1; i < coefficients.length; i++) {
    productTerm *= (x - xCoords[i - 1]);
    result += coefficients[i] * productTerm;
  }
  return result;
}


// Constants for the logical coordinate system
const LOGICAL_X_MIN = -10;
const LOGICAL_X_MAX = 10;
const LOGICAL_Y_MIN = -10;
const LOGICAL_Y_MAX = 10;
const LOGICAL_X_RANGE = LOGICAL_X_MAX - LOGICAL_X_MIN;
const LOGICAL_Y_RANGE = LOGICAL_Y_MAX - LOGICAL_Y_MIN;

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null); // Ref for the canvas container

  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [interpFormula, setInterpFormula] = useState<string>(
    "P(x) = (belum ada/cukup titik)"
  );
  const [lineCreated, setLineCreated] = useState(false);
  const [interpolationType, setInterpolationType] = useState<"Newton" | "Lagrange">("Newton");

  // State for dynamic canvas dimensions
  const [canvasDims, setCanvasDims] = useState({ width: 800, height: 600 });

  const dragThreshold = 5; // Pixels for point selection

  // Effect to observe container size and update canvas dimensions
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDims((prevDims) => {
            // Only update if dimensions actually changed to avoid unnecessary re-renders
            if (prevDims.width !== Math.round(width) || prevDims.height !== Math.round(height)) {
              return { width: Math.round(width), height: Math.round(height) };
            }
            return prevDims;
          });
        }
      }
    });

    resizeObserver.observe(container);

    // Set initial size from container after mount
    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) {
      setCanvasDims({ width: clientWidth, height: clientHeight });
    }

    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []); // Runs once on mount

  // Memoized drawing parameters and transformation functions
  const drawingParams = useMemo(() => {
    const { width: currentCanvasWidth, height: currentCanvasHeight } = canvasDims;

    if (currentCanvasWidth <= 0 || currentCanvasHeight <= 0) {
      return {
        scaleX: 1, scaleY: 1, originX: 0, originY: 0,
        toCanvasX: (x: number) => x, toCanvasY: (y: number) => y,
        toDataX: (cx: number) => cx, toDataY: (cy: number) => cy,
        currentCanvasWidth, currentCanvasHeight, padding: 0,
        isValid: false,
      };
    }

    const PADDING_MIN = 10;
    const PADDING_MAX = 50;
    const PADDING_RATIO = 0.05; // 5% of smaller dimension

    let calculatedPadding = Math.min(currentCanvasWidth, currentCanvasHeight) * PADDING_RATIO;
    calculatedPadding = Math.max(PADDING_MIN, calculatedPadding);
    calculatedPadding = Math.min(PADDING_MAX, calculatedPadding);
    calculatedPadding = Math.min(calculatedPadding, currentCanvasWidth / 2.1, currentCanvasHeight / 2.1);


    const plotAreaWidth = currentCanvasWidth - 2 * calculatedPadding;
    const plotAreaHeight = currentCanvasHeight - 2 * calculatedPadding;

    if (plotAreaWidth <= 0 || plotAreaHeight <= 0) {
       return { /* Same fallback as above for very small canvas */
        scaleX: 1, scaleY: 1, originX: currentCanvasWidth/2, originY: currentCanvasHeight/2,
        toCanvasX: (x: number) => x, toCanvasY: (y: number) => y,
        toDataX: (cx: number) => cx, toDataY: (cy: number) => cy,
        currentCanvasWidth, currentCanvasHeight, padding: calculatedPadding,
        isValid: false,
      };
    }

    const finalOriginX = calculatedPadding + plotAreaWidth / 2;
    const finalOriginY = calculatedPadding + plotAreaHeight / 2;

    const finalScaleX = plotAreaWidth / LOGICAL_X_RANGE;
    const finalScaleY = plotAreaHeight / LOGICAL_Y_RANGE;

    const toCanvasX = (x: number) => finalOriginX + x * finalScaleX;
    const toCanvasY = (y: number) => finalOriginY - y * finalScaleY; // Y-axis is inverted

    const toDataX = (cx: number) => (cx - finalOriginX) / finalScaleX;
    const toDataY = (cy: number) => (finalOriginY - cy) / finalScaleY;

    return {
      scaleX: finalScaleX, scaleY: finalScaleY,
      originX: finalOriginX, originY: finalOriginY,
      toCanvasX, toCanvasY, toDataX, toDataY,
      currentCanvasWidth, currentCanvasHeight,
      padding: calculatedPadding,
      isValid: true,
    };
  }, [canvasDims]);

  const {
    toCanvasX, toCanvasY, toDataX, toDataY,
    originX: calculatedOriginX, originY: calculatedOriginY,
    isValid: drawingParamsValid,
  } = drawingParams;


  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingParamsValid || canvasDims.width === 0 || canvasDims.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasDims.width, canvasDims.height);

    // Draw grid
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    for (let x = Math.ceil(LOGICAL_X_MIN); x <= Math.floor(LOGICAL_X_MAX); x++) {
      ctx.beginPath();
      const cx = toCanvasX(x);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvasDims.height);
      ctx.stroke();
    }
    for (let y = Math.ceil(LOGICAL_Y_MIN); y <= Math.floor(LOGICAL_Y_MAX); y++) {
      ctx.beginPath();
      const cy = toCanvasY(y);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvasDims.width, cy);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, calculatedOriginY);
    ctx.lineTo(canvasDims.width, calculatedOriginY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(calculatedOriginX, 0);
    ctx.lineTo(calculatedOriginX, canvasDims.height);
    ctx.stroke();

    // Draw points
    ctx.fillStyle = "#60A5FA";
    const pointRadius = Math.max(3, Math.min(5, canvasDims.width / 100)); // Dynamic point size
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(toCanvasX(p.x), toCanvasY(p.y), pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw interpolated curve
    if (lineCreated && points.length >= 2) {
      const sortedPoints = [...points].sort((a, b) => a.x - b.x);
      const uniqueXCoords = Array.from(new Set(sortedPoints.map((p) => p.x)));
      const uniqueYCoords = uniqueXCoords.map(
        (xVal) => sortedPoints.find((p) => p.x === xVal)?.y || 0
      );

      if (uniqueXCoords.length >= 2) {
        let evaluatedY: (x: number) => number;
        let formulaString: string;

        if (interpolationType === "Newton") {
          const coefficients = calculateDividedDifferences(uniqueXCoords, uniqueYCoords);
          if (coefficients.length > 0) {
            evaluatedY = (xVal) => evaluateNewtonPolynomial(xVal, uniqueXCoords, coefficients);
            formulaString = generateNewtonPolynomialFormula(uniqueXCoords, coefficients);
          } else {
            setInterpFormula("Error: Calculation issue (Newton).");
            return;
          }
        } else { // Lagrange
          evaluatedY = (xVal) => evaluateLagrangePolynomial(xVal, uniqueXCoords, uniqueYCoords);
          formulaString = "P(x) = (Lagrange Polynomial)"; // Placeholder, actual formula can be very long
        }
        setInterpFormula(formulaString);

        ctx.strokeStyle = "#8B5CF6";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xMinPlot = toDataX(0);
        const xMaxPlot = toDataX(canvasDims.width);
        const numSegments = Math.max(100, Math.min(300, canvasDims.width / 2)); // Dynamic segments
        const step = (xMaxPlot - xMinPlot) / numSegments;

        let wasLastPointInBounds = false; // Flag to track if the previous point was within the generous bounds

        for (let i = 0; i <= numSegments; i++) {
          const x = xMinPlot + i * step;
          const y = evaluatedY(x);
          if (isNaN(y)) {
            wasLastPointInBounds = false; // Treat NaN as out of bounds, break the line
            continue;
          }

          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);

          const currentPointIsInBounds = !(canvasY < -canvasDims.height * 2 || canvasY > canvasDims.height * 3);

          if (currentPointIsInBounds) {
            if (i === 0 || !wasLastPointInBounds) {
              // If it's the very first point, or the previous point was out of bounds,
              // start a new segment.
              ctx.moveTo(canvasX, canvasY);
            } else {
              // If the current point is in bounds and the previous was also in bounds,
              // continue the line.
              ctx.lineTo(canvasX, canvasY);
            }
          }
          // If currentPointIsInBounds is false, we do nothing (don't draw to it),
          // and wasLastPointInBounds will be set to false for the next iteration,
          // ensuring the next in-bounds point starts a new segment.
          wasLastPointInBounds = currentPointIsInBounds;
        }
        ctx.stroke();
      } else {
        setInterpFormula("P(x) = (butuh setidaknya 2 titik unik)");
      }
    } else if (!lineCreated) {
      setInterpFormula("P(x) = (garis tidak ditampilkan)");
    } else if (points.length < 2) {
      setInterpFormula("P(x) = (belum ada/cukup titik)");
    }
  }, [points, lineCreated, interpolationType, canvasDims, drawingParams, setInterpFormula]); // Added drawingParamsValid and setInterpFormula

  useEffect(() => {
    draw();
  }, [draw]); // Rerun draw when the draw function itself changes (due to its dependencies)

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingParamsValid) return;

    const rect = canvas.getBoundingClientRect();
    const canvasElementX = event.clientX - rect.left;
    const canvasElementY = event.clientY - rect.top;

    const dataX = toDataX(canvasElementX);
    const dataY = toDataY(canvasElementY);

    // Round dataX and dataY to a reasonable precision to avoid floating point issues
    const roundedDataX = parseFloat(dataX.toFixed(2));
    const roundedDataY = parseFloat(dataY.toFixed(2));


    if (event.button === 0) { // Left click
      let foundPoint = false;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(
          (toCanvasX(p.x) - canvasElementX) ** 2 + (toCanvasY(p.y) - canvasElementY) ** 2
        );
        if (dist < dragThreshold * 2) { // Increase threshold slightly for easier grabbing
          setSelectedPointIndex(i);
          foundPoint = true;
          break;
        }
      }
      if (!foundPoint) {
        setPoints((prev) => [...prev, { x: roundedDataX, y: roundedDataY }]);
      }
    } else if (event.button === 2) { // Right click
      event.preventDefault(); // Prevent context menu
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

  const handleClearPoints = () => {
    setPoints([]);
    setSelectedPointIndex(null);
    setLineCreated(false);
    setInterpFormula("P(x) = (belum ada/cukup titik)");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Interpolasi Newton & Lagrange
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* Responsive Canvas Container */}
          <div
            ref={canvasContainerRef}
            className="relative w-full aspect-[4/3] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              width={canvasDims.width}   // Dynamically set width
              height={canvasDims.height} // Dynamically set height
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={(e) => e.preventDefault()}
              className="cursor-crosshair block" // `block` to remove potential extra space below
            />
            <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-black/70 px-1 rounded">
              L-Klik: Add/Drag | R-Klik: Hapus
            </div>
          </div>
          <div className="w-full flex flex-col gap-3 mt-2">
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center">
                <label htmlFor="interpolation-type" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Metode:
                </label>
                <Select
                    value={interpolationType}
                    onValueChange={(value: "Newton" | "Lagrange") => {
                        setInterpolationType(value);
                        // Reset formula text when type changes and points exist
                        if (points.length >=2) setLineCreated(false); // force recalculation if line exists
                        else setInterpFormula("P(x) = (belum ada/cukup titik)");
                    }}
                >
                    <SelectTrigger className="w-full sm:w-auto flex-grow">
                    <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Newton">Newton</SelectItem>
                    <SelectItem value="Lagrange">Lagrange</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rumus Interpolasi P(x):
            </div>
            <Input
              value={interpFormula}
              readOnly
              className="w-full font-mono text-xs sm:text-sm overflow-x-auto p-2 h-auto"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
            <Button onClick={handleClearPoints} variant="outline" className="flex-1">
              Clear Points
            </Button>
            <Button onClick={() => setLineCreated(true)} className="flex-1" disabled={points.length < 2}>
              Create Line
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
