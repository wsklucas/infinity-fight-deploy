-- CreateTable
CREATE TABLE "intake_assessments" (
    "id" TEXT NOT NULL,
    "academy_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "result_sublevel" TEXT NOT NULL,
    "triage_data" JSONB NOT NULL,
    "block_results" JSONB NOT NULL,
    "focus_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_assessments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "intake_assessments" ADD CONSTRAINT "intake_assessments_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_assessments" ADD CONSTRAINT "intake_assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_assessments" ADD CONSTRAINT "intake_assessments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
