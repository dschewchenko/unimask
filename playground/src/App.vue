<template>
  <div>
    <header>
      <h1>Unimask Playground</h1>
      <div class="library-description">
        <p>
          <strong>Unimask</strong> is a lightweight TypeScript library for masking and formatting input values. It
          provides a simple API for applying masks to input fields, with support for Vue, React, and vanilla JavaScript.
        </p>
        <p>Key features:</p>
        <ul>
          <li><strong>Lightweight:</strong> Small footprint with no external dependencies</li>
          <li><strong>Framework Agnostic:</strong> Works with any JavaScript framework</li>
          <li><strong>Flexible:</strong> Supports static, dynamic, and multiple masks</li>
          <li><strong>Type-Safe:</strong> Written in TypeScript with full type definitions</li>
        </ul>
      </div>
    </header>

    <section class="example-section">
      <h2>Vue Examples</h2>
      <div class="container">
        <!-- Simple Phone Mask with Vue Directive -->
        <div class="card">
          <h3>Vue Directive - Phone Mask</h3>
          <p>Format: (###) ###-####</p>
          <input type="text" v-unimask="'(###) ###-####'" placeholder="(###) ###-####" />
          <div class="placeholder">Current value: {{ phoneValue || "Empty" }}</div>
          <div class="placeholder">Try typing a phone number like 1234567890</div>
        </div>

        <!-- UK Postal Code with Vue Directive -->
        <div class="card">
          <h3>Vue Directive - UK Postal Code</h3>
          <p>Multiple formats supported</p>
          <input type="text" v-unimask="postalMasks" placeholder="UK Postal Code" />
          <div class="placeholder">Current value: {{ postalValue || "Empty" }}</div>
          <div class="placeholder">
            <small>Try formats like: AB12 3CD, W1P 1HQ, S1 1AA</small>
          </div>
        </div>
        <div class="card">
          <h3>Vue Component - Postcode Limit</h3>
          <p>Format: #####</p>
          <MaskedInput v-model="postcodeValue" mask="#####" placeholder="Postcode" class="input" />
          <div class="placeholder">Current value: {{ postcodeValue || "Empty" }}</div>
          <div class="placeholder">Try typing more than 5 digits like 312321</div>
        </div>
      </div>
    </section>

    <section class="example-section">
      <h2>Vue Component Example</h2>
      <div class="container">
        <!-- Credit Card Mask with MaskedInput Component -->
        <div class="card">
          <h3>Vue Component - Credit Card Mask</h3>
          <p>Dynamic format based on card type</p>
          <MaskedInput
            v-model="creditCardValue"
            :mask="creditCardMask"
            placeholder="Credit Card Number"
            class="input"
          />
          <div class="placeholder">Current value: {{ creditCardValue || "Empty" }}</div>
          <div class="placeholder">Card type: {{ cardType }}</div>
          <div class="placeholder">
            <small>Try starting with: 34 or 37 for AMEX format, others for standard format</small>
          </div>
        </div>
      </div>
    </section>

    <section class="example-section">
      <h2>React Example</h2>
      <div class="react-example-container"></div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { vUnimask } from "unimask/vue";
import MaskedInput from "./components/MaskedInput.vue";

// For v-unimask directive examples
const phoneValue = ref("");
const postalValue = ref("");

// UK Postal Code masks
const postalMasks = [
  "AA## #AA", // DN55 1PT
  "AA# #AA", // CR2 6XH
  "A#A #AA", // W1P 1HQ
  "AA#A #AA", // EC1A 1BB
  "A## #AA", // M60 1NW
  "A# #AA", // S1 1AA
];

// For MaskedInput component example
const creditCardValue = ref("");
const postcodeValue = ref("");

// Dynamic credit card mask function
const creditCardMask = (value) => {
  if (value.startsWith("34") || value.startsWith("37")) {
    return "#### ###### #####"; // AMEX format
  }
  return "#### #### #### ####"; // Default format
};

// Computed property for card type
const cardType = computed(() => {
  if (creditCardValue.value.startsWith("34") || creditCardValue.value.startsWith("37")) {
    return "American Express";
  } else if (creditCardValue.value.startsWith("4")) {
    return "Visa";
  } else if (creditCardValue.value.startsWith("5")) {
    return "MasterCard";
  }
  return "Unknown";
});
</script>
