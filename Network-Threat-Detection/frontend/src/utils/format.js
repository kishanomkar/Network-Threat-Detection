export const parseFeatureValue = (value) => {
  const trimmed = String(value).trim();

  if (trimmed === "") return "";
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;

  const numericValue = Number(trimmed);
  if (!Number.isNaN(numericValue) && trimmed !== "") {
    return numericValue;
  }

  return trimmed;
};

export const formatTimestamp = (date = new Date()) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

export const downloadJson = (fileName, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

