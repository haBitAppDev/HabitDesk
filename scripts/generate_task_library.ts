import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MediaKind,
  TaskTemplate,
  TaskType,
  TaskVisibility,
  TemplateScope,
} from "../src/modules/shared/types/domain";

interface EvidenceEntry {
  readonly statement: string;
  readonly citation: string;
  readonly url: string;
}

interface EvidenceTask extends TaskTemplate {
  readonly focusArea: string;
  readonly evidence: EvidenceEntry[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const now = new Date().toISOString();

const sharedDefaults = {
  ownerId: "",
  roles: ["therapist"],
  visibility: TaskVisibility.VisibleToPatients,
  scope: TemplateScope.TherapistType,
  isPublished: true,
  createdAt: now,
  updatedAt: now,
} satisfies Partial<TaskTemplate>;

const evidenceBackedTasks: EvidenceTask[] = [
  {
    id: "ergotherapie-cimt-protokoll",
    title: "Mein Arm-Training dokumentieren",
    description:
      "Notiere nach jeder Übung, wie viele Minuten du deinen betroffenen Arm bewusst eingesetzt hast. So siehst du, wie sich deine Beweglichkeit Woche für Woche entwickelt.",
    icon: "pan_tool_alt_rounded",
    type: TaskType.Progress,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Progress,
      target: 180,
      allowPartial: true,
      unit: "Minuten",
    },
    focusArea: "Motorische Rehabilitation nach Schlaganfall",
    evidence: [
      {
        statement:
          "Die S3-Leitlinie Schlaganfallrehabilitation empfiehlt CIMT zur Verbesserung der oberen Extremität, sofern aktive Finger- und Handgelenksbewegungen vorhanden sind.",
        citation:
          "Deutsche Gesellschaft für Neurologie (2020). S3-Leitlinie 030/073: Schlaganfall – Rehabilitation, Teil 1.",
        url: "https://www.dgn.org/leitlinien/ll-030-073-schlaganfall-rehabilitation",
      },
    ],
  },
  {
    id: "ergotherapie-copm-reflexion",
    title: "Wöchentlicher Alltagsmoment",
    description:
      "Nimm dir einmal pro Woche drei Minuten Zeit und beschreibe in einfachen Worten, welche Alltagsaufgabe dir wichtig war, wie zufrieden du damit bist (0–10) und was du nächste Woche probieren möchtest.",
    icon: "rate_review_rounded",
    type: TaskType.TextInput,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 30,
      maxLength: 600,
      showHistory: true,
    },
    focusArea: "Betätigungsbasierte Ergebnisdokumentation",
    evidence: [
      {
        statement:
          "Die Canadian Occupational Performance Measure (COPM) ist ein validiertes Instrument zur klientenzentrierten Zielformulierung und Ergebnismessung in der Ergotherapie.",
        citation:
          "Law, M. et al. (1990). The Canadian Occupational Performance Measure: an outcome measure for occupational therapy. Canadian Journal of Occupational Therapy, 57(2), 82–87.",
        url: "https://doi.org/10.1177/000841749005700207",
      },
    ],
  },
  {
    id: "ergotherapie-adl-intervention",
    title: "Mein Alltagsschritt planen",
    description:
      "Wähle eine kleine Alltagshandlung (z. B. anziehen, kochen, schreiben) und notiere, wie dein Ziel lautet und wie oft du in der Woche üben möchtest. Halte fest, was dir dabei helfen kann.",
    icon: "checklist_rounded",
    type: TaskType.Goal,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Goal,
      goalDescription:
        "Beschreibe das Ziel, dein aktuelles Ausgangsniveau und wann du üben möchtest (z. B. morgens, 3-mal pro Woche).",
    },
    focusArea: "Aufgabenorientiertes Training",
    evidence: [
      {
        statement:
          "Aufgabenorientiertes Training mit hoher Wiederholungszahl verbessert die funktionelle Hand-Arm-Leistung nach Schlaganfall signifikant.",
        citation:
          "Lang, C. E. et al. (2009). Dose response of task-specific training in the upper extremity after stroke. Stroke, 40(9), 315–320.",
        url: "https://doi.org/10.1161/STROKEAHA.108.560863",
      },
    ],
  },
  {
    id: "ergotherapie-handuebung-video",
    title: "Video: Handübungen mit Band",
    description:
      "Schau dir das 6-Minuten-Video an und probiere die gezeigten Handübungen mit deinem Theraband mit. Pausiere, wenn du eine Bewegung zuerst ohne Band üben möchtest.",
    icon: "play_circle_rounded",
    type: TaskType.Media,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=tD7TeWcTIWw",
      kind: MediaKind.Video,
    },
    focusArea: "Motorische Aktivierung zu Hause",
    evidence: [
      {
        statement:
          "Gezielte, wiederholte Handübungen unterstützen laut Schlaganfall-Leitlinie die funktionelle Rückkehr in den Alltag und ergänzen CIMT-Programme.",
        citation:
          "Deutsche Gesellschaft für Neurologie (2020). S3-Leitlinie 030/073: Schlaganfall – Rehabilitation, Teil 1.",
        url: "https://www.dgn.org/leitlinien/ll-030-073-schlaganfall-rehabilitation",
      },
    ],
  },
  {
    id: "physiotherapie-otago-balance",
    title: "Otago-Balance zählen",
    description:
      "Trage jede Woche ein, wie viele Sätze du aus dem Otago-Programm geschafft hast (Kniebeuge, Tandemstand, Einbeinstand). Auch halbe Sätze zählen – notiere einfach die Zahl.",
    icon: "self_improvement_rounded",
    type: TaskType.Progress,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Progress,
      target: 12,
      allowPartial: true,
      unit: "Sätze",
    },
    focusArea: "Sturzprävention bei älteren Erwachsenen",
    evidence: [
      {
        statement:
          "Das Otago Exercise Programme reduziert Stürze signifikant, wenn Kraft- und Gleichgewichtsübungen mindestens dreimal wöchentlich durchgeführt werden.",
        citation:
          "Campbell, A. J. et al. (1997). Randomised controlled trial of a general practitioner programme of home based exercise to prevent falls in elderly women. BMJ, 315(7115), 1065–1069.",
        url: "https://doi.org/10.1136/bmj.315.7115.1065",
      },
    ],
  },
  {
    id: "physiotherapie-ausdauer-copd",
    title: "20-Minuten-Ausdauerlauf",
    description:
      "Starte deinen 20-Minuten-Ausdauerblock (Spaziergang, Ergometer oder Tanzen). Drücke auf Start, bleib bei deinem Tempo und notiere, ob du Pausen brauchtest.",
    icon: "directions_run_rounded",
    type: TaskType.Timer,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Timer,
      seconds: 1200,
      allowPause: true,
    },
    focusArea: "Atemphysiotherapie bei COPD",
    evidence: [
      {
        statement:
          "Die S2k-Leitlinie COPD empfiehlt mindestens 20 Minuten aerobe Belastung pro Trainingseinheit, um Belastbarkeit und Dyspnoe zu verbessern.",
        citation:
          "Deutsche Atemwegsliga & Deutsche Gesellschaft für Pneumologie (2021). S2k-Leitlinie COPD.",
        url: "https://register.awmf.org/de/leitlinien/detail/080-009",
      },
    ],
  },
  {
    id: "physiotherapie-borg-monitoring",
    title: "Mein Belastungsgefühl",
    description:
      "Bewerte nach jeder Bewegungseinheit, wie anstrengend sie sich angefühlt hat (Borg-Skala 6–20). Ein Eintrag pro Einheit reicht, damit du deine Belastung gut steuern kannst.",
    icon: "speed_rounded",
    type: TaskType.Scale,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Scale,
      min: 6,
      max: 20,
      step: 1,
      leftLabel: "sehr leicht",
      rightLabel: "maximal",
    },
    focusArea: "Belastungssteuerung",
    evidence: [
      {
        statement:
          "Die Borg-RPE-Skala ist ein etabliertes Instrument zur Einschätzung der Trainingsintensität und korreliert mit physiologischen Parametern.",
        citation:
          "Borg, G. A. V. (1982). Psychophysical bases of perceived exertion. Medicine & Science in Sports & Exercise, 14(5), 377–381.",
        url: "https://doi.org/10.1249/00005768-198205000-00012",
      },
    ],
  },
  {
    id: "physiotherapie-breathing-video",
    title: "Video: Pursed-Lip-Atmung üben",
    description:
      "Unsere Empfehlung: Schau dir das 5-Minuten-Video zur Pursed-Lip-Atmung an und mache die Übung gleich mit. Atme ruhig ein, presse beim Ausatmen die Lippen sanft zusammen.",
    icon: "play_circle_rounded",
    type: TaskType.Media,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=j-gV8yFXxdc",
      kind: MediaKind.Video,
    },
    focusArea: "Atemphysiotherapie bei COPD",
    evidence: [
      {
        statement:
          "Die S2k-Leitlinie COPD empfiehlt die Pursed-Lip-Atmung, weil sie Atemnot reduziert und die Ausatmung verlängert.",
        citation:
          "Deutsche Atemwegsliga & Deutsche Gesellschaft für Pneumologie (2021). S2k-Leitlinie COPD.",
        url: "https://register.awmf.org/de/leitlinien/detail/080-009",
      },
    ],
  },
  {
    id: "logotherapie-sinn-tagebuch",
    title: "Mein Sinn-Moment",
    description:
      "Schreibe jeden Abend zwei bis drei Sätze darüber, was dir heute Sinn gegeben hat. Notiere, welcher Wert dahinter steckt (z. B. Fürsorge, Lernen, Freiheit).",
    icon: "menu_book_rounded",
    type: TaskType.TextInput,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 30,
      maxLength: 500,
      showHistory: true,
    },
    focusArea: "Logotherapeutische Sinnreflexion",
    evidence: [
      {
        statement:
          "Frankl betont die tägliche Reflexion konkreter Sinnmöglichkeiten als Kernmethode der Logotherapie.",
        citation:
          "Frankl, V. E. (2011). Der Mensch auf der Suche nach Sinn. München: Kösel.",
        url: "https://www.viktorfrankl.org/",
      },
    ],
  },
  {
    id: "logotherapie-werte-wochenziel",
    title: "Wert-Ziel der Woche",
    description:
      "Formuliere ein Ziel für diese Woche, das zu einem deiner Werte passt. Schreibe in einfachen Worten, was du tun möchtest und welcher kleine Schritt morgen drin ist.",
    icon: "flag_rounded",
    type: TaskType.Goal,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.Goal,
      goalDescription:
        "Beschreibe den Wert, dein Ziel und deinen ersten Schritt (z. B. Termin vereinbaren, Nachricht schreiben).",
    },
    focusArea: "Existenzanalytische Zielarbeit",
    evidence: [
      {
        statement:
          "Wertorientierte Zielarbeit unterstützt nach logotherapeutischem Konzept die willentliche Verwirklichung von Sinnmöglichkeiten.",
        citation:
          "Lukas, E., & Hirsch, R. (2016). Sinnzentrierte Psychotherapie – Logotherapie und Existenzanalyse in der Praxis. München: Kösel.",
        url: "https://www.klett-cotta.de/buch/Psychotherapie/Sinnzentrierte_Psychotherapie/70741",
      },
    ],
  },
  {
    id: "psychotherapie-gedankenprotokoll",
    title: "Gedanken-Stopp Protokoll",
    description:
      "Halte eine belastende Situation fest: Was ist passiert? Welcher automatische Gedanke kam? Wie stark war das Gefühl (0–100)? Formuliere am Ende eine hilfreiche Alternative.",
    icon: "psychology_rounded",
    type: TaskType.TextInput,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 60,
      maxLength: 800,
      showHistory: true,
    },
    focusArea: "Kognitive Verhaltenstherapie",
    evidence: [
      {
        statement:
          "Gedankenprotokolle sind ein zentrales Werkzeug der kognitiven Therapie zur Identifikation und Modifikation verzerrter Gedanken.",
        citation:
          "Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). Cognitive Therapy of Depression. New York: Guilford Press.",
        url: "https://doi.org/10.1037/0003-066X.36.2.111",
      },
    ],
  },
  {
    id: "psychotherapie-emotionslog",
    title: "Mein Emoji-Stimmungslog",
    description:
      "Wähle einmal am Tag das Emoji, das am besten zu deiner Stimmung passt, und ergänze bei Bedarf einen kurzen Satz (z. B. \"Müde nach der Arbeit\").",
    icon: "mood_rounded",
    type: TaskType.StateLog,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.StateLog,
      emojiKeys: ["😀", "🙂", "😐", "😔", "😢"],
      showChart: true,
    },
    focusArea: "Affektmonitoring",
    evidence: [
      {
        statement:
          "Die PANAS-Skalen erfassen valide positive und negative Affekte und eignen sich zur täglichen Selbstbeobachtung.",
        citation:
          "Watson, D., Clark, L. A., & Tellegen, A. (1988). Development and validation of brief measures of positive and negative affect: The PANAS scales. Journal of Personality and Social Psychology, 54(6), 1063–1070.",
        url: "https://doi.org/10.1037/0022-3514.54.6.1063",
      },
    ],
  },
  {
    id: "psychotherapie-achtsamkeitszeit",
    title: "10 Minuten Atemruhe",
    description:
      "Starte den 10-Minuten-Timer und übe deine Atemachtsamkeit. Atme ein, zähle leise, atme länger aus. Wenn Gedanken kommen, nimm sie wahr und kehre zum Atem zurück.",
    icon: "self_improvement",
    type: TaskType.Timer,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.Timer,
      seconds: 600,
      allowPause: false,
    },
    focusArea: "Achtsamkeitsbasierte Stressreduktion",
    evidence: [
      {
        statement:
          "MBSR-Sitzungen mit täglicher 10- bis 20-minütiger Meditation verbessern Stressbewältigung und psychisches Wohlbefinden.",
        citation:
          "Kabat-Zinn, J. (1990). Full Catastrophe Living. New York: Delacorte.",
        url: "https://www.umassmed.edu/cfm/",
      },
    ],
  },
  {
    id: "psychotherapie-achtsamkeitsvideo",
    title: "Video: Geführte Atemmeditation",
    description:
      "Schau das 10-Minuten-Video an und folge der sanften Atemmeditation. Setz dich bequem hin, schließe die Augen und lass dich durch die Übung begleiten.",
    icon: "play_circle_rounded",
    type: TaskType.Media,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=ZToicYcHIOU",
      kind: MediaKind.Video,
    },
    focusArea: "Achtsamkeitsbasierte Stressreduktion",
    evidence: [
      {
        statement:
          "Geführte Atemmeditationen nach dem MBSR-Ansatz reduzieren Stress und unterstützen die Alltagsumsetzung von Achtsamkeit.",
        citation:
          "Kabat-Zinn, J. (1990). Full Catastrophe Living. New York: Delacorte.",
        url: "https://www.umassmed.edu/cfm/",
      },
    ],
  },
];

evidenceBackedTasks.forEach((task) => {
  Object.assign(task, sharedDefaults);
});

const outputDir = join(__dirname, "..", "public", "task-library");
await mkdir(outputDir, { recursive: true });

const outputPath = join(outputDir, "tasks.json");

const payload = {
  generatedAt: now,
  tasks: evidenceBackedTasks,
};

await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");

const counts = evidenceBackedTasks.reduce<Record<string, number>>((acc, task) => {
  task.therapistTypes.forEach((type) => {
    acc[type] = (acc[type] ?? 0) + 1;
  });
  return acc;
}, {});

console.log("📚 Task library export created:\n");
console.table(
  Object.entries(counts).map(([therapistType, total]) => ({ therapistType, total })),
);
console.log(`\n➡️  ${evidenceBackedTasks.length} Aufgaben gespeichert unter ${outputPath}`);
