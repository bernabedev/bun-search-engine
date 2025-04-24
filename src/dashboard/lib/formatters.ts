export function formatBytes(bytes: number | undefined, decimals = 2): string {
  if (bytes === undefined || bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatSeconds(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 0) return "N/A";

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hr, " : " hrs, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " min, " : " mins, ") : "";
  const sDisplay = s + (s === 1 ? " sec" : " secs");

  // Simplify if uptime is short
  if (d === 0 && h === 0 && m === 0) return sDisplay;
  if (d === 0 && h === 0) return mDisplay + sDisplay;
  if (d === 0) return hDisplay + mDisplay + sDisplay;

  return dDisplay + hDisplay + mDisplay + sDisplay;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];

  if (days > 0) {
    parts.push(`${days} día${days !== 1 ? "s" : ""}`);
  }

  if (hours > 0 || days > 0) {
    parts.push(`${hours} hora${hours !== 1 ? "s" : ""}`);
  }

  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${minutes} minuto${minutes !== 1 ? "s" : ""}`);
  }

  parts.push(`${remainingSeconds} segundo${remainingSeconds !== 1 ? "s" : ""}`);

  return parts.join(", ");
}
