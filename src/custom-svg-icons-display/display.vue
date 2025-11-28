<template>
  <div class="custom-icon-display">
    <div
      v-if="iconSvg"
      class="icon-wrapper"
      :class="{
        'with-styling': backgroundColor || borderColor,
      }"
      :style="iconStyle"
      v-html="iconSvg"
    ></div>
    <span v-else-if="value" class="icon-fallback">{{ value }}</span>
    <span v-else class="icon-empty">—</span>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from "vue";
  import { useApi } from "@directus/extensions-sdk";

  interface Props {
    value?: string | null;
    backgroundColor?: string | null;
    borderColor?: string | null;
    padding?: string | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: null,
    backgroundColor: null,
    borderColor: null,
    padding: null,
  });

  const api = useApi();
  const iconSvg = ref<string>("");

  const iconStyle = computed(() => {
    const styles: Record<string, string> = {};

    if (props.backgroundColor) {
      styles.backgroundColor = props.backgroundColor;
    }

    if (props.borderColor) {
      styles.border = `2px solid ${props.borderColor}`;
    }

    if (props.padding) {
      styles.padding = props.padding;
    }

    return styles;
  });

  onMounted(async () => {
    await loadIcon();
  });

  watch(
    () => props.value,
    async () => {
      await loadIcon();
    }
  );

  async function loadIcon() {
    if (!props.value) {
      iconSvg.value = "";
      return;
    }

    try {
      const response = await api.get("/custom-svg-icons/by-value", {
        params: {
          values: props.value,
        },
      });

      if (response.data.icons && response.data.icons[props.value]) {
        iconSvg.value = response.data.icons[props.value].svg;
      } else {
        // Icon not found
        iconSvg.value = "";
      }
    } catch (error) {
      console.error("Failed to load icon:", error);
      iconSvg.value = "";
    }
  }
</script>

<style scoped>
  .custom-icon-display {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-wrapper {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--theme--foreground);
    transition: all var(--fast) var(--transition);
  }

  .icon-wrapper.with-styling {
    width: 24px;
    height: 24px;
    border-radius: var(--theme--border-radius);
  }

  .icon-wrapper.with-styling :deep(svg) {
    width: 100%;
    height: 100%;
  }

  .icon-wrapper :deep(svg) {
    max-width: 100%;
    max-height: 100%;
  }

  .icon-fallback {
    font-size: 12px;
    color: var(--theme--foreground-subdued);
    font-family: var(--theme--fonts--monospace);
  }

  .icon-empty {
    color: var(--theme--foreground-subdued);
  }
</style>
