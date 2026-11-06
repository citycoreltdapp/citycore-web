const UNITS = ["KB", "MB", "GB", "TB"];

/** 120000 → "117 KB", 1572864 → "1.5 MB". Zero reads "0 KB" so a starting upload lines up with its total. */
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;

  let size = bytes / 1024;
  let unit = 0;
  while (Math.round(size) >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit++;
  }

  // Whole KB are precise enough; larger units need a decimal to show progress.
  return `${unit === 0 ? Math.round(size) : Number(size.toFixed(1))} ${UNITS[unit]}`;
};

/** "report.final.pdf" → "PDF". Files with no extension read "FILE". */
export const fileExtensionLabel = (name: string) => {
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot + 1) : "";
  return extension ? extension.slice(0, 4).toUpperCase() : "FILE";
};
