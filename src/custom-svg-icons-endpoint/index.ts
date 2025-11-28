import { defineEndpoint } from "@directus/extensions-sdk";
import { Readable } from "stream";

// Helper function to convert string to kebab-case
function toKebabCase(str: string): string {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase to kebab-case
    .replace(/[\s_]+/g, "-") // spaces and underscores to hyphens
    .replace(/[^\w-]/g, "") // remove non-word chars except hyphens
    .toLowerCase();
}

export default defineEndpoint({
  id: "custom-svg-icons",
  handler: (router, { services, getSchema }) => {
    router.get("/", async (req: any, res) => {
      try {
        const schema = await getSchema();
        const { ItemsService, AssetsService } = services;

        // Get the Icon Config folder
        const foldersService = new ItemsService("directus_folders", {
          schema,
          accountability: req.accountability,
        });

        const folders = await foldersService.readByQuery({
          filter: {
            name: { _eq: "Custom SVG Icons" },
          },
          limit: 1,
        });

        if (!folders || folders.length === 0) {
          return res.json({
            icons: {},
            error:
              'Custom SVG Icons folder not found. Please create a folder named "Custom SVG Icons" and upload SVG files.',
          });
        }

        const folderId = folders[0]?.id;
        if (!folderId) {
          return res.json({
            icons: {},
            error: "Custom SVG Icons folder ID not found.",
          });
        }

        // Get all subfolders within the Icon Config folder
        const subfolders = await foldersService.readByQuery({
          filter: {
            parent: { _eq: folderId },
          },
          fields: ["id", "name"],
          limit: -1,
        });

        // Get all SVG files from the main folder and subfolders
        const filesService = new ItemsService("directus_files", {
          schema,
          accountability: req.accountability,
        });

        const assetsService = new AssetsService({
          schema,
          accountability: req.accountability,
        });

        // Structure to hold grouped icons
        const iconGroups: Array<{ name: string; icons: any[] }> = [];

        // Helper function to fetch SVG content
        async function fetchSvgContent(file: any) {
          try {
            const result = await assetsService.getAsset(file.id);

            let streamData: any;
            if (typeof result.stream === "function") {
              streamData = await (result.stream as any)();
            } else {
              streamData = result.stream;
            }

            const chunks: Buffer[] = [];
            for await (const chunk of streamData) {
              chunks.push(Buffer.from(chunk));
            }
            return Buffer.concat(chunks).toString("utf-8");
          } catch (error) {
            console.error(
              `Error reading SVG file ${file.filename_download}:`,
              error
            );
            return null;
          }
        }

        // Process files in root folder (ungrouped)
        const rootFiles = await filesService.readByQuery({
          filter: {
            folder: { _eq: folderId },
            type: { _eq: "image/svg+xml" },
          },
          fields: ["id", "filename_download", "title", "description"],
          limit: -1,
        });

        if (rootFiles && rootFiles.length > 0) {
          // Fetch all SVGs in parallel
          const rootIconsPromises = rootFiles.map(async (file) => {
            const svgContent = await fetchSvgContent(file);
            if (!svgContent) return null;

            const key = file.filename_download.replace(".svg", "");
            const label = file.title || key;
            const value =
              file.description || (file.title ? toKebabCase(file.title) : key);

            return {
              key,
              label,
              value,
              svg: svgContent,
              fileId: file.id,
            };
          });

          const rootIcons = (await Promise.all(rootIconsPromises)).filter(
            (icon): icon is Exclude<typeof icon, null> => icon !== null
          );

          if (rootIcons.length > 0) {
            // Sort icons alphabetically by label
            rootIcons.sort((a, b) => a.label.localeCompare(b.label));

            iconGroups.push({
              name: "Icons",
              icons: rootIcons,
            });
          }
        }

        // Process files in subfolders (in parallel)
        if (subfolders && subfolders.length > 0) {
          const subfolderGroupsPromises = subfolders.map(async (subfolder) => {
            const subfolderFiles = await filesService.readByQuery({
              filter: {
                folder: { _eq: subfolder.id },
                type: { _eq: "image/svg+xml" },
              },
              fields: ["id", "filename_download", "title", "description"],
              limit: -1,
            });

            if (!subfolderFiles || subfolderFiles.length === 0) return null;

            // Fetch all SVGs in parallel
            const subfolderIconsPromises = subfolderFiles.map(async (file) => {
              const svgContent = await fetchSvgContent(file);
              if (!svgContent) return null;

              const key = file.filename_download.replace(".svg", "");
              const label = file.title || key;
              const value =
                file.description ||
                (file.title ? toKebabCase(file.title) : key);

              return {
                key,
                label,
                value,
                svg: svgContent,
                fileId: file.id,
              };
            });

            const subfolderIcons = (
              await Promise.all(subfolderIconsPromises)
            ).filter(
              (icon): icon is Exclude<typeof icon, null> => icon !== null
            );

            if (subfolderIcons.length === 0) return null;

            // Sort icons alphabetically by label
            subfolderIcons.sort((a, b) => a.label.localeCompare(b.label));

            return {
              name: subfolder.name,
              icons: subfolderIcons,
            };
          });

          const subfolderGroups = (
            await Promise.all(subfolderGroupsPromises)
          ).filter(
            (group): group is { name: string; icons: any[] } => group !== null
          );

          // Sort groups alphabetically by name
          subfolderGroups.sort((a, b) => a.name.localeCompare(b.name));

          iconGroups.push(...subfolderGroups);
        }

        if (iconGroups.length === 0) {
          return res.json({
            iconGroups: [],
            error: "No SVG files found in Custom SVG Icons folder.",
          });
        }

        return res.json({ iconGroups });
      } catch (error: any) {
        console.error("Error fetching custom icons:", error);
        return res.status(500).json({
          error: "Failed to fetch icons",
          details: error?.message,
        });
      }
    });

    // New endpoint to fetch specific icons by value(s)
    router.get("/by-value", async (req: any, res) => {
      try {
        const values = req.query.values;

        if (!values) {
          return res.status(400).json({
            error: "Missing 'values' query parameter",
          });
        }

        const valueArray = Array.isArray(values)
          ? values
          : values.split(",").map((v: string) => v.trim());

        const schema = await getSchema();
        const { ItemsService, AssetsService } = services;

        const foldersService = new ItemsService("directus_folders", {
          schema,
          accountability: req.accountability,
        });

        const rootFolder = await foldersService.readByQuery({
          filter: { name: { _eq: "Custom SVG Icons" } },
          limit: 1,
        });

        if (!rootFolder || rootFolder.length === 0) {
          return res.json({ icons: {} });
        }

        const rootFolderId = rootFolder[0]?.id;

        const fetchSvgContent = async (file: any) => {
          try {
            const assetsService = new AssetsService({
              schema,
              accountability: req.accountability,
            });
            const result = await assetsService.getAsset(file.id);
            let streamData: Readable;
            if (typeof result.stream === "function") {
              streamData = await (result.stream as any)();
            } else {
              streamData = result.stream;
            }
            const chunks: Buffer[] = [];
            for await (const chunk of streamData) {
              chunks.push(Buffer.from(chunk));
            }
            return Buffer.concat(chunks).toString("utf-8");
          } catch (error) {
            console.error(
              `Error reading SVG file ${file.filename_download}:`,
              error
            );
            return null;
          }
        };

        const filesService = new ItemsService("directus_files", {
          schema,
          accountability: req.accountability,
        });

        // Fetch subfolders to search in all folders
        const subfolders = await foldersService.readByQuery({
          filter: {
            parent: { _eq: rootFolderId },
          },
          fields: ["id"],
          limit: -1,
        });

        const folderIds = [
          rootFolderId,
          ...(subfolders || []).map((sf: any) => sf.id),
        ];

        // Fetch all files from root and subfolders
        const allFiles = await filesService.readByQuery({
          filter: {
            folder: { _in: folderIds },
            type: { _eq: "image/svg+xml" },
          },
          fields: ["id", "filename_download", "title", "description"],
          limit: -1,
        });

        const icons: Record<string, any> = {};

        if (allFiles && allFiles.length > 0) {
          // Process files and match against requested values
          const filePromises = allFiles.map(async (file: any) => {
            const key = file.filename_download.replace(".svg", "");
            const label = file.title || key;
            const value =
              file.description || (file.title ? toKebabCase(file.title) : key);

            // Only fetch SVG content if this value is requested
            if (valueArray.includes(value)) {
              const svgContent = await fetchSvgContent(file);
              if (svgContent) {
                icons[value] = {
                  key,
                  label,
                  value,
                  svg: svgContent,
                  fileId: file.id,
                };
              }
            }
          });

          await Promise.all(filePromises);
        }

        return res.json({ icons });
      } catch (error: any) {
        console.error("Error fetching icons by value:", error);
        return res.status(500).json({
          error: "Failed to fetch icons",
          details: error?.message,
        });
      }
    });
  },
});
