# Directus Custom SVG Icons Extension

A Directus extension bundle that provides a complete icon management solution with an interface for selecting custom SVG icons, a display for rendering them, and an endpoint for serving icon data from a centralized folder.

<img src="https://raw.githubusercontent.com/sofiaringstrom/directus-extension-custom-svg-icons/refs/heads/main/docs/interface-2.png" width="500px" height="auto" style="border: 1px solid #d4d4d8; border-radius: 12px;">

## Features

- 📁 **Centralized Icon Management** - Upload all SVG files once to a dedicated folder
- 📂 **Subfolder Grouping** - Organize icons into subfolders with labeled group headers
- 🔍 **Searchable Interface** - Search box to quickly filter through your icons
- 🎨 **Icon-Focused Display** - Visual grid showing icons
- 💬 **Hover Tooltips** - See icon name on hover
- 🔄 **Custom Return Values** - Each icon can return a custom string value
- 👁️ **Visual Display Component** - Renders icons in collection views
- 🔒 **Permissions Aware** - Respects Directus user permissions

## Installation

Install the extension from the Directus Marketplace. See the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for more information.

Or if you prefer to install manually:

```bash
npm install directus-extension-flat-tabs-interface
```

## Usage

### Step 1: Create the Custom SVG Icons Folder

1. Go to **Files** in your Directus admin panel
2. Create a new folder named exactly **"Custom SVG Icons"** (case-sensitive)
3. This is where all your SVG icons will be stored

<img src="https://raw.githubusercontent.com/sofiaringstrom/directus-extension-custom-svg-icons/refs/heads/main/docs/file-library.png" width="100%" height="auto" style="border: 1px solid #d4d4d8; border-radius: 12px;">

### Step 2: Upload SVG Files

1. Open the **Custom SVG Icons** folder
2. Upload your SVG icon files directly, or organize them into subfolders
3. For each SVG file, configure:
   - **Title**: Display name in the picker (e.g., "Home Icon")
   - **Description** (optional): The custom return value (e.g., "custom-home-icon", "icon-user", etc.)

**How the return value is determined:**

1. If **Description** is provided → uses the description value
2. If **Description** is empty but **Title** exists → converts title to kebab-case (e.g., "Home Icon" → "home-icon")
3. If both are empty → uses the filename without extension

**Organizing Icons:**

- Icons in the root "Custom SVG Icons" folder will appear under a default "Icons" group (always shown first)
- Create subfolders within "Custom SVG Icons" to organize icons into groups
- Each subfolder becomes a labeled group in the picker (e.g., "Social", "UI", "Brands")
- Groups are displayed with headers, just like the native Directus icon picker
- **Icons are automatically sorted alphabetically by label** within each group
- **Groups are automatically sorted alphabetically by name** (except "Icons" which is always first)

### Step 3: Add Field to Collection

1. Go to **Settings** → **Data Model**
2. Select the collection where you want to use icon selection
3. Create a new field:
   - **Type**: String
   - **Interface**: Select **"Custom SVG Icon"**
   - **Display**: Select **"Custom SVG Icon"** (optional, for displaying the icon visually)
   - **Save** the field

<img src="https://raw.githubusercontent.com/sofiaringstrom/directus-extension-custom-svg-icons/refs/heads/main/docs/interface.png" width="70%" height="auto" style="border: 1px solid #d4d4d8; border-radius: 12px;">

<img src="https://raw.githubusercontent.com/sofiaringstrom/directus-extension-custom-svg-icons/refs/heads/main/docs/display.png" width="70%" height="auto" style="border: 1px solid #d4d4d8; border-radius: 12px;">

### Step 4: Use the Interface

1. Create or edit an item in your collection
2. Click on the icon field to open the dropdown
3. Use the search box to filter icons by name or value
4. Browse the icon grid (hover to see name and value in tooltip)
5. Click an icon to select it
6. The custom return value (from Description) will be saved

### Step 5: Display the Icon

When viewing items in your collection, the Display component will automatically:

1. Fetch the correct SVG based on the stored value
2. Render the icon visually (24×24px)
3. Apply background, border, and padding if configured
4. Show a fallback text if the icon is not found

### Return Value Priority

1. **File Description** - Primary source for return value
2. **File Title** (converted to kebab-case) - Fallback if description is empty
3. **Filename** (without .svg) - Final fallback if both are empty

**Examples:**

- Title: "Home Icon", Description: "custom-home" → Returns: `"custom-home"`
- Title: "User Profile", Description: empty → Returns: `"user-profile"`
- Title: empty, Description: empty, Filename: "settings.svg" → Returns: `"settings"`

## Example Setup

Let's say you want to use icons for a "features" collection:

1. **Create folder structure:**

   ```
   Custom SVG Icons/
   ├── home.svg          (ungrouped)
   ├── UI/
   │   ├── menu.svg
   │   └── search.svg
   └── Social/
       ├── facebook.svg
       └── twitter.svg
   ```

2. **Configure each icon:**

   - `home.svg` → Title: "Home", Description: "icon-home"
   - `menu.svg` → Title: "Menu" (description empty, will become "menu")
   - `search.svg` → Title: "Search Icon" (description empty, will become "search-icon")
   - `facebook.svg` → Title: "Facebook", Description: "social-facebook"
   - `twitter.svg` → Title: "Twitter", Description: "social-twitter"

3. **Create a field in "features" collection:**

   - Field name: `icon`
   - Type: String
   - Interface: Custom SVG Icon

4. **When creating a feature:**

   - Click the icon field to open the dropdown
   - See groups with headers: "Icons", "UI", "Social"
   - Type to search across all groups
   - Hover over icons to see their names
   - Click an icon to select it
   - Database stores the Description value (e.g., `"icon-facebook"`)

5. **In your frontend:**

```javascript
// features item has: { icon: "icon-home" }
// Use this to map to your frontend icon library
```

## Troubleshooting

### Icons not showing up

1. **Check folder name**: Must be exactly "Custom SVG Icons" (case-sensitive)
2. **Check file type**: Only `.svg` files with MIME type `image/svg+xml`
3. **Check permissions**: Ensure your user role has read access to the Files collection

### Error: "Custom SVG Icons folder not found"

Create a folder in Files named exactly "Custom SVG Icons".

### SVG not displaying correctly

Ensure your SVG files:

- Are valid SVG format
- Don't have external dependencies
- Use relative sizing (width/height will be overridden by CSS)

## API Reference

### GET `/custom-svg-icons`

Returns all available icons from the Custom SVG Icons folder, organized by groups. No caching - always returns fresh data.

**Used by:** Interface (icon picker)

**Sorting:**

- Icons within each group are sorted alphabetically by label
- Groups are sorted alphabetically by name (except "Icons" which is always first)

**Response:**

```json
{
  "iconGroups": [
    {
      "name": "Icons",
      "icons": [
        {
          "key": "home",
          "label": "Home Icon",
          "value": "icon-home",
          "svg": "<svg>...</svg>",
          "fileId": "uuid-here"
        }
      ]
    },
    {
      "name": "Social",
      "icons": [
        {
          "key": "facebook",
          "label": "Facebook",
          "value": "icon-facebook",
          "svg": "<svg>...</svg>",
          "fileId": "uuid-here"
        }
      ]
    }
  ]
}
```

### GET `/custom-svg-icons/by-value`

Returns specific icons by their value(s). Much more efficient than fetching all icons when you only need one or a few.

**Used by:** Display component

**Query Parameters:**

- `values` (string, required): Comma-separated list of icon values to fetch (e.g., `?values=icon-home,icon-user`)

**Response:**

```json
{
  "icons": {
    "icon-home": {
      "key": "home",
      "label": "Home Icon",
      "value": "icon-home",
      "svg": "<svg>...</svg>",
      "fileId": "uuid-here"
    },
    "icon-user": {
      "key": "user",
      "label": "User Profile",
      "value": "icon-user",
      "svg": "<svg>...</svg>",
      "fileId": "uuid-here"
    }
  }
}
```

**Examples:**

```bash
# Fetch a single icon
GET /custom-svg-icons/by-value?values=icon-home

# Fetch multiple icons
GET /custom-svg-icons/by-value?values=icon-home,icon-user,icon-settings
```

## Display Options

The display component offers visual customization options for how icons appear in collection views:

### Background Color

Select a custom background color for the icon.

### Border Color

Select a custom border color for the icon.

### Padding

Add custom padding around the icon:

- Accepts any valid CSS padding value (e.g., "4px", "8px", "0.5rem")
- Applied when background or border is set
- Leave empty to use default padding

**Display Behavior:**

- If an icon is not found, the raw value is displayed as text
- Icons automatically reload when the value changes
- Background, border, and padding can be combined for complete customization

## Future Features

- [ ] Cached response with refresh on icon change
