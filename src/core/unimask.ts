export type MaskInput = string | string[] | ((value: string, lastChar: string, cursorPos: number) => string);
export interface MaskProcessorOptions {
  trim?: boolean;
}

const ESCAPE_CHAR = "!";
const TOKENS = ["X", "A", "a", "S", "#", "*"] as const;
type MainToken = typeof TOKENS[number];
const PLACEHOLDER_CHARS: Record<MainToken, string> = {
  "A": "_", "a": "_", "S": "_", "X": "_", "*": "_", "#": "#"
};

type MaskSegment = {
  char: string;
  isToken: boolean;
  isEscaped: boolean;
};

// Parse mask into segments once, then reuse
function parseMask(mask: string): MaskSegment[] {
  const segments: MaskSegment[] = [];
  let isEscaped = false;

  for (let i = 0; i < mask.length; i++) {
    if (!isEscaped && mask[i] === ESCAPE_CHAR) {
      isEscaped = true;
      continue;
    }

    const isToken = !isEscaped && TOKENS.includes(mask[i] as MainToken);
    segments.push({ char: mask[i], isToken, isEscaped });
    isEscaped = false;
  }

  return segments;
}

// Validation rules for each token type
function isValidChar(token: MainToken, char: string): boolean {
  switch (token) {
    case "A":
    case "a":
    case "S":
      return /[a-z]/i.test(char);
    case "#":
      return /[0-9]/.test(char);
    case "X":
      return /[0-9a-z]/i.test(char);
    case "*":
      return true;
    /* v8 ignore next 2 no need, it's just safe place */
    default:
      return false;
  }
}

// Formatting rules for each token type
function formatChar(token: MainToken, char: string): string {
  if (token === "A") return char.toUpperCase();
  if (token === "a") return char.toLowerCase();
  return char;
}

// Sort masks by complexity
function calculateMaskComplexity(mask: string): number {
  let complexity = 0;
  const l = mask.length;
  for (let i = 0; i < l; i++) {
    if (TOKENS.includes(mask[i] as MainToken)) {
      complexity++;
    }
  }
  return complexity;
}

export function createMaskProcessor(maskInput: MaskInput, options: MaskProcessorOptions = {}) {
  if (!maskInput || (typeof maskInput === "string" && maskInput.trim() === "")) {
    return function processInput(input: string, cursorPos: number = input.length) {
      return { formatted: input, placeholder: input, cursorPosition: cursorPos };
    };
  }

  const { trim = true } = options;
  let masks: string[] = [];
  let parsedMasks: MaskSegment[][] = [];
  let dynamicMaskFn: ((val: string, lastChar: string, cursorPos: number) => string) | null = null;

  if (typeof maskInput === "string") {
    masks = [maskInput];
    parsedMasks = [parseMask(maskInput)];
  } else if (Array.isArray(maskInput)) {
    masks = [...maskInput];
    // Sort from more complex to less complex
    masks.sort((a, b) => calculateMaskComplexity(b) - calculateMaskComplexity(a));
    parsedMasks = masks.map(parseMask);
  } else if (typeof maskInput === "function") {
    dynamicMaskFn = maskInput;
  } else {
    throw new Error("Invalid maskInput type");
  }

  return function processInput(input: string, cursorPos: number = input.length) {
    // Get appropriate mask for this input
    const { parsedMask } = getMaskForInput(masks, parsedMasks, dynamicMaskFn, input, cursorPos);

    // Format the input using the mask
    const { formatted, cursorPosition } = formatWithMask(parsedMask, input, trim, cursorPos);

    // Create a placeholder for the mask
    const placeholder = createPlaceholder(parsedMask, formatted);

    return { formatted, placeholder, cursorPosition };
  };
}

function getMaskForInput(
  masks: string[],
  parsedMasks: MaskSegment[][],
  dynamicMaskFn: ((val: string, lastChar: string, cursorPos: number) => string) | null,
  input: string,
  cursorPos: number
): { mask: string; parsedMask: MaskSegment[] } {
  if (dynamicMaskFn) {
    const dynamicMask = dynamicMaskFn(input, input.charAt(input.length - 1) || "", cursorPos);
    return { mask: dynamicMask, parsedMask: parseMask(dynamicMask) };
  }

  const bestMaskIndex = parsedMasks.length > 1 ? findBestMaskIndex(parsedMasks, input) : 0;
  return { mask: masks[bestMaskIndex], parsedMask: parsedMasks[bestMaskIndex] };
}

function totalTokens(parsedMask: MaskSegment[]): number {
  return parsedMask.reduce((count, segment) => segment.isToken ? count + 1 : count, 0);
}

function findBestMaskIndex(parsedMasks: MaskSegment[][], input: string): number {
  if (!input || parsedMasks.length === 1) return 0;

  // Track how many characters each mask can process
  const processedCounts: number[] = parsedMasks.map(mask => countProcessedChars(mask, input));
  let bestIndex = 0;
  let maxCount = processedCounts[0];

  for (let i = 1; i < processedCounts.length; i++) {
    if (processedCounts[i] > maxCount) {
      bestIndex = i;
      maxCount = processedCounts[i];
    } else if (processedCounts[i] === maxCount) {
      const bestTotal = totalTokens(parsedMasks[bestIndex]);
      const currentTotal = totalTokens(parsedMasks[i]);

      const bestFullyMatched = processedCounts[bestIndex] === bestTotal;
      const currentFullyMatched = processedCounts[i] === currentTotal;

      // If one mask is fully matched and the other is not, choose the fully matched one.
      if (currentFullyMatched && !bestFullyMatched) {
        bestIndex = i;
      } else if (!currentFullyMatched && bestFullyMatched) {
        // keep the current best
      } else if (bestFullyMatched && currentFullyMatched) {
        // If both fully match then choose the one with lower token count
        if (currentTotal < bestTotal) {
          bestIndex = i;
        }
      } else {
        // Neither mask fully matches.
        // Prefer the mask with a higher total token count so that more input can be accepted.
        if (currentTotal > bestTotal) {
          bestIndex = i;
        }
      }
    }
  }

  return bestIndex;
}

// This function simulates how the input would be processed with the given mask
function countProcessedChars(mask: MaskSegment[], input: string): number {
  if (!input) return 0;

  let inputIndex = 0;

  for (let i = 0; i < mask.length && inputIndex < input.length; i++) {
    const segment = mask[i];

    if (segment.isToken) {
      // For token segments (like A, #, etc.)
      if (isValidChar(segment.char as MainToken, input[inputIndex])) {
        inputIndex++;
      } else {
        // If current character doesn't match this token, we stop processing
        break;
      }
    } else if (segment.isEscaped) {
      // For escaped characters
      if (input[inputIndex] === segment.char) {
        inputIndex++;
      } else {
        // If doesn't match the escaped character, we stop
        break;
      }
    } else {
      // For literal characters in the mask (like spaces, hyphens)
      if (input[inputIndex] === segment.char) {
        // Input matched the literal, consume it
        inputIndex++;
      }
      // If input doesn't match the literal, we just skip it (don't break)
      // This allows formats like "A## ###" to work when typing "A12345"
    }
  }

  return inputIndex;
}

function formatWithMask(
  parsedMask: MaskSegment[],
  input: string,
  trim: boolean,
  cursorPos: number
): { formatted: string; cursorPosition: number } {
  if (!input) return { formatted: "", cursorPosition: 0 };

  let formatted = "";
  let inputIndex = 0;
  let formattedIndex = 0;
  let cursorPosition = 0;
  const inputCursorPos = Math.min(cursorPos, input.length);

  for (let i = 0; i < parsedMask.length; i++) {
    const segment = parsedMask[i];

    // Track cursor position
    if (inputIndex === inputCursorPos) {
      cursorPosition = formattedIndex;
    }

    if (segment.isEscaped) {
      formatted += segment.char;
      formattedIndex++;

      if (inputIndex < input.length && input[inputIndex] === segment.char) {
        inputIndex++;
      }
      continue;
    }

    if (segment.isToken) {
      if (inputIndex >= input.length || !isValidChar(segment.char as MainToken, input[inputIndex])) {
        break;
      }

      formatted += formatChar(segment.char as MainToken, input[inputIndex]);
      formattedIndex++;
      inputIndex++;
    } else {
      formatted += segment.char;
      formattedIndex++;

      if (inputIndex < input.length && input[inputIndex] === segment.char) {
        inputIndex++;
      }
    }

    // Break if we've processed all input and next char requires input
    if (inputIndex >= input.length) {
      const nextPosition = i + 1;
      if (nextPosition < parsedMask.length) {
        const nextSegment = parsedMask[nextPosition];
        if (nextSegment.isEscaped || nextSegment.isToken) {
          break;
        }
      }
    }
  }

  // Set cursor at the end if we processed all input
  if (inputCursorPos >= inputIndex) {
    cursorPosition = formattedIndex;
  }

  // Add remaining input if not trimming
  if (!trim && inputIndex < input.length) {
    const remaining = input.substring(inputIndex);
    formatted += remaining;

    // Update cursor if it was in the remaining part
    if (inputCursorPos > inputIndex) {
      cursorPosition += inputCursorPos - inputIndex;
    }
  }

  return { formatted, cursorPosition };
}

function createPlaceholder(parsedMask: MaskSegment[], formatted: string): string {
  if (!formatted) {
    let placeholder = "";
    for (const segment of parsedMask) {
      placeholder += getPlaceholderChar(segment);
    }
    return placeholder;
  }

  // Find position in mask that corresponds to end of formatted string
  const maskOffset = findMaskOffset(parsedMask, formatted);

  // Add the formatted part plus placeholder chars for the rest
  let placeholder = formatted;
  for (let i = maskOffset; i < parsedMask.length; i++) {
    placeholder += getPlaceholderChar(parsedMask[i]);
  }

  return placeholder;
}

function findMaskOffset(parsedMask: MaskSegment[], formatted: string): number {
  let formattedIndex = 0;
  let offset = 0;

  for (offset = 0; offset < parsedMask.length; offset++) {
    if (formattedIndex >= formatted.length) {
      break;
    }

    const segment = parsedMask[offset];
    if (segment.isToken ||
      (segment.isEscaped && formattedIndex < formatted.length) ||
      (!segment.isToken && !segment.isEscaped && formattedIndex < formatted.length)) {
      formattedIndex++;
    }
  }

  return offset;
}

function getPlaceholderChar(segment: MaskSegment): string {
  if (segment.isEscaped) return segment.char;
  return segment.isToken ? PLACEHOLDER_CHARS[segment.char as MainToken] : segment.char;
}
