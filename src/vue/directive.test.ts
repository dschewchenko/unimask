import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { vUnimask } from "./directive";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import type {MaskInput} from "../core";

// Create reusable test setup helper
function setupDirectiveTest(mask: MaskInput = "###-###-####") {
  // Create a test component using the directive
  const TestComponent = defineComponent({
    template: `<input v-mask="mask" data-testid="input" />`,
    props: {
      mask: {
        type: [String, Array, Function],
        default: mask
      }
    },
    directives: {
      mask: vUnimask
    }
  });

  // Mount the component
  const wrapper = mount(TestComponent, {
    props: { mask }
  });

  // Get the input element
  const input = wrapper.find("input").element as HTMLInputElement;

  // Create helper functions
  const setInputValue = async (value: string) => {
    input.value = value;
    await wrapper.find("input").trigger("input");
    await vi.runAllTimersAsync();
    await nextTick();
  };

  const updateMask = async (newMask: MaskInput) => {
    await wrapper.setProps({ mask: newMask });
    await nextTick();
  };

  return {
    wrapper,
    input,
    setInputValue,
    updateMask
  };
}

describe("vUnimask Directive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should apply mask formatting on input events", async () => {
    const { input, setInputValue } = setupDirectiveTest();
    const selectionRangeSpy = vi.spyOn(input, "setSelectionRange");

    await setInputValue("1234567890");

    expect(input.value).toBe("123-456-7890");
    expect(selectionRangeSpy).toHaveBeenCalled();
  });

  it("should clean up event listeners when unmounted", async () => {
    const { wrapper, input } = setupDirectiveTest();
    const removeEventListenerSpy = vi.spyOn(input, "removeEventListener");

    wrapper.unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("input", expect.any(Function));
  });

  it("should reinitialize when binding value changes", async () => {
    const { input, setInputValue, updateMask } = setupDirectiveTest();

    await setInputValue("1234567890");
    expect(input.value).toBe("123-456-7890");

    await updateMask("AA-####");

    await setInputValue("AB1234");
    expect(input.value).toBe("AB-1234");
  });

  it("should preserve cursor position", async () => {
    const { input, setInputValue } = setupDirectiveTest();
    const selectionRangeSpy = vi.spyOn(input, "setSelectionRange");

    // Set cursor position
    Object.defineProperty(input, "selectionStart", { value: 3, configurable: true });

    await setInputValue("1234567890");

    expect(selectionRangeSpy).toHaveBeenCalled();
  });

  it("should handle array mask types", async () => {
    const { input, setInputValue } = setupDirectiveTest(["###-###", "(###) ###-####"]);

    await setInputValue("1234567890");
    expect(input.value).toBe("(123) 456-7890");
  });

  it("should handle function mask types", async () => {
    const maskFn = (val: string) => val.length <= 6 ? "###-###" : "(###) ###-####";
    const { input, setInputValue } = setupDirectiveTest(maskFn);

    await setInputValue("123456");
    expect(input.value).toBe("123-456");

    await setInputValue("1234567890");
    expect(input.value).toBe("(123) 456-7890");
  });

  it("should handle empty input", async () => {
    const { input, setInputValue } = setupDirectiveTest();

    await setInputValue("");
    expect(input.value).toBe("");
  });

  it("should handle UK postal code sequential input with different mask patterns", async () => {
    // Define array of UK postal code masks
    const ukPostcodeMasks = [
      "AA#A #AA",   // EC1A 1BB
      "A#A #AA",    // W1P 1HQ
      "AA# #AA",    // CR2 6XH
      "AA## #AA",   // DN55 1PT
      "A# #AA",     // S1 1AA
      "A## #AA",    // M60 1NW
    ];

    const { input, setInputValue } = setupDirectiveTest(ukPostcodeMasks);

    // Test sequential input for problem case SW1W 0NY
    const sw1w0nySequences = [
      { input: "S", expected: "S" },
      { input: "SW", expected: "SW" },
      { input: "SW1", expected: "SW1 " },
      { input: "SW1W", expected: "SW1W " },
      { input: "SW1W0", expected: "SW1W 0" },
      { input: "SW1W0N", expected: "SW1W 0N" },
      { input: "SW1W0NY", expected: "SW1W 0NY" },
    ];

    for (const seq of sw1w0nySequences) {
      await setInputValue(seq.input);
      expect(input.value).toBe(seq.expected);
    }

    // Test sequential input for EC1A 1BB
    await setInputValue("");
    const ec1a1bbSequences = [
      { input: "E", expected: "E" },
      { input: "EC", expected: "EC" },
      { input: "EC1", expected: "EC1 " },
      { input: "EC1A", expected: "EC1A " },
      { input: "EC1A1", expected: "EC1A 1" },
      { input: "EC1A1B", expected: "EC1A 1B" },
      { input: "EC1A1BB", expected: "EC1A 1BB" },
    ];

    for (const seq of ec1a1bbSequences) {
      await setInputValue(seq.input);
      expect(input.value).toBe(seq.expected);
    }

    // Test sequential input for W1P 1HQ
    await setInputValue("");
    const w1p1hqSequences = [
      { input: "W", expected: "W" },
      { input: "W1", expected: "W1 " },
      { input: "W1P", expected: "W1P " },
      { input: "W1P1", expected: "W1P 1" },
      { input: "W1P1H", expected: "W1P 1H" },
      { input: "W1P1HQ", expected: "W1P 1HQ" },
    ];

    for (const seq of w1p1hqSequences) {
      await setInputValue(seq.input);
      expect(input.value).toBe(seq.expected);
    }

    // Test sequential input for S1 1AA
    await setInputValue("");
    const s11aaSequences = [
      { input: "S", expected: "S" },
      { input: "S1", expected: "S1 " },
      { input: "S11", expected: "S1 1" },
      { input: "S11A", expected: "S1 1A" },
      { input: "S11AA", expected: "S1 1AA" },
    ];

    for (const seq of s11aaSequences) {
      await setInputValue(seq.input);
      expect(input.value).toBe(seq.expected);
    }

    // Test sequential input for M60 1NW
    await setInputValue("");
    const m601nwSequences = [
      { input: "M", expected: "M" },
      { input: "M6", expected: "M6 " },
      { input: "M60", expected: "M6 0" },
      { input: "M601", expected: "M60 1" },
      { input: "M601N", expected: "M60 1N" },
      { input: "M601NW", expected: "M60 1NW" },
    ];

    for (const seq of m601nwSequences) {
      await setInputValue(seq.input);
      expect(input.value).toBe(seq.expected);
    }

    // Test sequential input for CR2 6XH
    await setInputValue("");
    const cr26xhSequences = [
      { input: "C", expected: "C" },
      { input: "CR", expected: "CR" },
      { input: "CR2", expected: "CR2 " },
      { input: "CR26", expected: "CR2 6" },
      { input: "CR26X", expected: "CR2 6X" },
      { input: "CR26XH", expected: "CR2 6XH" },
    ];

    for (const seq of cr26xhSequences) {
      await setInputValue(seq.input);
      expect(input.value).toBe(seq.expected);
    }

    // Test simpler patterns
    const otherPatterns = [
      { input: "W1P1HQ", expected: "W1P 1HQ" }, // A#A #AA
      { input: "S11AA", expected: "S1 1AA" },   // A# #AA
      { input: "M601NW", expected: "M60 1NW" }, // A## #AA
      { input: "CR26XH", expected: "CR2 6XH" },  // AA# #AA
      { input: "EC1A1BB", expected: "EC1A 1BB" }, // AA#A #AA
      { input: "DN551PT", expected: "DN55 1PT" }, // AA## #AA
    ];

    for (const pattern of otherPatterns) {
      await setInputValue("");
      await setInputValue(pattern.input);
      expect(input.value).toBe(pattern.expected);
    }
  });
});
