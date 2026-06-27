import { prisma } from "../src/lib/prisma";

const categories = [
    {
        name: "Recreación",
        slug: "recreacion",
        sortOrder: 1,
    },
    {
        name: "Touring",
        slug: "touring",
        sortOrder: 2,
    },
    {
        name: "Performance",
        slug: "performance",
        sortOrder: 3,
    },
    {
        name: "Tow Sports",
        slug: "tow-sports",
        sortOrder: 4,
    },
    {
        name: "Pesca deportiva",
        slug: "pesca-deportiva",
        sortOrder: 5,
    },
];

async function main() {
    let brand = await prisma.brand.findFirst({
        where: {
            OR: [
                { name: "Sea-Doo" },
                { name: "Sea Doo" },
                { name: "SeaDoo" },
            ],
        },
    });

    if (!brand) {
        brand = await prisma.brand.create({
            data: {
                name: "Sea-Doo",
                category: "MOTO",
                active: true,
            },
        });
    }

    if (brand.name !== "Sea-Doo") {
        brand = await prisma.brand.update({
            where: {
                id: brand.id,
            },
            data: {
                name: "Sea-Doo",
            },
        });
    }

    for (const category of categories) {
        await prisma.catalogCategory.upsert({
            where: {
                brandId_slug: {
                    brandId: brand.id,
                    slug: category.slug,
                },
            },
            update: {
                name: category.name,
                parentId: null,
                sortOrder: category.sortOrder,
                active: true,
            },
            create: {
                brandId: brand.id,
                name: category.name,
                slug: category.slug,
                parentId: null,
                sortOrder: category.sortOrder,
                active: true,
            },
        });
    }

    console.log("Marca y categorías de Sea-Doo creadas correctamente.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });