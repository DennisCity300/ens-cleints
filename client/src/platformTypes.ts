export interface PlatformTypeDef {
  value: string;
  label: string;
  glyph: string;
}

export const PLATFORM_TYPES: PlatformTypeDef[] = [
  { value: "cpanel", label: "cPanel", glyph: "cP" },
  { value: "wordpress", label: "WordPress", glyph: "W" },
  { value: "webmail", label: "Webmail", glyph: "@" },
  { value: "hosting", label: "Hosting", glyph: "H" },
  { value: "domain", label: "Domain Registrar", glyph: "D" },
  { value: "email", label: "Email", glyph: "M" },
  { value: "ftp", label: "FTP", glyph: "F" },
  { value: "database", label: "Database", glyph: "DB" },
  { value: "social", label: "Social Media", glyph: "S" },
  { value: "other", label: "Other", glyph: "•" },
];

export function platformTypeLabel(value: string): string {
  return PLATFORM_TYPES.find((t) => t.value === value)?.label || "Other";
}

export function platformTypeGlyph(value: string): string {
  return PLATFORM_TYPES.find((t) => t.value === value)?.glyph || "•";
}
