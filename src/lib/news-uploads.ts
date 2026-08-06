import { randomUUID } from "crypto";
import {
    mkdir,
    unlink,
    writeFile,
} from "fs/promises";
import path from "path";

const MAX_NEWS_IMAGE_SIZE =
    6 * 1024 * 1024;

const allowedImageTypes: Record<
    string,
    string
> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
};

function isFile(
    value: FormDataEntryValue | null
): value is File {
    return (
        value instanceof File &&
        value.size > 0
    );
}

function getImageExtension(file: File) {
    const extensionFromType =
        allowedImageTypes[file.type];

    if (extensionFromType) {
        return extensionFromType;
    }

    const extensionFromName = path
        .extname(file.name)
        .toLowerCase();

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".avif",
    ];

    if (
        allowedExtensions.includes(
            extensionFromName
        )
    ) {
        return extensionFromName === ".jpeg"
            ? ".jpg"
            : extensionFromName;
    }

    return "";
}

export async function saveNewsCoverFile(
    value: FormDataEntryValue | null
) {
    if (!isFile(value)) {
        return null;
    }

    const extension =
        getImageExtension(value);

    if (!extension) {
        throw new Error(
            "Formato no permitido. Utiliza JPG, PNG, WEBP o AVIF."
        );
    }

    if (
        value.size >
        MAX_NEWS_IMAGE_SIZE
    ) {
        throw new Error(
            "La imagen no debe pesar más de 6 MB."
        );
    }

    const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "news",
        "covers"
    );

    await mkdir(uploadDirectory, {
        recursive: true,
    });

    const fileName = `${Date.now()}-${randomUUID()}${extension}`;

    const filePath = path.join(
        uploadDirectory,
        fileName
    );

    const buffer = Buffer.from(
        await value.arrayBuffer()
    );

    await writeFile(filePath, buffer);

    return `/uploads/news/covers/${fileName}`;
}

export async function deleteNewsCoverFile(
    fileUrl?: string | null
) {
    if (
        !fileUrl?.startsWith(
            "/uploads/news/"
        )
    ) {
        return;
    }

    const publicDirectory = path.join(
        process.cwd(),
        "public"
    );

    const filePath = path.join(
        publicDirectory,
        fileUrl.replace(/^\/+/, "")
    );

    const allowedDirectory = path.join(
        publicDirectory,
        "uploads",
        "news"
    );

    if (
        !filePath.startsWith(
            allowedDirectory
        )
    ) {
        return;
    }

    try {
        await unlink(filePath);
    } catch {
        // El archivo puede no existir.
    }
}