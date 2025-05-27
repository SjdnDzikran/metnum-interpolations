"use client";

import React, { useState } from "react";
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
import { Point } from "@/lib/types";
import { useCanvasDrawing } from "@/hooks/useCanvasDrawing";
import { CanvasPlotter } from "@/components/CanvasPlotter";

export default function HomePage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [interpFormula, setInterpFormula] = useState<string>(
    "P(x) = (belum ada/cukup titik)"
  );
  const [lineCreated, setLineCreated] = useState(false);
  const [interpolationType, setInterpolationType] = useState<"Newton" | "Lagrange">("Newton");

  const dragThreshold = 5; // Pixels for point selection

  const { canvasRef, canvasContainerRef, canvasDims, drawingParams } = useCanvasDrawing({
    points,
    lineCreated,
    interpolationType,
    setInterpFormula,
  });

  const handleClearPoints = () => {
    setPoints([]);
    setSelectedPointIndex(null);
    setLineCreated(false);
    setInterpFormula("P(x) = (belum ada/cukup titik)");
  };

  const handleRemovePoint = (indexToRemove: number) => {
    setPoints((prev) => prev.filter((_, index) => index !== indexToRemove));
    setSelectedPointIndex(null); // Deselect any point if it was the one removed
    setLineCreated(false); // Force recalculation of line
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
          <CanvasPlotter
            canvasRef={canvasRef}
            canvasContainerRef={canvasContainerRef}
            canvasDims={canvasDims}
            drawingParams={drawingParams}
            points={points}
            setPoints={setPoints}
            selectedPointIndex={selectedPointIndex}
            setSelectedPointIndex={setSelectedPointIndex}
            dragThreshold={dragThreshold}
          />
          <div className="w-full flex flex-col gap-3 mt-2">
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center">
                <label htmlFor="interpolation-type" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Metode:
                </label>
                <Select
                    value={interpolationType}
                    onValueChange={(value: "Newton" | "Lagrange") => {
                        setInterpolationType(value);
                        if (points.length >=2) setLineCreated(false);
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
            {/* New section for points list */}
            <div className="w-full mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daftar Titik:
              </h3>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-700/30">
                {points.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada titik.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {points.map((p, index) => (
                      <li key={index} className="flex justify-between items-center py-2 px-3">
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                          ({p.x.toFixed(2)}, {p.y.toFixed(2)})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePoint(index)}
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 h-8 px-2"
                        >
                          Hapus
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
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
