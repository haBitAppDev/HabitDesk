import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MediaKind,
  TaskFrequency,
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
    title: "CIMT-Handeinsatz protokollieren",
    description:
      "Dokumentiere täglich, wie viele Minuten der betroffene Arm bei der Constraint-Induced Movement Therapy aktiv eingesetzt wurde.",
    icon: "pan_tool_alt_rounded",
    type: TaskType.Progress,
    frequency: TaskFrequency.Daily,
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
    title: "COPM-Reflexion zum Alltag",
    description:
      "Halte wöchentlich fest, wie zufrieden du mit einer selbstgewählten Alltagsaktivität bist und welche Fortschritte du bemerkst.",
    icon: "rate_review_rounded",
    type: TaskType.TextInput,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 40,
      maxLength: 800,
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
    title: "Aufgabenorientiertes ADL-Training planen",
    description:
      "Formuliere ein konkretes, messbares Trainingsziel für eine Aktivität des täglichen Lebens und lege die Anzahl der Wiederholungen pro Übungstag fest.",
    icon: "checklist_rounded",
    type: TaskType.Goal,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Goal,
      goalDescription:
        "Definiere Ziel, Ausgangsniveau und Trainingshäufigkeit für eine alltagsrelevante Aktivität (z. B. selbstständiges Anziehen).",
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
    id: "physiotherapie-otago-balance",
    title: "Otago-Gleichgewichtsübungen zählen",
    description:
      "Protokolliere, wie viele Sätze aus dem Otago-Programm (Kniebeugen, Tandemstand, Einbeinstand) du absolviert hast.",
    icon: "self_improvement_rounded",
    type: TaskType.Progress,
    frequency: TaskFrequency.Weekly,
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
    title: "Ausdauertraining bei COPD steuern",
    description:
      "Starte ein 20-minütiges Ausdauertraining (z. B. Gehen auf ebener Strecke) und halte Pausen so kurz wie möglich.",
    icon: "directions_run_rounded",
    type: TaskType.Timer,
    frequency: TaskFrequency.Daily,
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
    title: "Belastung mit Borg-Skala erfassen",
    description:
      "Bewerte nach jeder Trainingseinheit deine wahrgenommene Anstrengung auf der Borg-Skala (6–20).",
    icon: "speed_rounded",
    type: TaskType.Scale,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Scale,
      min: 6,
      max: 20,
      step: 1,
      leftLabel: "sehr, sehr leicht",
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
    id: "logotherapie-sinn-tagebuch",
    title: "Sinn-Tagebuch führen",
    description:
      "Reflektiere täglich, welche Handlung dir Sinn vermittelt hat und welche Werte du erlebt hast.",
    icon: "menu_book_rounded",
    type: TaskType.TextInput,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 40,
      maxLength: 600,
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
    title: "Werteorientiertes Wochenziel",
    description:
      "Formuliere ein Wochenziel, das einen deiner zentralen Werte aktiv verwirklicht, und beschreibe konkrete Schritte.",
    icon: "flag_rounded",
    type: TaskType.Goal,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.Goal,
      goalDescription:
        "Beschreibe Wert, Handlungsziel und den ersten kleinen Schritt zur Umsetzung.",
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
    title: "Kognitives Gedankenprotokoll",
    description:
      "Erfasse auslösende Situationen, automatische Gedanken, Gefühle und alternative Bewertungen.",
    icon: "psychology_rounded",
    type: TaskType.TextInput,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 60,
      maxLength: 900,
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
    title: "Emotionstagebuch (PANAS)",
    description:
      "Dokumentiere täglich deine positive und negative Affektlage anhand repräsentativer Emotions-Emojis.",
    icon: "mood_rounded",
    type: TaskType.StateLog,
    frequency: TaskFrequency.Daily,
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
    title: "Achtsamkeitsmeditation",
    description:
      "Führe täglich eine 10-minütige Atemachtsamkeit nach dem MBSR-Protokoll durch.",
    icon: "self_improvement",
    type: TaskType.Timer,
    frequency: TaskFrequency.Daily,
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
    id: "ergotherapie-spiegeltherapie-video",
    title: "Spiegeltherapie anleiten",
    description:
      "Sieh dir das Demonstrationsvideo zur Spiegeltherapie an und notiere danach kurz, welche Bewegungen du mit der Patientin einüben möchtest.",
    icon: "smart_display_rounded",
    type: TaskType.Media,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=WA1BQa58ae0",
      kind: MediaKind.Video,
    },
    focusArea: "Spiegeltherapie nach Schlaganfall",
    evidence: [
      {
        statement:
          "Metaanalysen zeigen, dass Spiegeltherapie die Arm-Hand-Funktion nach Schlaganfall signifikant verbessern kann.",
        citation:
          "Thieme, H., Mehrholz, J., Pohl, M., Behrens, J., & Dohle, C. (2012). Mirror therapy for improving motor function after stroke. Stroke, 43(1), 107–111.",
        url: "https://doi.org/10.1161/STROKEAHA.111.632943",
      },
    ],
  },
  {
    id: "ergotherapie-energiehaushalt-plan",
    title: "Energiehaushalt strukturieren",
    description:
      "Erstelle einen Wochenplan mit priorisierten Aktivitäten und kennzeichne Energiepausen gemäß dem 4P-Prinzip (Priorisieren, Planen, Positionieren, Pace).",
    icon: "event_note_rounded",
    type: TaskType.Goal,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Goal,
      goalDescription:
        "Beschreibe mindestens drei energieintensive Aktivitäten, passende Anpassungen und geplante Ruhefenster.",
    },
    focusArea: "Energie- und Fatigue-Management",
    evidence: [
      {
        statement:
          "Strukturierte Energie-Management-Programme verbessern nachweislich Fatigue und Betätigungsperformanz bei chronischen Erkrankungen.",
        citation:
          "Packer, T. L., et al. (1995). Managing fatigue: A six-week course for energy conservation. Occupational Therapy in Health Care, 8(4), 17–31.",
        url: "https://doi.org/10.1080/J003v08n04_02",
      },
    ],
  },
  {
    id: "ergotherapie-handkraft-tracking",
    title: "Handkraft dokumentieren",
    description:
      "Miss zweimal pro Woche mit dem Dynamometer die Griffkraft und vermerke den höchsten Wert jeder Sitzung.",
    icon: "fitness_center_rounded",
    type: TaskType.Progress,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["ergotherapie"],
    config: {
      taskType: TaskType.Progress,
      target: 35,
      allowPartial: true,
      unit: "kg",
    },
    focusArea: "Funktionelle Kraftmessung",
    evidence: [
      {
        statement:
          "Regelmäßige Griffkraftmessungen sind valide Indikatoren für funktionelle Fortschritte in der neurorehabilitativen Ergotherapie.",
        citation:
          "Lang, C. E., et al. (2008). Observation of amounts of movement practice provided during stroke rehabilitation. Archives of Physical Medicine and Rehabilitation, 90(10), 1692–1698.",
        url: "https://doi.org/10.1016/j.apmr.2009.04.005",
      },
    ],
  },
  {
    id: "physiotherapie-achillessehne-video",
    title: "Exzentrisches Wadentraining",
    description:
      "Schaue das Video zum Alfredson-Protokoll und führe die exzentrischen Fersenabsenkungen gemäß Anleitung durch.",
    icon: "play_circle_rounded",
    type: TaskType.Media,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=FhC5tB3Ggg0",
      kind: MediaKind.Video,
    },
    focusArea: "Achillessehnen-Tendinopathie",
    evidence: [
      {
        statement:
          "Das Alfredson-Protokoll mit exzentrischem Wadentraining reduziert Schmerzen und verbessert Funktion bei chronischer Achillessehnen-Tendinopathie.",
        citation:
          "Alfredson, H., Pietilä, T., Jonsson, P., & Lorentzon, R. (1998). Heavy-load eccentric calf muscle training for the treatment of chronic Achilles tendinosis. The American Journal of Sports Medicine, 26(3), 360–366.",
        url: "https://doi.org/10.1177/03635465980260030301",
      },
    ],
  },
  {
    id: "physiotherapie-6mwt-protokoll",
    title: "6-Minuten-Gehtest protokollieren",
    description:
      "Miss einmal pro Woche die zurückgelegte Strecke im 6-Minuten-Gehtest und dokumentiere Pausen oder Hilfsmittel.",
    icon: "straighten_rounded",
    type: TaskType.Progress,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Progress,
      target: 450,
      allowPartial: true,
      unit: "Meter",
    },
    focusArea: "Belastungstoleranz und Ausdauer",
    evidence: [
      {
        statement:
          "Der 6-Minuten-Gehtest ist ein reliabler Parameter zur Verlaufskontrolle der funktionellen Leistungsfähigkeit.",
        citation:
          "American Thoracic Society (2002). ATS Statement: Guidelines for the Six-Minute Walk Test. American Journal of Respiratory and Critical Care Medicine, 166(1), 111–117.",
        url: "https://doi.org/10.1164/ajrccm.166.1.at1102",
      },
    ],
  },
  {
    id: "physiotherapie-vestibular-video",
    title: "Vestibuläres Habituationstraining",
    description:
      "Arbeite die gezeigte Brandt-Daroff-Übungssequenz durch und dokumentiere Schwindelsymptome vor und nach der Einheit.",
    icon: "videocam_rounded",
    type: TaskType.Media,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["physiotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=uWg8aQ0P2Hc",
      kind: MediaKind.Video,
    },
    focusArea: "Vestibuläre Rehabilitation",
    evidence: [
      {
        statement:
          "Gezielte Habituationsübungen reduzieren Schwindel und verbessern Gleichgewicht bei peripherem Vestibularsyndrom.",
        citation:
          "Hall, C. D., et al. (2016). Vestibular Rehabilitation for Peripheral Vestibular Hypofunction: An Evidence-Based Clinical Practice Guideline. Journal of Neurologic Physical Therapy, 40(2), 124–155.",
        url: "https://doi.org/10.1097/NPT.0000000000000120",
      },
    ],
  },
  {
    id: "logotherapie-sinnskala",
    title: "Sinnsättigung einschätzen",
    description:
      "Bewerte täglich auf einer Skala von 0 bis 10, wie sinnstiftend sich deine wichtigsten Aktivitäten angefühlt haben.",
    icon: "emoji_objects_rounded",
    type: TaskType.Scale,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["logotherapie"],
    config: {
      taskType: TaskType.Scale,
      min: 0,
      max: 10,
      step: 1,
      leftLabel: "keine Sinnfülle",
      rightLabel: "maximale Sinnfülle",
    },
    focusArea: "Sinnbilanz und Werte",
    evidence: [
      {
        statement:
          "Die tägliche Erfassung subjektiver Sinnsättigung fördert die Selbstwahrnehmung und ermöglicht wertorientierte Interventionen.",
        citation:
          "Steger, M. F., Frazier, P., Oishi, S., & Kaler, M. (2006). The Meaning in Life Questionnaire: Assessing the presence of and search for meaning in life. Journal of Counseling Psychology, 53(1), 80–93.",
        url: "https://doi.org/10.1037/0022-0167.53.1.80",
      },
    ],
  },
  {
    id: "logotherapie-dankbarkeitstagebuch",
    title: "Dankbarkeitstagebuch",
    description:
      "Notiere jeden Abend drei Erlebnisse, für die du dankbar bist, und welche Werte du darin erkennst.",
    icon: "auto_stories_rounded",
    type: TaskType.TextInput,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["logotherapie"],
    config: {
      taskType: TaskType.TextInput,
      minLength: 30,
      maxLength: 500,
      showHistory: true,
    },
    focusArea: "Wertschätzung kultivieren",
    evidence: [
      {
        statement:
          "Regelmäßige Dankbarkeitsreflexion erhöht Wohlbefinden und unterstützt sinnorientierte Coping-Prozesse.",
        citation:
          "Emmons, R. A., & McCullough, M. E. (2003). Counting blessings versus burdens: An experimental investigation of gratitude and subjective well-being in daily life. Journal of Personality and Social Psychology, 84(2), 377–389.",
        url: "https://doi.org/10.1037/0022-3514.84.2.377",
      },
    ],
  },
  {
    id: "psychotherapie-pmr-video",
    title: "Progressive Muskelrelaxation üben",
    description:
      "Führe die angeleitete Progressive Muskelrelaxation durch und achte auf bewusste An- und Entspannung jeder Muskelgruppe.",
    icon: "spa_rounded",
    type: TaskType.Media,
    frequency: TaskFrequency.Daily,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.Media,
      mediaUrl: "https://www.youtube.com/watch?v=47LCLoidJh4",
      kind: MediaKind.Video,
    },
    focusArea: "Entspannungsverfahren",
    evidence: [
      {
        statement:
          "Progressive Muskelrelaxation reduziert Angst- und Stresssymptome signifikant, wenn sie regelmäßig angewendet wird.",
        citation:
          "Bernstein, D. A., & Borkovec, T. D. (1973). Progressive Relaxation Training: A Manual for the Helping Professions. Champaign, IL: Research Press.",
        url: "https://doi.org/10.1037/h0034760",
      },
    ],
  },
  {
    id: "psychotherapie-expositionshierarchie",
    title: "Expositionshierarchie planen",
    description:
      "Erstelle eine Liste von mindestens zehn angstauslösenden Situationen, ordne sie nach Angstniveau (0–100) und plane erste Expositionsschritte.",
    icon: "stairs_rounded",
    type: TaskType.Goal,
    frequency: TaskFrequency.Weekly,
    therapistTypes: ["psychotherapie"],
    config: {
      taskType: TaskType.Goal,
      goalDescription:
        "Definiere konkrete Expositionsübungen, Sicherheitsverhalten und Evaluationskriterien für Fortschritte.",
    },
    focusArea: "Expositionsbasierte Intervention",
    evidence: [
      {
        statement:
          "Sorgfältig strukturierte Expositionshierarchien erhöhen die Wirksamkeit verhaltenstherapeutischer Angstbehandlung.",
        citation:
          "Craske, M. G., Treanor, M., Conway, C. C., Zbozinek, T., & Vervliet, B. (2014). Maximizing exposure therapy: An inhibitory learning approach. Behaviour Research and Therapy, 58, 10–23.",
        url: "https://doi.org/10.1016/j.brat.2014.04.006",
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
