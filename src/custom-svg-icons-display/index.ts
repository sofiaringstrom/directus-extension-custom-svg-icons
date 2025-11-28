import { defineDisplay } from "@directus/extensions-sdk";
import DisplayComponent from "./display.vue";

export default defineDisplay({
  id: "custom-svg-icon-display",
  name: "Custom SVG Icon",
  icon: "insert_emoticon",
  description: "Display custom SVG icons",
  component: DisplayComponent,
  options: [
    {
      field: "backgroundColor",
      name: "Background Color",
      type: "string",
      schema: {
        default_value: null,
      },
      meta: {
        interface: "select-color",
        width: "half",
      },
    },
    {
      field: "borderColor",
      name: "Border Color",
      type: "string",
      schema: {
        default_value: null,
      },
      meta: {
        interface: "select-color",
        width: "half",
      },
    },
    {
      field: "padding",
      name: "Padding",
      type: "string",
      meta: {
        interface: "input",
        width: "half",
        note: "Eg. 4px",
      },
    },
  ],
  types: ["string"],
});
