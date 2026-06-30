import type { Directive, DirectiveBinding } from "vue";
import { createMaskProcessor, type MaskInput } from "../core";
import { dispatchInputEvent, getInputCursorPosition, setInputCursorPosition } from "../dom";

declare global {
  interface HTMLInputElement {
    __unimaskCleanup?: () => void;
  }
}

// Extract initialization logic to standalone function
function initializeUnimask(el: HTMLInputElement, binding: DirectiveBinding<MaskInput>) {
  // Clean up previous handler if exists
  el.__unimaskCleanup?.();

  // Ignore if no mask is provided
  if (!binding.value) return;
  let isProcessing = false;

  const eagerProcessor = createMaskProcessor(binding.value);
  const lazyProcessor = createMaskProcessor(binding.value, { lazy: true });

  const initialResult = eagerProcessor(el.value);
  el.value = initialResult.formatted;
  let oldValue = el.value;

  const inputHandler = (event: Event) => {
    if (isProcessing) return;
    isProcessing = true;

    const input = event.target as HTMLInputElement;
    const cursorPos = getInputCursorPosition(input);
    const isDeleting = input.value.length < oldValue.length;
    const processor = isDeleting ? lazyProcessor : eagerProcessor;
    const result = processor(input.value, cursorPos);
    const formattedValue = result.formatted.trimEnd();
    oldValue = formattedValue;

    if (input.value !== formattedValue) {
      event.stopImmediatePropagation();
      input.value = formattedValue;
      dispatchInputEvent(input);
    }

    setInputCursorPosition(input, result.cursorPosition);
    isProcessing = false;
  };

  el.addEventListener("input", inputHandler, true);
  el.__unimaskCleanup = () => el.removeEventListener("input", inputHandler, true);
}

export const vUnimask: Directive<HTMLInputElement, MaskInput> = {
  mounted(el, binding) {
    initializeUnimask(el, binding);
  },

  beforeUnmount(el) {
    el.__unimaskCleanup?.();
  },

  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      initializeUnimask(el, binding);
    }
  },
};
