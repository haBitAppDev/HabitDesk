import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { useI18n } from "../../../i18n/I18nProvider";
import { useAuthState } from "../../shared/hooks/useAuthState";
import type {
  Patient,
  Program,
  ProgramAssignment,
} from "../../shared/types/domain";
import {
  assignProgramToUser,
  getPatient,
  listAssignmentsByUser,
  listPatientsByTherapist,
  listProgramsByOwner,
  removeProgramAssignment,
} from "../services/therapistApi";

type AssignmentMap = Record<string, ProgramAssignment[]>;

export function PatientManagement() {
  const { user } = useAuthState();
  const { t } = useI18n();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [assignPatientId, setAssignPatientId] = useState<string | null>(null);
  const [assignProgramId, setAssignProgramId] = useState<string>("");
  const [search, setSearch] = useState("");

  const heading = t("therapist.patients.heading", "Patient management");
  const subtitle = t(
    "therapist.patients.subtitle",
    "See your assigned patients, review their programmes and manage new assignments."
  );
  const loadingLabel = t("therapist.patients.loading", "Loading patient data…");
  const emptyPatientsLabel = t(
    "therapist.patients.empty",
    "No patients assigned yet."
  );
  const assignButtonLabel = t("therapist.patients.assign", "Assign program");
  const cancelAssignLabel = t("therapist.patients.cancel", "Cancel");
  const selectProgramPlaceholder = t(
    "therapist.patients.selectProgram",
    "Choose a program"
  );
  const noProgramsLabel = t(
    "therapist.patients.noPrograms",
    "Create a program first before assigning it."
  );
  const saveAssignmentLabel = t(
    "therapist.patients.saveAssignment",
    "Save assignment"
  );
  const removeAssignmentLabel = t(
    "therapist.patients.removeAssignment",
    "Remove"
  );
  const assignedProgramsHeading = t(
    "therapist.patients.assignedPrograms",
    "Assigned programs"
  );
  const noAssignmentsLabel = t(
    "therapist.patients.noAssignments",
    "No programs assigned yet."
  );
  const searchPlaceholder = t(
    "therapist.patients.search",
    "Search by patient name"
  );
  const successAssigned = t(
    "therapist.patients.feedback.assigned",
    "Program assigned successfully."
  );
  const successRemoved = t(
    "therapist.patients.feedback.removed",
    "Assignment removed."
  );
  const genericError = t(
    "therapist.patients.feedback.error",
    "Something went wrong. Please try again."
  );

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      listPatientsByTherapist(user.uid),
      listProgramsByOwner(user.uid),
    ])
      .then(async ([patientList, programList]) => {
        setPatients(patientList);
        setPrograms(programList);

        const assignmentEntries = await Promise.all(
          patientList.map(async (patient) => {
            const userAssignments = await listAssignmentsByUser(patient.id);
            return [patient.id, userAssignments] as const;
          })
        );
        setAssignments(Object.fromEntries(assignmentEntries));
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : genericError,
        });
      })
      .finally(() => setLoading(false));
  }, [genericError, user]);

  const programMap = useMemo(() => {
    return new Map(programs.map((program) => [program.id, program]));
  }, [programs]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => {
      const name = `${patient.firstname} ${patient.lastname}`.toLowerCase();
      return name.includes(term);
    });
  }, [patients, search]);

  const resetAssignState = () => {
    setAssignPatientId(null);
    setAssignProgramId("");
  };

  const refreshPatientData = async (patientId: string) => {
    const [patient, userAssignments] = await Promise.all([
      getPatient(patientId),
      listAssignmentsByUser(patientId),
    ]);
    setAssignments((prev) => ({
      ...prev,
      [patientId]: userAssignments,
    }));
    if (patient) {
      setPatients((prev) => {
        const existingIndex = prev.findIndex((entry) => entry.id === patient.id);
        if (existingIndex === -1) {
          return prev.concat(patient);
        }
        const clone = [...prev];
        clone.splice(existingIndex, 1, patient);
        return clone;
      });
    }
  };

  const handleAssignProgram = async () => {
    if (!user || !assignPatientId || !assignProgramId) {
      return;
    }
    setAssigning(true);
    try {
      await assignProgramToUser({
        programId: assignProgramId,
        userId: assignPatientId,
      });
      await refreshPatientData(assignPatientId);
      setMessage({ type: "success", text: successAssigned });
      resetAssignState();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : genericError,
      });
    } finally {
      setAssigning(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleRemoveAssignment = async (
    patientId: string,
    assignmentId: string
  ) => {
    try {
      await removeProgramAssignment(assignmentId);
      setAssignments((prev) => {
        const current = prev[patientId] ?? [];
        return {
          ...prev,
          [patientId]: current.filter((entry) => entry.id !== assignmentId),
        };
      });
      setMessage({ type: "success", text: successRemoved });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : genericError,
      });
    } finally {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">
            {heading}
          </h1>
          <p className="mt-2 text-sm text-brand-text-muted">{subtitle}</p>
        </div>
        <div className="w-full max-w-xs">
          <Label htmlFor="patient-search" className="sr-only">
            {searchPlaceholder}
          </Label>
          <Input
            id="patient-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      {message && (
        <div
          className={`rounded-card border px-4 py-3 text-sm shadow-soft ${
            message.type === "success"
              ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-brand-text-muted">
            <Spinner className="h-8 w-8" />
            <span>{loadingLabel}</span>
          </div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="flex min-h-[30vh] flex-col items-center justify-center gap-3 border-dashed border-brand-divider/70 bg-brand-light/40 text-center text-sm text-brand-text-muted">
          <p>{emptyPatientsLabel}</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredPatients.map((patient) => {
            const name = `${patient.firstname} ${patient.lastname}`.trim();
            const patientAssignments = assignments[patient.id] ?? [];
            const assignedProgramIds = new Set(
              patientAssignments.map((assignment) => assignment.programId)
            );
            const availablePrograms = programs.filter(
              (program) => !assignedProgramIds.has(program.id)
            );

            return (
              <Card key={patient.id} className="flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-text">
                      {name || patient.id}
                    </h2>
                    {patient.diagnosis && (
                      <p className="mt-1 text-sm text-brand-text-muted">
                        {patient.diagnosis}
                      </p>
                    )}
                    {patient.nextAppointment && (
                      <p className="mt-1 text-xs uppercase tracking-wide text-brand-text-muted">
                        {t(
                          "therapist.patients.nextAppointment",
                          "Next appointment"
                        )}
                        :{" "}
                        <span className="font-medium text-brand-text">
                          {patient.nextAppointment}
                        </span>
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      assignPatientId === patient.id
                        ? resetAssignState()
                        : setAssignPatientId(patient.id)
                    }
                  >
                    {assignPatientId === patient.id
                      ? cancelAssignLabel
                      : assignButtonLabel}
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
                    {assignedProgramsHeading}
                  </h3>
                  <div className="mt-3 space-y-2">
                    {patientAssignments.length === 0 ? (
                      <p className="rounded-[12px] border border-dashed border-brand-divider/60 px-3 py-3 text-sm text-brand-text-muted">
                        {noAssignmentsLabel}
                      </p>
                    ) : (
                      patientAssignments.map((assignment) => {
                        const program = programMap.get(assignment.programId);
                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between rounded-[12px] border border-brand-divider/60 bg-white px-3 py-3 text-sm text-brand-text"
                          >
                            <div>
                              <p className="font-medium">
                                {program?.title ?? assignment.programId}
                              </p>
                              {program?.description && (
                                <p className="text-xs text-brand-text-muted">
                                  {program.description}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                handleRemoveAssignment(
                                  patient.id,
                                  assignment.id
                                )
                              }
                            >
                              {removeAssignmentLabel}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {assignPatientId === patient.id && (
                  <div className="mt-4 space-y-4 rounded-[14px] border border-brand-divider/60 bg-brand-light/40 p-4">
                    {availablePrograms.length === 0 ? (
                      <p className="text-sm text-brand-text-muted">
                        {noProgramsLabel}
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`program-select-${patient.id}`}>
                            {selectProgramPlaceholder}
                          </Label>
                          <Select
                            id={`program-select-${patient.id}`}
                            value={assignProgramId}
                            onChange={(event) => setAssignProgramId(event.target.value)}
                          >
                            <option value="">{selectProgramPlaceholder}</option>
                            {availablePrograms.map((program) => (
                              <option key={program.id} value={program.id}>
                                {program.title}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleAssignProgram}
                            disabled={!assignProgramId || assigning}
                          >
                            {assigning ? (
                              <span className="flex items-center gap-2">
                                <Spinner className="h-4 w-4" />
                                {t("therapist.patients.saving", "Saving…")}
                              </span>
                            ) : (
                              saveAssignmentLabel
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={resetAssignState}
                          >
                            {cancelAssignLabel}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
