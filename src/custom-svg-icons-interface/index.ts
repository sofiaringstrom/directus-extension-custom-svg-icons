import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
  id: "custom-svg-icon-select",
  name: "Custom SVG Icon",
  icon: "insert_emoticon",
  description:
    "Select an icon from custom SVG files uploaded to the Custom SVG Icons folder",
  component: InterfaceComponent,
  options: [],
  types: ["string"],
  group: "selection",
});
