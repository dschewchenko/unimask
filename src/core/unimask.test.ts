import {describe, expect, it} from "vitest";
import {createMaskProcessor} from "./unimask";

describe("Unimask", () => {
  // ... existing test blocks ...

  describe("placeholder and formatted behavior", () => {
    it("should handle partial inputs showing placeholder and formatted correctly", () => {
      const maskProcessor = createMaskProcessor("#(##) ###-####");

      const result1 = maskProcessor("1234");
      expect(result1.formatted).toBe("1(23) 4");
      expect(result1.placeholder).toBe("1(23) 4##-####");

      const result2 = maskProcessor("12");
      expect(result2.formatted).toBe("1(2");
      expect(result2.placeholder).toBe("1(2#) ###-####");

      const result3 = maskProcessor("");
      expect(result3.formatted).toBe("");
      expect(result3.placeholder).toBe("#(##) ###-####");
    });

    it("should throw error for invalid mask type", () => {
      expect(() => createMaskProcessor(undefined)).toThrowError("Invalid maskInput type");
    });

    it("should handle letter masks with proper placeholder characters", () => {
      const maskProcessor = createMaskProcessor("AA-## (XXX)");

      const result1 = maskProcessor("ab12");
      expect(result1.formatted).toBe("AB-12 (");
      expect(result1.placeholder).toBe("AB-12 (___)")

      const result2 = maskProcessor("ab12xyz");
      expect(result2.formatted).toBe("AB-12 (xyz)");
      expect(result2.placeholder).toBe("AB-12 (xyz)");
    });

    it("should show proper placeholder for different token types", () => {
      const maskProcessor = createMaskProcessor("### AAA XXX ***");

      const result1 = maskProcessor("123");
      expect(result1.formatted).toBe("123 ");
      expect(result1.placeholder).toBe("123 ___ ___ ___");

      const result2 = maskProcessor("123abc");
      expect(result2.formatted).toBe("123 ABC ");
      expect(result2.placeholder).toBe("123 ABC ___ ___");

      const result3 = maskProcessor("123abcXYZ");
      expect(result3.formatted).toBe("123 ABC XYZ ");
      expect(result3.placeholder).toBe("123 ABC XYZ ___");

      const result4 = maskProcessor("123abcXYZ+~=");
      expect(result4.formatted).toBe("123 ABC XYZ +~=");
      expect(result4.placeholder).toBe("123 ABC XYZ +~=");
    });

    it("should handle array of masks with correct placeholders", () => {
      const maskProcessor = createMaskProcessor([
        "###-##-####",    // SSN
        "(###) ###-####"  // Phone
      ]);

      const result1 = maskProcessor("12345");
      expect(result1.formatted).toBe("123-45-");
      expect(result1.placeholder).toBe("123-45-####");

      const result2 = maskProcessor("1234567890");
      expect(result2.formatted).toBe("(123) 456-7890");
      expect(result2.placeholder).toBe("(123) 456-7890");
    });

    it("should handle escaped characters correctly in placeholders", () => {
      const maskProcessor = createMaskProcessor("!### !AAA");

      const result = maskProcessor("123");
      expect(result.formatted).toBe("#12 A");
      expect(result.placeholder).toBe("#12 A__");

      const result2 = maskProcessor("123abc");
      expect(result2.formatted).toBe("#12 A");
      expect(result2.placeholder).toBe("#12 A__");
    });

    it("should show correct placeholder with dynamic mask function", () => {
      const maskProcessor = createMaskProcessor((value) => {
        return value.length <= 3 ? "###" : "###-###";
      });

      const result1 = maskProcessor("12");
      expect(result1.formatted).toBe("12");
      expect(result1.placeholder).toBe("12#");

      const result2 = maskProcessor("1234");
      expect(result2.formatted).toBe("123-4");
      expect(result2.placeholder).toBe("123-4##");
    });
  });

  describe("simulated user interaction", () => {
    it("should handle sequential typing using a loop", () => {
      const maskProcessor = createMaskProcessor("(###) ###-####");
      const fullInput = "1234567890";
      let currentInput = "";

      for (let i = 0; i < fullInput.length; i++) {
        currentInput += fullInput[i];
        const result = maskProcessor(currentInput);

        // Expected results at key positions
        if (i === 0) {
          expect(result.formatted).toBe("(1");
          expect(result.placeholder).toBe("(1##) ###-####");
        } else if (i === 2) {
          expect(result.formatted).toBe("(123) ");
          expect(result.placeholder).toBe("(123) ###-####");
        } else if (i === 5) {
          expect(result.formatted).toBe("(123) 456-");
          expect(result.placeholder).toBe("(123) 456-####");
        } else if (i === 9) {
          expect(result.formatted).toBe("(123) 456-7890");
          expect(result.placeholder).toBe("(123) 456-7890");
        }
      }
    });

    it("should handle backspace deletion with loop", () => {
      const maskProcessor = createMaskProcessor("(###) ###-####");
      const fullInput = "1234567890";
      let currentInput = fullInput;

      // Check initial state
      let result = maskProcessor(currentInput);
      expect(result.formatted).toBe("(123) 456-7890");

      // Backspace one character at a time from the end
      for (let i = fullInput.length - 1; i >= 0; i--) {
        currentInput = fullInput.substring(0, i);
        result = maskProcessor(currentInput);

        // Check at key positions
        if (i === 9) {
          expect(result.formatted).toBe("(123) 456-789");
          expect(result.placeholder).toBe("(123) 456-789#");
        } else if (i === 6) {
          expect(result.formatted).toBe("(123) 456-");
          expect(result.placeholder).toBe("(123) 456-####");
        } else if (i === 3) {
          expect(result.formatted).toBe("(123) ");
          expect(result.placeholder).toBe("(123) ###-####");
        } else if (i === 0) {
          expect(result.formatted).toBe("");
          expect(result.placeholder).toBe("(###) ###-####");
        }
      }
    });

    it("should handle cursor position edits with array of modifications", () => {
      const maskProcessor = createMaskProcessor("###-###-####");
      const modifications = [
        {input: "1234567890", cursor: 10, expected: {formatted: "123-456-7890", placeholder: "123-456-7890"}},
        {input: "12934567890", cursor: 3, expected: {formatted: "129-345-6789", placeholder: "129-345-6789"}},
        {input: "512934567890", cursor: 1, expected: {formatted: "512-934-5678", placeholder: "512-934-5678"}},
        // Delete scenarios
        {input: "51293456", cursor: 8, expected: {formatted: "512-934-56", placeholder: "512-934-56##"}},
        {input: "5129", cursor: 4, expected: {formatted: "512-9", placeholder: "512-9##-####"}}
      ];

      for (const mod of modifications) {
        const result = maskProcessor(mod.input, mod.cursor);
        expect(result.formatted).toBe(mod.expected.formatted);
        expect(result.placeholder).toBe(mod.expected.placeholder);
      }
    });

    it("should handle multi-mask formats with sequential input", () => {
      const maskProcessor = createMaskProcessor([
        "###.###.###-##", // CPF
        "##.###.###/####-##" // CNPJ
      ]);

      const steps = [
        {input: "1", expected: {formatted: "1", placeholder: "1##.###.###-##"}},
        {input: "123456", expected: {formatted: "123.456.", placeholder: "123.456.###-##"}},
        {input: "12345678901", expected: {formatted: "123.456.789-01", placeholder: "123.456.789-01"}},
        {input: "123456789012", expected: {formatted: "12.345.678/9012-", placeholder: "12.345.678/9012-##"}},
        {input: "12345678901234", expected: {formatted: "12.345.678/9012-34", placeholder: "12.345.678/9012-34"}},
        // Remove characters
        {input: "12345678901", expected: {formatted: "123.456.789-01", placeholder: "123.456.789-01"}}
      ];

      for (const step of steps) {
        const result = maskProcessor(step.input);
        expect(result.formatted).toBe(step.expected.formatted);
        expect(result.placeholder).toBe(step.expected.placeholder);
      }
    });

    it("should handle multi-mask formats with sequential input 2", () => {
      const maskProcessor = createMaskProcessor([
        "AA## #AA",   // DN55 1PT
        "AA# #AA",    // CR2 6XH
        "A#A #AA",    // W1P 1HQ
        "AA#A #AA",   // EC1A 1BB
        "A## #AA",    // M60 1NW
        "A# #AA",     // S1 1AA
      ]);

      // different UK postal codes
      const testCases = [
        {input: "A", expected: {formatted: "A", placeholder: "A# #__"}},
        {input: "A1", expected: {formatted: "A1 ", placeholder: "A1 #__"}},
        {input: "A12", expected: {formatted: "A1 2", placeholder: "A1 2__"}},
        {input: "A123", expected: {formatted: "A12 3", placeholder: "A12 3__"}},
        {input: "A1234", expected: {formatted: "A12 3", placeholder: "A12 3__"}},
        {input: "AB1 2CD", expected: {formatted: "AB1 2CD", placeholder: "AB1 2CD"}},
        {input: "AB12 3CD", expected: {formatted: "AB12 3CD", placeholder: "AB12 3CD"}},
        {input: "AB1C 2CD", expected: {formatted: "AB1C 2CD", placeholder: "AB1C 2CD"}}
      ];

      for (const test of testCases) {
        const result = maskProcessor(test.input);
        expect(result.formatted).toBe(test.expected.formatted);
        expect(result.placeholder).toBe(test.expected.placeholder);
      }
    });

    it("should handle dynamic mask function with various inputs", () => {
      const dynamicMask = createMaskProcessor((value) => {
        if (value.startsWith("34") || value.startsWith("37")) {
          return "#### ###### #####"; // AMEX format
        }
        return "#### #### #### ####"; // Default format
      });

      const testCases = [
        {input: "4", expected: {formatted: "4", placeholder: "4### #### #### ####"}},
        {input: "4111111111111111", expected: {formatted: "4111 1111 1111 1111", placeholder: "4111 1111 1111 1111"}},
        {input: "37", expected: {formatted: "37", placeholder: "37## ###### #####"}},
        {input: "378282246310005", expected: {formatted: "3782 822463 10005", placeholder: "3782 822463 10005"}}
      ];

      for (const test of testCases) {
        const result = dynamicMask(test.input);
        expect(result.formatted).toBe(test.expected.formatted);
        expect(result.placeholder).toBe(test.expected.placeholder);
      }
    });

    it("should simulate user typing and deleting in a form field", () => {
      const maskProcessor = createMaskProcessor("(###) ###-####");
      const userActions = [
        {action: "type", value: "123", expected: {formatted: "(123) ", placeholder: "(123) ###-####"}},
        {action: "type", value: "4", expected: {formatted: "(123) 4", placeholder: "(123) 4##-####"}},
        {action: "type", value: "56", expected: {formatted: "(123) 456-", placeholder: "(123) 456-####"}},
        {action: "delete", count: 3, expected: {formatted: "(123) ", placeholder: "(123) ###-####"}},
        {action: "type", value: "9", expected: {formatted: "(123) 9", placeholder: "(123) 9##-####"}},
        {action: "type", value: "0", expected: {formatted: "(123) 90", placeholder: "(123) 90#-####"}},
        {action: "delete", count: 4, expected: {formatted: "(1", placeholder: "(1##) ###-####"}},
        {action: "paste", value: "4567890", expected: {formatted: "(145) 678-90", placeholder: "(145) 678-90##"}}
      ];

      let currentInput = "";

      for (const action of userActions) {
        if (action.action === "type") {
          currentInput += action.value;
        } else if (action.action === "delete") {
          // @ts-ignore
          currentInput = currentInput.slice(0, -action.count);
        } else if (action.action === "paste") {
          currentInput += action.value;
        }

        const result = maskProcessor(currentInput);

        expect(result.formatted).toBe(action.expected.formatted);
        expect(result.placeholder).toBe(action.expected.placeholder);
      }
    });

    it("should handle paste operations at different cursor positions", () => {
      const maskProcessor = createMaskProcessor("###-###-####");
      const pasteTests = [
        // Start with empty input, paste full number
        {
          initialInput: "",
          pasteValue: "1234567890",
          cursorPos: 0,
          expected: {formatted: "123-456-7890", placeholder: "123-456-7890"}
        },

        // Start with partial input "123", paste "456" in the middle
        {
          initialInput: "123890", pasteValue: "4567", cursorPos: 3,
          finalInput: "1234567890", expected: {formatted: "123-456-7890", placeholder: "123-456-7890"}
        },

        // Start with formatted value, paste in additional digits that would exceed the mask
        {
          initialInput: "1234567890", pasteValue: "99", cursorPos: 7,
          finalInput: "1234567990", expected: {formatted: "123-456-7990", placeholder: "123-456-7990"}
        }
      ];

      for (const test of pasteTests) {
        const finalInput = test.finalInput || (
          test.cursorPos === 0
            ? test.pasteValue + test.initialInput
            : test.initialInput + test.pasteValue
        );

        const result = maskProcessor(finalInput, test.cursorPos);

        expect(result.formatted).toBe(test.expected.formatted);
        expect(result.placeholder).toBe(test.expected.placeholder);
      }
    });
  });

  describe("trim option", () => {
    it("should trim excess characters by default", () => {
      const maskProcessor = createMaskProcessor("###-####");

      const result = maskProcessor("12345678901");
      expect(result.formatted).toBe("123-4567");
      expect(result.placeholder).toBe("123-4567");
    });

    it("should keep excess characters when trim is false", () => {
      const maskProcessor = createMaskProcessor("###-####", {trim: false});

      const result = maskProcessor("12345678901");
      expect(result.formatted).toBe("123-45678901");
      expect(result.placeholder).toBe("123-45678901");
    });

    it("should handle sequential typing with trim=false", () => {
      const maskProcessor = createMaskProcessor("(###) ###-####", {trim: false});
      const fullInput = "12345678901234567890";
      let currentInput = "";

      for (let i = 0; i < fullInput.length; i++) {
        currentInput += fullInput[i];
        const result = maskProcessor(currentInput);

        if (i === 9) {
          expect(result.formatted).toBe("(123) 456-7890");
          expect(result.placeholder).toBe("(123) 456-7890");
        } else if (i === 15) {
          expect(result.formatted).toBe("(123) 456-7890123456");
          expect(result.placeholder).toBe("(123) 456-7890123456");
        }
      }
    });

    it("should handle different masks with trim=false", () => {
      const tests = [
        {
          mask: "AA-##",
          input: "ab123456",
          expected: {formatted: "AB-123456", placeholder: "AB-123456"}
        },
        {
          mask: "##/##/####",
          input: "010120231234",
          expected: {formatted: "01/01/20231234", placeholder: "01/01/20231234"}
        },
        {
          mask: "A-***",
          input: "Aabcdefg",
          expected: {formatted: "A-abcdefg", placeholder: "A-abcdefg"}
        }
      ];

      for (const test of tests) {
        const maskProcessor = createMaskProcessor(test.mask, {trim: false});
        const result = maskProcessor(test.input);
        expect(result.formatted).toBe(test.expected.formatted);
        expect(result.placeholder).toBe(test.expected.placeholder);
      }
    });

    it("should work with array masks and trim=false", () => {
      const maskProcessor = createMaskProcessor([
        "###-##-####",    // SSN
        "(###) ###-####"  // Phone
      ], {trim: false});

      const result = maskProcessor("123456789012345");
      expect(result.formatted).toBe("(123) 456-789012345");
      expect(result.placeholder).toBe("(123) 456-789012345");
    });

    it("should work with dynamic masks and trim=false", () => {
      const maskProcessor = createMaskProcessor((value) => {
        return value.length <= 4 ? "####" : "####-####";
      }, {trim: false});

      const result1 = maskProcessor("123");
      expect(result1.formatted).toBe("123");
      expect(result1.placeholder).toBe("123#");

      const result2 = maskProcessor("12345678901");
      expect(result2.formatted).toBe("1234-5678901");
      expect(result2.placeholder).toBe("1234-5678901");
    });
  });
});
