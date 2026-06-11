-- CreateEnum
CREATE TYPE "FichaCategory" AS ENUM ('TECNICA', 'DRILL_FIXACAO', 'JOGO_TATICO');

-- CreateTable
CREATE TABLE "ficha_items" (
    "id" TEXT NOT NULL,
    "academy_id" TEXT NOT NULL,
    "sublevel_id" TEXT NOT NULL,
    "category" "FichaCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ficha_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ficha_items" ADD CONSTRAINT "ficha_items_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ficha_items" ADD CONSTRAINT "ficha_items_sublevel_id_fkey" FOREIGN KEY ("sublevel_id") REFERENCES "sublevels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
