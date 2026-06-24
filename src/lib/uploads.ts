import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type SavedVehicleMedia = {
  url: string;
  type: "IMAGE" | "VIDEO";
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "vehicles");

const allowedMimeTypes: Record<string, { extension: string; type: "IMAGE" | "VIDEO" }> = {
  "image/jpeg": {
    extension: ".jpg",
    type: "IMAGE",
  },
  "image/png": {
    extension: ".png",
    type: "IMAGE",
  },
  "image/webp": {
    extension: ".webp",
    type: "IMAGE",
  },
  "image/avif": {
    extension: ".avif",
    type: "IMAGE",
  },
  "video/mp4": {
    extension: ".mp4",
    type: "VIDEO",
  },
  "video/webm": {
    extension: ".webm",
    type: "VIDEO",
  },
  "video/quicktime": {
    extension: ".mov",
    type: "VIDEO",
  },
};

function validateFile(file: File) {
  const config = allowedMimeTypes[file.type];

  if (!config) {
    throw new Error(`Archivo no permitido: ${file.name}`);
  }

  const maxImageSize = 8 * 1024 * 1024;
  const maxVideoSize = 80 * 1024 * 1024;

  if (config.type === "IMAGE" && file.size > maxImageSize) {
    throw new Error(`La imagen ${file.name} supera el límite de 8 MB.`);
  }

  if (config.type === "VIDEO" && file.size > maxVideoSize) {
    throw new Error(`El video ${file.name} supera el límite de 80 MB.`);
  }

  return config;
}

export async function saveVehicleMediaFiles(
  files: File[]
): Promise<SavedVehicleMedia[]> {
  if (files.length > 10) {
    throw new Error("Solo puedes subir máximo 10 archivos por vehículo.");
  }

  await mkdir(UPLOAD_DIR, {
    recursive: true,
  });

  const savedFiles: SavedVehicleMedia[] = [];

  for (const file of files) {
    if (!file || file.size === 0) {
      continue;
    }

    const config = validateFile(file);
    const fileName = `${randomUUID()}${config.extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    savedFiles.push({
      url: `/uploads/vehicles/${fileName}`,
      type: config.type,
    });
  }

  return savedFiles;
}