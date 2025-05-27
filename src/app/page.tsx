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
import { Trash2, Eraser, LineChart, Settings, ListChecks, PanelLeftClose, PanelRightClose, Maximize, Minimize } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area"; // For potentially scrollable sidebar


export default function HomePage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [interpFormula, setInterpFormula] = useState<string>(
    "P(x) = (Belum ada/cukup titik)"
  );
  const [lineCreated, setLineCreated] = useState(false);
  const [interpolationType, setInterpolationType] = useState<"Newton" | "Lagrange">("Newton");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For collapsible sidebar

  const dragThreshold = 10;

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
    if (points.length - 1 < 2) {
        setLineCreated(false);
        setInterpFormula("P(x) = (Belum ada/cukup titik)");
    } else if (lineCreated) {
        setLineCreated(false);
        setTimeout(() => setLineCreated(true), 0);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Increased max-width for larger screens */}
      <Card className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl shadow-xl transition-all duration-300 ease-in-out">
        <CardHeader className="text-center pb-2 sm:pb-3">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Kalkulator Interpolasi
          </CardTitle>
          <CardDescription className="text-sm sm:text-base pt-1">
            Visualisasikan interpolasi Newton & Lagrange dengan titik kustom.
          </CardDescription>
        </CardHeader>
        {/* Main content area: flex-col by default, lg:flex-row for two columns on large screens */}
        <CardContent className="flex flex-col lg:flex-row gap-4 sm:gap-6 px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-0 md:px-6 md:pb-6 md:pt-0">
          {/* Left Column: Canvas and its primary actions */}
          <div className={`flex flex-col gap-4 ${isSidebarOpen ? 'lg:w-3/5 xl:w-[calc(66.66%-0.75rem)]' : 'lg:w-full'} transition-all duration-300 ease-in-out`}> {/* Adjust width based on sidebar state */}
            <div className="flex flex-row gap-3 w-full items-center">
              <Button onClick={handleClearPoints} variant="outline" className="flex-1 text-sm sm:text-base py-2.5">
                <Eraser className="mr-2 h-4 w-4" /> Clear Titik
              </Button>
              <Button
                onClick={() => setLineCreated(true)}
                className="flex-1 text-sm sm:text-base py-2.5"
                disabled={points.length < 2}
              >
                <LineChart className="mr-2 h-4 w-4" /> Buat Garis
              </Button>
              {/* Toggle Sidebar Button - shown only on lg screens */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:inline-flex ml-auto"
                aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              >
                {isSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
            </div>

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
          </div>

          {/* Right Column (Sidebar): Controls - Conditionally rendered or sized */}
          {isSidebarOpen && (
            <div className={`flex-col gap-4 lg:w-2/5 xl:w-[calc(33.33%-0.75rem)] lg:pl-4 lg:border-l lg:border-gray-200 dark:lg:border-gray-700 ${isSidebarOpen ? 'flex' : 'hidden lg:hidden' } transition-all duration-300 ease-in-out`}>
              <ScrollArea className="h-full max-h-[calc(100vh-12rem)] lg:max-h-[calc(100vh-10rem)] pr-2"> {/* Adjust max-h as needed */}
                {/* Interpolation Settings */}
                <div className="flex flex-col gap-3">
                  <h3 className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
                    <Settings className="mr-2 h-5 w-5 text-primary" />
                    Pengaturan Interpolasi
                  </h3>
                  <div>
                    <label htmlFor="interpolation-type" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Metode:
                    </label>
                    <Select
                        value={interpolationType}
                        onValueChange={(value: "Newton" | "Lagrange") => {
                            setInterpolationType(value);
                            if (points.length >=2 && lineCreated) {
                              setLineCreated(false);
                              setTimeout(() => setLineCreated(true), 0);
                            } else {
                              setInterpFormula("P(x) = (Belum ada/cukup titik)");
                            }
                        }}
                    >
                        <SelectTrigger className="w-full text-xs sm:text-sm">
                        <SelectValue placeholder="Pilih Metode" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Newton">Polinom Newton</SelectItem>
                        <SelectItem value="Lagrange">Polinom Lagrange</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                      <label htmlFor="interpolation-formula" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rumus P(x):
                      </label>
                      <Input
                          id="interpolation-formula"
                          value={interpFormula}
                          readOnly
                          className="w-full font-mono text-[10px] sm:text-xs p-2 h-auto bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          placeholder="Formula akan tampil di sini..."
                      />
                  </div>
                </div>

                <Separator className="my-3 sm:my-4" />

                {/* Points List */}
                <div className="flex flex-col gap-2">
                  <h3 className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
                    <ListChecks className="mr-2 h-5 w-5 text-primary" />
                    Daftar Titik ({points.length})
                  </h3>
                  <div className="max-h-48 sm:max-h-60 md:max-h-72 lg:max-h-[none] lg:flex-grow overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800/50 shadow-sm">
                    {points.length === 0 ? (
                      <p className="text-xs sm:text-sm text-center py-4 text-gray-500 dark:text-gray-400">
                        Klik pada kanvas untuk menambah titik.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                        {points.map((p, index) => (
                          <li key={index} className="flex justify-between items-center py-2 px-2 sm:px-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150">
                            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] sm:text-xs font-semibold border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              #{index + 1}: ({p.x.toFixed(2)}, {p.y.toFixed(2)})
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePoint(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:text-red-400 dark:hover:bg-red-900/30 h-7 w-7 sm:h-8 sm:w-8"
                              aria-label={`Hapus titik ${index + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
