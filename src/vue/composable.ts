import { computed, type MaybeRef, ref, watch } from "vue";
import { createMaskProcessor, type MaskInput, type MaskProcessorOptions } from "../core";
import { getInputCursorPosition, isLocalHtmlInputElement, setInputCursorPosition } from "../dom";

export function useUnimask(mask: MaybeRef<MaskInput>, options?: MaskProcessorOptions) {
  const maskRef = ref(mask);
  const optionsRef = ref(options);
  const value = ref("");

  const maskProcessor = computed(() => createMaskProcessor(maskRef.value, optionsRef.value));

  watch(
    maskProcessor,
    (val) => {
      value.value = val(value.value).formatted;
    },
    { immediate: true },
  );

  function onInput(val: string | HTMLInputElement) {
    if (!isLocalHtmlInputElement(val)) {
      value.value = maskProcessor.value(val).formatted;
      return;
    }

    const cursorPos = getInputCursorPosition(val);
    const result = maskProcessor.value(val.value, cursorPos);

    value.value = result.formatted.trimEnd();

    setInputCursorPosition(val, result.cursorPosition);
  }

  return {
    value,
    onInput,
  };
}
