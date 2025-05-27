"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Import icons from lucide-react
import { Trash2, Eraser, LineChart, Settings, ListChecks } from "lucide-react";
import { Separator } from "@/components/ui/separator";


export default function HomePage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [interpFormula, setInterpFormula] = useState<string>(
    "P(x) = (Belum ada/cukup titik)"
  );
  const [lineCreated, setLineCreated] = useState(false);
  const [interpolationType, setInterpolationType] = useState<"Newton" | "Lagrange">("Newton");

  const dragThreshold = 10; // Slightly increased for easier grabbing on touch/mouse

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
    setInterpFormula("P(x) = (Belum ada/cukup titik)");
  };

  const handleRemovePoint = (indexToRemove: number) => {
    setPoints((prev) => prev.filter((_, index) => index !== indexToRemove));
    setSelectedPointIndex(null);
    if (points.length - 1 < 2) { // Check if removing point makes it insufficient for a line
        setLineCreated(false);
        setInterpFormula("P(x) = (Belum ada/cukup titik)");
    } else if (lineCreated) {
        setLineCreated(false); // Force recalculation by temporarily unsetting lineCreated
        setTimeout(() => setLineCreated(true), 0); // Then re-set it to trigger draw with new points
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 py-8">
      <Card className="w-full max-w-4xl shadow-xl"> {/* Increased shadow slightly */}
        <CardHeader className="text-center"> {/* Center align header content */}
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Kalkulator Interpolasi
          </CardTitle>
          <CardDescription className="text-sm sm:text-base pt-1">
            Visualisasikan interpolasi Newton & Lagrange dengan titik kustom.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-4 sm:p-6"> {/* Increased gap and padding */}
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

          {/* Controls Section */}
          <div className="w-full flex flex-col gap-6">
            {/* Interpolation Settings */}
            <div className="flex flex-col gap-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Pengaturan Interpolasi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="interpolation-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metode Interpolasi:
                  </label>
                  <Select
                      value={interpolationType}
                      onValueChange={(value: "Newton" | "Lagrange") => {
                          setInterpolationType(value);
                          if (points.length >=2 && lineCreated) {
                            setLineCreated(false); // force recalculation if line exists
                            setTimeout(() => setLineCreated(true), 0);
                          } else {
                            setInterpFormula("P(x) = (Belum ada/cukup titik)");
                          }
                      }}
                  >
                      <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Metode" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="Newton">Polinom Newton</SelectItem>
                      <SelectItem value="Lagrange">Polinom Lagrange</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"> {/* Make formula span full width on larger screens if needed or keep it in flow */}
                    <label htmlFor="interpolation-formula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rumus Polinom P(x):
                    </label>
                    <Input
                        id="interpolation-formula"
                        value={interpFormula}
                        readOnly
                        className="w-full font-mono text-xs sm:text-sm overflow-x-auto p-2.5 h-auto bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        placeholder="Formula akan tampil di sini..."
                    />
                </div>
              </div>
            </div>

            <Separator />

            {/* Points List */}
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                <ListChecks className="mr-2 h-5 w-5 text-primary" />
                Daftar Titik ({points.length})
              </h3>
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800/50 shadow-sm">
                {points.length === 0 ? (
                  <p className="text-sm text-center py-4 text-gray-500 dark:text-gray-400">
                    Klik pada kanvas untuk menambah titik.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {points.map((p, index) => (
                      <li key={index} className="flex justify-between items-center py-2.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150">
                        <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          Titik {index + 1}: ({p.x.toFixed(2)}, {p.y.toFixed(2)})
                        </span>
                        <Button
                          variant="ghost"
                          size="icon" // Changed to icon size
                          onClick={() => handleRemovePoint(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:text-red-400 dark:hover:bg-red-900/30 h-8 w-8"
                          aria-label={`Hapus titik ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-2"/>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <Button onClick={handleClearPoints} variant="outline" className="flex-1 text-base py-2.5">
              <Eraser className="mr-2 h-4 w-4" /> Clear Semua Titik
            </Button>
            <Button
              onClick={() => setLineCreated(true)}
              className="flex-1 text-base py-2.5"
              disabled={points.length < 2}
            >
              <LineChart className="mr-2 h-4 w-4" /> Buat Garis Interpolasi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}