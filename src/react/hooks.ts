// File: src/react/useUnimask.ts
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createMaskProcessor, type MaskInput, type MaskProcessorOptions } from "../core";
import { getInputCursorPosition, isLocalHtmlInputElement, setInputCursorPosition } from "../dom";

export function useUnimask(mask: MaskInput, options?: MaskProcessorOptions) {
  const [value, setValue] = useState("");

  const maskProcessor = useMemo(() => createMaskProcessor(mask, options), [mask, options]);

  // Similar to Vue's watch on maskProcessor. When maskProcessor changes updates value.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Remask the controlled value when the processor changes.
    setValue((prev: string) => maskProcessor(prev).formatted);
  }, [maskProcessor]);

  const onInput = useCallback(
    (input: string | HTMLInputElement | ChangeEvent<HTMLInputElement>) => {
      let element = isLocalHtmlInputElement(input) ? input : undefined;
      if (!element && typeof input !== "string" && "target" in input) {
        element = input.target;
      }
      if (!element) {
        setValue(maskProcessor(input as string).formatted);
        return;
      }

      const cursorPos = getInputCursorPosition(element);
      const result = maskProcessor(element.value, cursorPos);
      setValue(result.formatted.trimEnd());
      setInputCursorPosition(element, result.cursorPosition);
    },
    [maskProcessor],
  );

  return { value, onInput };
}
