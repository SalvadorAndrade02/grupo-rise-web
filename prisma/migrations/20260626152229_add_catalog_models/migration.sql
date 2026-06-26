-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brandId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CatalogCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brandId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL DEFAULT 'TODOTERRENO',
    "year" INTEGER,
    "priceFrom" INTEGER,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "specs" TEXT NOT NULL DEFAULT '',
    "features" TEXT NOT NULL DEFAULT '',
    "mainImage" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogModel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "catalogModelId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogImage_catalogModelId_fkey" FOREIGN KEY ("catalogModelId") REFERENCES "CatalogModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCategory_brandId_slug_key" ON "CatalogCategory"("brandId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogModel_brandId_slug_key" ON "CatalogModel"("brandId", "slug");
