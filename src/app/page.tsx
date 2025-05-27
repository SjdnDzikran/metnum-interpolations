"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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

// --- Helper Functions (Translated from Python) ---

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
  // Initialize the first column with y-coordinates
  ddTable.push([...yCoords]);

  for (let k = 1; k < n; k++) {
    const prevCol = ddTable[k - 1];
    const newCol: number[] = [];
    for (let i = 0; i < n - k; i++) {
      const denominator = xCoords[i + k] - xCoords[i];
      if (denominator === 0) {
        // Handle division by zero (e.g., duplicate x-coordinates)
        // In a real app, you might want to show an error or handle this more gracefully
        console.error("Error: Duplicate x-coordinates detected.");
        return [];
      }
      const diff = (prevCol[i + 1] - prevCol[i]) / denominator;
      newCol.push(diff);
    }
    if (newCol.length === 0) break; // No more differences can be calculated
    ddTable.push(newCol);
  }

  // The coefficients are the first elements of each column
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

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [interpFormula, setInterpFormula] = useState<string>(
    "P(x) = (belum ada/cukup titik)"
  );
  const [lineCreated, setLineCreated] = useState(false);
  const [interpolationType, setInterpolationType] = useState<"Newton" | "Lagrange">(
    "Newton"
  );
  const canvasWidth = 800;
  const canvasHeight = 600;
  const padding = 50; // Padding for axes
  const scaleX = (canvasWidth - 2 * padding) / 20; // Assuming x-range from -10 to 10
  const scaleY = (canvasHeight - 2 * padding) / 20; // Assuming y-range from -10 to 10
  const originX = canvasWidth / 2;
  const originY = canvasHeight / 2;
  const dragThreshold = 5; // Pixels for point selection

  // Coordinate transformation functions
  const toCanvasX = (x: number) => originX + x * scaleX;
  const toCanvasY = (y: number) => originY - y * scaleY; // Y-axis is inverted in canvas
  const toDataX = (cx: number) => (cx - originX) / scaleX;
  const toDataY = (cy: number) => (originY - cy) / scaleY;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = -10; x <= 10; x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), canvasHeight);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = -10; y <= 10; y++) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(canvasWidth, toCanvasY(y));
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvasWidth, originY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvasHeight);
    ctx.stroke();

    // Draw points
    ctx.fillStyle = "#60A5FA"; // A shade of blue for points
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw interpolated curve
    if (lineCreated && points.length >= 2) {
      const sortedPoints = [...points].sort((a, b) => a.x - b.x);
      const uniqueXCoords = Array.from(new Set(sortedPoints.map((p) => p.x)));
      const uniqueYCoords = uniqueXCoords.map(
        (x) => sortedPoints.find((p) => p.x === x)?.y || 0
      );

      if (uniqueXCoords.length >= 2) {
        let evaluatedY: (x: number) => number;
        let formulaString: string;

        if (interpolationType === "Newton") {
          const coefficients = calculateDividedDifferences(
            uniqueXCoords,
            uniqueYCoords
          );
          if (coefficients.length > 0) {
            evaluatedY = (x) => evaluateNewtonPolynomial(x, uniqueXCoords, coefficients);
            formulaString = generateNewtonPolynomialFormula(uniqueXCoords, coefficients);
          } else {
            setInterpFormula("Error: Duplicate x-coordinates or calculation issue (Newton).");
            return;
          }
        } else { // Lagrange
          evaluatedY = (x) => evaluateLagrangePolynomial(x, uniqueXCoords, uniqueYCoords);
          formulaString = "P(x) = (Lagrange Polynomial)";
        }

        setInterpFormula(formulaString);

        ctx.strokeStyle = "#8B5CF6"; // A shade of purple for the line
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Calculate plot range based on canvas visible area
        const xMinPlot = toDataX(0);
        const xMaxPlot = toDataX(canvasWidth);
        const numSegments = 200;
        const step = (xMaxPlot - xMinPlot) / numSegments;

        for (let i = 0; i <= numSegments; i++) {
          const x = xMinPlot + i * step;
          const y = evaluatedY(x);

          if (i === 0) {
            ctx.moveTo(toCanvasX(x), toCanvasY(y));
          } else {
            ctx.lineTo(toCanvasX(x), toCanvasY(y));
          }
        }
        ctx.stroke();
      } else {
        setInterpFormula("P(x) = (butuh setidaknya 2 titik unik)");
      }
    } else if (!lineCreated) {
      setInterpFormula("P(x) = (garis tidak ditampilkan)");
    } else {
      setInterpFormula("P(x) = (belum ada/cukup titik)");
    }
  }, [points, originX, originY, scaleX, scaleY, lineCreated, interpolationType]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const dataX = toDataX(canvasX);
    const dataY = toDataY(canvasY);

    if (event.button === 0) {
      // Left click
      let foundPoint = false;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(
          (toCanvasX(p.x) - canvasX) ** 2 + (toCanvasY(p.y) - canvasY) ** 2
        );
        if (dist < dragThreshold) {
          setSelectedPointIndex(i);
          foundPoint = true;
          break;
        }
      }
      if (!foundPoint) {
        setPoints((prev) => [...prev, { x: dataX, y: dataY }]);
      }
    } else if (event.button === 2) {
      // Right click
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.sqrt(
          (toCanvasX(p.x) - canvasX) ** 2 + (toCanvasY(p.y) - canvasY) ** 2
        );
        if (dist < dragThreshold) {
          setPoints((prev) => prev.filter((_, index) => index !== i));
          break;
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedPointIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const dataX = toDataX(canvasX);
    const dataY = toDataY(canvasY);

    setPoints((prev) =>
      prev.map((p, i) => (i === selectedPointIndex ? { x: dataX, y: dataY } : p))
    );
  };

  const handleMouseUp = () => {
    setSelectedPointIndex(null);
  };

  const handleClearPoints = () => {
    setPoints([]);
    setSelectedPointIndex(null);
    setLineCreated(false); // Reset lineCreated when points are cleared
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Interpolasi Newton
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative w-[800px] h-[600px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
              className="cursor-crosshair"
            />
            <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400">
              Klik Kiri: Tambah/Drag Titik, Klik Kanan: Hapus Titik
            </div>
          </div>
          <div className="w-full flex flex-col gap-2 mt-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rumus Interpolasi P(x):
            </div>
            <div className="w-full flex flex-col gap-2">
              <label htmlFor="interpolation-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pilih Metode Interpolasi:
              </label>
              <Select
                value={interpolationType}
                onValueChange={(value: "Newton" | "Lagrange") => setInterpolationType(value)}
              >
                <SelectTrigger className="w-full">
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
              className="w-full font-mono text-sm overflow-x-auto"
            />
            </div>
          </CardContent>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex gap-2 w-full">
              <Button onClick={handleClearPoints} className="flex-1">
                Clear All Points
              </Button>
              <Button onClick={() => setLineCreated(true)} className="flex-1">
                Create Line
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
