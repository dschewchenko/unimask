import { describe, expect, it } from "vitest";
import { effectScope } from "vue";
import { useUnimask } from "./composable";

describe("Unimask composable", () => {
  it("formats an input element and a string", () => {
    const scope = effectScope();

    try {
      const composable = scope.run(() => useUnimask("###"));
      if (!composable) {
        throw new Error("The composable effect scope did not run");
      }

      const input = document.createElement("input");
      input.value = "1234";
      composable.onInput(input);

      expect(composable.value.value).toBe("123");

      composable.onInput("5678");
      expect(composable.value.value).toBe("567");
    } finally {
      scope.stop();
    }
  });
});
