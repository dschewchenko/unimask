// File: src/react/useUnimask.ts
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createMaskProcessor, type MaskInput, type MaskProcessorOptions } from "../core";
import { getInputCursorPosition, setInputCursorPosition } from "../dom";

export function useUnimask(mask: MaskInput, options?: MaskProcessorOptions) {
  const [value, setValue] = useState("");

  const maskProcessor = useMemo(() => createMaskProcessor(mask, options), [mask, options]);

  // Similar to Vue's watch on maskProcessor. When maskProcessor changes updates value.
  useEffect(() => {
    setValue((prev: string) => maskProcessor(prev).formatted);
  }, [maskProcessor]);

  const onInput = useCallback(
    (input: string | HTMLInputElement | ChangeEvent<HTMLInputElement>) => {
      const element =
        input instanceof HTMLInputElement ? input : (input as Partial<ChangeEvent<HTMLInputElement>>).target;

      if (element) {
        const cursorPos = getInputCursorPosition(element);
        const result = maskProcessor(element.value, cursorPos);
        setValue(result.formatted.trimEnd());
        setInputCursorPosition(element, result.cursorPosition);
      } else {
        setValue(maskProcessor(input as string).formatted);
      }
    },
    [maskProcessor],
  );

  return { value, onInput };
}
