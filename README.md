# unimask [![npm](https://img.shields.io/npm/v/unimask.svg)](https://www.npmjs.com/package/unimask) [![build status](https://github.com/dschewchenko/unimask/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/dschewchenko/unimask/actions/workflows/release.yml) [![Download](https://img.shields.io/npm/dm/unimask)](https://www.npmjs.com/package/unimask)


A lightweight TypeScript library for masking and formatting input values.

## Features

-   **Masking**: Apply predefined or custom masks to input values.
-   **Formatting**: Format input values based on the applied mask.
-   **Framework Agnostic**: Can be used with any JavaScript framework or library.
-   **Customizable**: Define your own masks and formatting rules.
-   **Lightweight**: Small footprint with no external dependencies.
-   **Tests**: Comprehensive test coverage to ensure reliability. (90%+)

## Installation

```bash
# npm
npm install unimask

# yarn
yarn add unimask

# pnpm
pnpm add unimask
```


## Usage

### Basic Masking

```ts
import { createMaskProcessor } from 'unimask';

const maskProcessor = createMaskProcessor('(###) ###-####');
const result = maskProcessor('12345678');

console.log(result.formatted); // Output: (123) 456-78
console.log(result.placeholder); // Output: (123) 456-78##

```

### Array of Masks

```ts
const maskProcessor = createMaskProcessor(['+1 (###) ###-####', '###-###-####']);
const result1 = maskProcessor('1234567890');
const result2 = maskProcessor('1234567');

console.log(result1.formatted); // Output: 123-456-7890
console.log(result2.formatted); // Output: 123-4567
```

### Dynamic Masks

It will automatically switch between masks based on the input value. Also order of masks does not matter, it will use from less to most complicated.

```ts
const maskProcessor = createMaskProcessor((value: string) => {
  return value.startsWith("+")
    ? "+1 (###) ###-####"
    : "###-###-####";
});

const result1 = maskProcessor('1234567890');
const result2 = maskProcessor('+12345678901');

console.log(result1.formatted); // Output: 123-456-7890
console.log(result2.formatted); // Output: +1 (234) 567-8901
```

### Turn off trimming

It will return formatted string but will not trim the excess characters.

```ts
const maskProcessor = createMaskProcessor('(###) ###-####', { trim: false });

const result = maskProcessor('12345678');
const result2 = maskProcessor('12345678901234567890');

console.log(result.formatted); // Output: (123) 456-78
console.log(result2.formatted); // Output: (123) 456-78901234567890
```

## API

**createMaskProcessor(mask: MaskInput, options?: MaskProcessorOptions)**
Creates a mask processor function.


- mask: A mask string, an array of masks, or a function that returns a mask string based on the input value.
- options: An optional object with the following properties:
  - trim: A boolean indicating whether to trim excess characters from the input value. Defaults to true.

**MaskInput**

Type alias for the mask input:

```ts
type MaskInput = string | string[] | ((value: string, lastChar: string, cursorPos: number) => string);
```

**MaskProcessorOptions**

Type alias for the mask processor options:

```ts
type MaskProcessorOptions = {
  trim?: boolean;
};
```

**MaskProcessorResult**
Type alias for the result of the mask processor function:

```ts
type MaskProcessorResult = {
  formatted: string; // The formatted value based on the mask (just filled characters)
  placeholder: string; // The placeholder value based on the mask (with filled and unfilled characters)
  cursorPosition: number; // The cursor position after formatting
};
```

### Mask Tokens

The following tokens are supported in the mask:

- `#`: Digit (0-9).
- `a`: Alphabetic character in lowercase (a-z).
- `A`: Alphabetic character in uppercase (A-Z).
- `S`: Alphabetic character (a-zA-Z).
- `X`: Alphanumeric character (0-9, a-z, A-Z).
- `*`: Any character.
- `!`: Escape character. The next character will be treated as a literal character and will not be masked.

Other characters in the mask are treated as literals and will be included in the formatted value.

## Integrations

### Vue directive

```vue
<template>
  <input v-model="value" v-unimask="'(###) ###-####'" />
</template>
<script setup lang="ts">
import { vUnimask } from "unimask/vue";
import { ref } from "vue";

const value = ref("");
</script>
```


## Enjoy!

If you have any questions or suggestions, feel free to open an issue or pull request.


## Roadmap

- [x] Create a library
- [x] Add tests
- [x] Add documentation
- [x] Vue directive
- [ ] Vue composable
- [ ] React hook
- [ ] Angular directive
- [ ] Svelte directive
- [ ] Custom tokens and formatters


## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2025 by [Dmytro Shevchenko](https://github.com/dschewchenko)
