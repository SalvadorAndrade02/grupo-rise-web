import { randomUUID } from "crypto";
import {
    mkdir,
    readFile,
    unlink,
    writeFile,
} from "fs/promises";
import path from "path";

const CV_STORAGE_DIR = path.join(
    process.cwd(),
    "storage",
    "job-applications"
);

const MAX_CV_SIZE = 5 * 1024 * 1024;

export type SavedJobApplicationCv = {
    storedName: string;
    originalName: string;
    mimeType: string;
    size: number;
};

function cleanOriginalName(value: string) {
    const baseName = path.basename(value);

    return (
        baseName
            .replace(/[^\p{L}\p{N}._ -]/gu, "")
            .trim()
            .slice(0, 150) || "curriculum.pdf"
    );
}

function isPdfBuffer(buffer: Buffer) {
    return (
        buffer.length >= 5 &&
        buffer.subarray(0, 5).toString("ascii") ===
        "%PDF-"
    );
}

function validateStoredName(storedName: string) {
    return /^[0-9a-f-]{36}\.pdf$/i.test(
        storedName
    );
}

export async function saveJobApplicationCv(
    file: File
): Promise<SavedJobApplicationCv> {
    if (!file || file.size === 0) {
        throw new Error(
            "Debes seleccionar un currículum."
        );
    }

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {
        throw new Error(
            "El currículum debe estar en formato PDF."
        );
    }

    if (file.size > MAX_CV_SIZE) {
        throw new Error(
            "El currículum supera el límite de 5 MB."
        );
    }

    const buffer = Buffer.from(
        await file.arrayBuffer()
    );

    if (!isPdfBuffer(buffer)) {
        throw new Error(
            "El archivo seleccionado no es un PDF válido."
        );
    }

    await mkdir(CV_STORAGE_DIR, {
        recursive: true,
    });

    const storedName = `${randomUUID()}.pdf`;
    const filePath = path.join(
        CV_STORAGE_DIR,
        storedName
    );

    await writeFile(filePath, buffer, {
        flag: "wx",
    });

    return {
        storedName,
        originalName: cleanOriginalName(
            file.name
        ),
        mimeType: "application/pdf",
        size: file.size,
    };
}

export async function readJobApplicationCv(
    storedName: string
) {
    if (!validateStoredName(storedName)) {
        throw new Error(
            "Nombre de archivo inválido."
        );
    }

    return readFile(
        path.join(CV_STORAGE_DIR, storedName)
    );
}

export async function deleteJobApplicationCv(
    storedName?: string | null
) {
    if (
        !storedName ||
        !validateStoredName(storedName)
    ) {
        return;
    }

    try {
        await unlink(
            path.join(
                CV_STORAGE_DIR,
                storedName
            )
        );
    } catch {
        // No detenemos el proceso si ya no existe.
    }
}