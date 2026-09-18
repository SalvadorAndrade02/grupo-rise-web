import { randomUUID } from "crypto";
import {
    mkdir,
    unlink,
    writeFile,
} from "fs/promises";
import path from "path";

const MAX_IMAGE_SIZE =
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
    const byType =
        allowedImageTypes[file.type];

    if (byType) {
        return byType;
    }

    const extension = path
        .extname(file.name)
        .toLowerCase();

    const allowed = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".avif",
    ];

    if (!allowed.includes(extension)) {
        return "";
    }

    return extension === ".jpeg"
        ? ".jpg"
        : extension;
}

export async function saveExperienceImage(
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

    if (value.size > MAX_IMAGE_SIZE) {
        throw new Error(
            "La imagen no debe pesar más de 6 MB."
        );
    }

    const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "experiences"
    );

    await mkdir(uploadDirectory, {
        recursive: true,
    });

    const fileName =
        `${Date.now()}-${randomUUID()}${extension}`;

    const filePath = path.join(
        uploadDirectory,
        fileName
    );

    const buffer = Buffer.from(
        await value.arrayBuffer()
    );

    await writeFile(
        filePath,
        buffer
    );

    return `/uploads/experiences/${fileName}`;
}

export async function deleteExperienceImage(
    fileUrl?: string | null
) {
    if (
        !fileUrl?.startsWith(
            "/uploads/experiences/"
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
        "experiences"
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
        // No detenemos el proceso si el archivo ya no existe.
    }
}