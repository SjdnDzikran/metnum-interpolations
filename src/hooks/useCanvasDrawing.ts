import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  evaluateLagrangePolynomial,
  calculateDividedDifferences,
  generateNewtonPolynomialFormula,
  evaluateNewtonPolynomial,
} from "@/lib/interpolation";
import { Point } from "@/lib/types";
import {
  LOGICAL_X_MIN,
  LOGICAL_X_MAX,
  LOGICAL_Y_MIN,
  LOGICAL_Y_MAX,
  LOGICAL_X_RANGE,
  LOGICAL_Y_RANGE,
} from "@/lib/constants";

export interface DrawingParams {
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
  toCanvasX: (x: number) => number;
  toCanvasY: (y: number) => number;
  toDataX: (cx: number) => number;
  toDataY: (cy: number) => number;
  currentCanvasWidth: number;
  currentCanvasHeight: number;
  padding: number;
  isValid: boolean;
}

interface UseCanvasDrawingProps {
  points: Point[];
  lineCreated: boolean;
  interpolationType: "Newton" | "Lagrange";
  setInterpFormula: React.Dispatch<React.SetStateAction<string>>;
}

export function useCanvasDrawing({
  points,
  lineCreated,
  interpolationType,
  setInterpFormula,
}: UseCanvasDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasDims, setCanvasDims] = useState({ width: 800, height: 600 });

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
            if (prevDims.width !== Math.round(width) || prevDims.height !== Math.round(height)) {
              return { width: Math.round(width), height: Math.round(height) };
            }
            return prevDims;
          });
        }
      }
    });

    resizeObserver.observe(container);

    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) {
      setCanvasDims({ width: clientWidth, height: clientHeight });
    }

    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []);

  // Memoized drawing parameters and transformation functions
  const drawingParams: DrawingParams = useMemo(() => {
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
    const PADDING_RATIO = 0.05;

    let calculatedPadding = Math.min(currentCanvasWidth, currentCanvasHeight) * PADDING_RATIO;
    calculatedPadding = Math.max(PADDING_MIN, calculatedPadding);
    calculatedPadding = Math.min(PADDING_MAX, calculatedPadding);
    calculatedPadding = Math.min(calculatedPadding, currentCanvasWidth / 2.1, currentCanvasHeight / 2.1);

    const plotAreaWidth = currentCanvasWidth - 2 * calculatedPadding;
    const plotAreaHeight = currentCanvasHeight - 2 * calculatedPadding;

    if (plotAreaWidth <= 0 || plotAreaHeight <= 0) {
       return {
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
    const toCanvasY = (y: number) => finalOriginY - y * finalScaleY;

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
    const pointRadius = Math.max(3, Math.min(5, canvasDims.width / 100));
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
          formulaString = "P(x) = (Lagrange Polynomial)";
        }
        setInterpFormula(formulaString);

        ctx.strokeStyle = "#8B5CF6";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xMinPlot = toDataX(0);
        const xMaxPlot = toDataX(canvasDims.width);
        const numSegments = Math.max(100, Math.min(300, canvasDims.width / 2));
        const step = (xMaxPlot - xMinPlot) / numSegments;

        let wasLastPointInBounds = false;

        for (let i = 0; i <= numSegments; i++) {
          const x = xMinPlot + i * step;
          const y = evaluatedY(x);
          if (isNaN(y)) {
            wasLastPointInBounds = false;
            continue;
          }

          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);

          const currentPointIsInBounds = !(canvasY < -canvasDims.height * 2 || canvasY > canvasDims.height * 3);

          if (currentPointIsInBounds) {
            if (i === 0 || !wasLastPointInBounds) {
              ctx.moveTo(canvasX, canvasY);
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          }
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
  }, [points, lineCreated, interpolationType, canvasDims, drawingParams, setInterpFormula]);

  useEffect(() => {
    draw();
  }, [draw]);

  return {
    canvasRef,
    canvasContainerRef,
    canvasDims,
    drawingParams,
  };
}
