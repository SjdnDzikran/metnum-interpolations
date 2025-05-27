// Function to evaluate the Lagrange polynomial at a given x
export function evaluateLagrangePolynomial(
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
export function calculateDividedDifferences(
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
export function generateNewtonPolynomialFormula(
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
export function evaluateNewtonPolynomial(
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
