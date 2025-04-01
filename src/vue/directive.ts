import type { Directive, DirectiveBinding } from "vue";
import { createMaskProcessor, type MaskInput } from "../core";

declare global {
  interface HTMLInputElement {
    __unimaskCleanup?: () => void;
  }
}

// Extract initialization logic to standalone function
function initializeUnimask(
  el: HTMLInputElement,
  binding: DirectiveBinding<MaskInput>
) {
  // Clean up previous handler if exists
  el.__unimaskCleanup?.();

  const maskProcessor = createMaskProcessor(binding.value);

  const inputHandler = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart || 0;
    const result = maskProcessor(input.value, cursorPos);

    input.value = result.formatted;

    setTimeout(() => {
      input.setSelectionRange(result.cursorPosition, result.cursorPosition);
    }, 0);
  };

  el.addEventListener("input", inputHandler);
  el.__unimaskCleanup = () => el.removeEventListener("input", inputHandler);
}

export const vUnimask: Directive<any, MaskInput> = {
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
  }
};
