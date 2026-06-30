export function getInputCursorPosition(input: HTMLInputElement): number {
  return input.selectionStart ?? input.value.length;
}

export function setInputCursorPosition(input: HTMLInputElement, position: number): void {
  setTimeout(() => {
    input.setSelectionRange(position, position);
  }, 0);
}

export function dispatchInputEvent(input: HTMLInputElement): void {
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
