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
