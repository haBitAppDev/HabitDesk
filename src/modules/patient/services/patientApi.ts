import { FirebaseError } from "firebase/app";

import type {
  Program,
  ProgramAssignment,
} from "../../shared/types/domain";
import {
  getProgram,
  listAssignmentsByUser,
} from "../../therapist/services/therapistApi";

export interface PatientProgramRecord {
  assignment: ProgramAssignment;
  program: Program | null;
  restricted: boolean;
}

export async function listPatientPrograms(
  userId: string
): Promise<PatientProgramRecord[]> {
  if (!userId) return [];

  const assignments = await listAssignmentsByUser(userId);

  const results = await Promise.all(
    assignments.map(async (assignment) => {
      try {
        const program = await getProgram(assignment.programId);
        return {
          assignment,
          program,
          restricted: false,
        };
      } catch (error) {
        if (error instanceof FirebaseError && error.code === "permission-denied") {
          return {
            assignment,
            program: null,
            restricted: true,
          };
        }
        throw error;
      }
    })
  );

  return results;
}

