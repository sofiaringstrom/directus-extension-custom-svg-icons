<template>
  <div class="custom-icon-select">
    <v-notice v-if="error" type="warning">
      {{ error }}
    </v-notice>

    <v-notice v-else-if="loading" type="info" class="notice-loading">
      <VProgressCircular value="" :indeterminate="true" /> Loading icons...
    </v-notice>

    <div v-else-if="iconGroups.length === 0" class="empty-state">
      <v-notice type="info">
        <p>No icons configured yet.</p>
        <p>
          Create a folder named <strong>"Custom SVG Icons"</strong> in Files and
          upload SVG files. Use the <strong>Description</strong> field to set
          the custom return value.
        </p>
        <p>
          Optionally, create subfolders within "Custom SVG Icons" to organize
          icons into groups.
        </p>
      </v-notice>
    </div>

    <div v-else class="dropdown-wrapper">
      <v-menu v-model="menuActive" attached :disabled="false">
        <template #activator="{ toggle, active, activate, deactivate }">
          <v-input
            v-model="searchQuery"
            :placeholder="value ? selectedIcon?.label || value : placeholder"
            :class="{ 'has-value': value }"
            :nullable="false"
            @click="(e: any) => onClickInput(e, toggle)"
            @keydown="(e: any) => onKeydownInput(e, activate)"
          >
            <template v-if="selectedIcon" #prepend>
              <div
                class="selected-icon-preview"
                v-html="selectedIcon.svg"
                @click="toggle"
              ></div>
            </template>

            <template #append>
              <div class="item-actions">
                <v-icon
                  v-if="value"
                  name="close"
                  clickable
                  @click="
                    () => {
                      selectIcon(null);
                      deactivate();
                    }
                  "
                />
                <v-icon
                  v-else
                  name="expand_more"
                  clickable
                  class="open-indicator"
                  :class="{ open: active }"
                  @click="toggle"
                />
              </div>
            </template>
          </v-input>
        </template>

        <div ref="contentRef" class="content">
          <template v-for="group in filteredGroups" :key="group.name">
            <v-divider
              v-if="group.icons.length > 0"
              inline-title
              class="icon-row"
            >
              {{ group.name }}
            </v-divider>

            <div v-if="group.icons.length > 0" class="icons-grid">
              <VButton
                v-for="icon in group.icons"
                :key="icon.key"
                @click="selectIcon(icon.value)"
                :tooltip="getTooltipText(icon)"
                xSmall
                secondary
                :tile="false"
                class="icon-button"
                :class="{ active: icon.value === value }"
              >
                <div class="icon-content" v-html="icon.svg"></div>
              </VButton>
            </div>
          </template>

          <div v-if="filteredGroups.length === 0" class="no-results">
            No icons found
          </div>
        </div>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from "vue";
  import { useApi } from "@directus/extensions-sdk";

  interface Icon {
    key: string;
    label: string;
    value: string;
    svg: string;
  }

  interface Props {
    value?: string | null;
    placeholder?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: null,
    placeholder: "Select an icon...",
  });

  const emit = defineEmits<{
    (e: "input", value: string | null): void;
  }>();

  interface IconGroup {
    name: string;
    icons: Icon[];
  }

  const api = useApi();
  const iconGroups = ref<IconGroup[]>([]);
  const loading = ref(true);
  const error = ref("");
  const searchQuery = ref("");
  const menuActive = ref(false);

  const allIcons = computed<Icon[]>(() => {
    return iconGroups.value.flatMap((group) => group.icons);
  });

  const filteredGroups = computed<IconGroup[]>(() => {
    if (!searchQuery.value) {
      return iconGroups.value;
    }

    const query = searchQuery.value.toLowerCase();
    const filtered = iconGroups.value
      .map((group) => ({
        name: group.name,
        icons: group.icons.filter(
          (icon) =>
            icon.label.toLowerCase().includes(query) ||
            icon.value.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.icons.length > 0);

    return filtered;
  });

  const selectedIcon = computed(() => {
    if (!props.value) return null;
    return allIcons.value.find((icon) => icon.value === props.value);
  });

  onMounted(async () => {
    await fetchIcons();
  });

  async function fetchIcons() {
    try {
      loading.value = true;
      error.value = "";

      const response = await api.get("/custom-svg-icons");

      if (response.data.error) {
        error.value = response.data.error;
      } else {
        iconGroups.value = response.data.iconGroups || [];
      }
    } catch (err: any) {
      console.error("Failed to fetch icons:", err);
      error.value = "Failed to load icons. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  function onClickInput(e: MouseEvent, toggle: () => void) {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT") {
      toggle();
    }
  }

  function onKeydownInput(e: KeyboardEvent, activate: () => void) {
    const systemKeys =
      e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.key === "Tab";
    const target = e.target as HTMLElement;

    if (!e.repeat && !systemKeys && target.tagName === "INPUT") {
      activate();
    }
  }

  function selectIcon(iconValue: string | null) {
    searchQuery.value = "";
    emit("input", iconValue);
  }

  function getTooltipText(item: Icon) {
    return `${item.label} (${item.value})`;
  }
</script>

<style scoped>
  .custom-icon-select {
    width: 100%;
  }

  .notice-loading :deep(.v-notice-content) {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .empty-state {
    margin-top: 12px;
  }

  .dropdown-wrapper {
    width: 100%;
  }

  .v-input.has-value {
    --v-input-placeholder-color: var(--theme--primary);
  }

  .v-input.has-value:focus-within {
    --v-input-placeholder-color: var(
      --theme--form--field--input--foreground-subdued
    );
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .selected-icon-preview {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .selected-icon-preview :deep(svg) {
    max-width: 100%;
    max-height: 100%;
  }

  .open-indicator {
    transform: scaleY(1);
    transition: transform var(--fast) var(--transition);
  }

  .open-indicator.open {
    transform: scaleY(-1);
  }

  .content {
    padding: 12px;
    background-color: var(--theme--background);
    min-width: 320px;
    max-width: 480px;
  }

  .group-header {
    --v-divider-label-color: var(--theme--foreground-subdued);
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .group-header:first-child {
    margin-top: 0;
  }

  .icons-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(auto-fill, 32px);
    justify-content: start;
    color: var(--theme--form--field--input--foreground-subdued);
  }

  .icon-button {
    --v-button-background-color: transparent;
    --v-button-background-color-hover: var(--theme--background-subdued);
    color: var(--theme--form--field--input--foreground-subdued);
  }

  .icon-button :deep(.button) {
    --v-button-height: 32px;
    --v-button-min-width: 32px;
    padding: 0;
  }

  .icon-button:hover {
    --v-button-color: var(--theme--form--field--input--foreground);
    --v-button-background-color-hover: var(--theme--background-subdued);
  }

  .icon-button.active {
    --v-button-color: var(--theme--primary);
    --v-button-background-color: var(--theme--primary-background);
  }

  .icon-content {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .icon-content :deep(svg) {
    max-width: 100%;
    max-height: 100%;
  }

  .no-results {
    grid-column: 1 / -1;
    padding: 24px;
    text-align: center;
    color: var(--theme--foreground-subdued);
  }
</style>
