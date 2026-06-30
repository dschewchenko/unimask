<template>
  <input :value="modelValue" v-unimask="mask" @input="onInput" :placeholder="placeholder" v-bind="$attrs" />
</template>

<script>
import { defineComponent, watch } from "vue";
import { vUnimask } from "unimask/vue";

export default defineComponent({
  name: "MaskedInput",
  inheritAttrs: false,
  directives: {
    unimask: vUnimask,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    mask: {
      type: [String, Array, Function],
      required: true,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    placeholder: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    watch([() => props.mask, () => props.options], () => {
      if (props.modelValue) {
        emit("update:modelValue", props.modelValue);
      }
    });

    const onInput = (event) => {
      const input = event.target;
      emit("update:modelValue", input.value);
    };

    return {
      onInput,
    };
  },
});
</script>
