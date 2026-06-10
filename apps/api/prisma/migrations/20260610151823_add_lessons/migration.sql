-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('INDIVIDUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED');

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "academy_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonType" NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "status" "LessonStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_students" (
    "lesson_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "lesson_students_pkey" PRIMARY KEY ("lesson_id","student_id")
);

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_students" ADD CONSTRAINT "lesson_students_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_students" ADD CONSTRAINT "lesson_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
