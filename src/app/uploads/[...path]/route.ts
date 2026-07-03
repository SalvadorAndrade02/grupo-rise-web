import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

type UploadRouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  };

  return contentTypes[extension] ?? "application/octet-stream";
}

export async function GET(_request: Request, { params }: UploadRouteProps) {
  const { path: fileParts } = await params;

  if (!fileParts?.length) {
    return new Response("Archivo no encontrado", {
      status: 404,
    });
  }

  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const requestedPath = fileParts.join("/");
  const normalizedPath = path.normalize(requestedPath);

  if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
    return new Response("Ruta no permitida", {
      status: 403,
    });
  }

  const filePath = path.join(uploadRoot, normalizedPath);

  if (!filePath.startsWith(uploadRoot)) {
    return new Response("Ruta no permitida", {
      status: 403,
    });
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return new Response("Archivo no encontrado", {
        status: 404,
      });
    }

    const file = await readFile(filePath);

    return new Response(file, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Archivo no encontrado", {
      status: 404,
    });
  }
}