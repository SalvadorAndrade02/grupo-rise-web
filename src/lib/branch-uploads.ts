import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

type BranchImageFolder = "logos" | "fachadas";

const MAX_BRANCH_IMAGE_SIZE = 6 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function getImageExtension(file: File) {
  const extensionFromType = allowedTypes[file.type];

  if (extensionFromType) {
    return extensionFromType;
  }

  const extensionFromName = path.extname(file.name).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(extensionFromName)) {
    return extensionFromName === ".jpeg" ? ".jpg" : extensionFromName;
  }

  return "";
}

export async function saveBranchImageFile(
  value: FormDataEntryValue | null,
  folder: BranchImageFolder
) {
  if (!isFile(value)) {
    return null;
  }

  const extension = getImageExtension(value);

  if (!extension) {
    throw new Error("Formato no permitido. Usa JPG, PNG, WEBP o AVIF.");
  }

  if (value.size > MAX_BRANCH_IMAGE_SIZE) {
    throw new Error("La imagen no debe pesar más de 6 MB.");
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "branches",
    folder
  );

  await mkdir(uploadDir, {
    recursive: true,
  });

  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await value.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/branches/${folder}/${fileName}`;
}

export async function deleteBranchImageFile(url?: string | null) {
  if (!url?.startsWith("/uploads/branches/")) {
    return;
  }

  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.join(publicDir, url.replace(/^\/+/, ""));
  const allowedDir = path.join(publicDir, "uploads", "branches");

  if (!filePath.startsWith(allowedDir)) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // Si el archivo ya no existe, no detenemos el flujo.
  }
}