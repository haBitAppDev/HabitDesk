export type UserRole = "admin" | "therapist" | "patient";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface TherapistType {
  id: string;
  name: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  inputs?: Record<string, any>;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  therapistTypes: string[];
  taskTemplateIds: string[];
}

export interface ProgramInstanceTask {
  taskTemplateId: string;
  config?: any;
}

export interface ProgramInstance {
  id: string;
  patientId: string;
  therapistId: string;
  templateId?: string;
  tasks: ProgramInstanceTask[];
}
