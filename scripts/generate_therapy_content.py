import json
import textwrap
from pathlib import Path
from typing import Dict, List

from fpdf import FPDF
from gtts import gTTS
from moviepy import ImageClip
from PIL import Image, ImageDraw, ImageFont
from tqdm import tqdm

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "public" / "therapy_media"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TASK_TEMPLATES = {
    "pdf": [
        "Lies das PDF „{title}“ und notiere drei persönliche Erkenntnisse in deinem Journal.",
        "Bearbeite das Arbeitsblatt „{title}“ vollständig und halte eine konkrete Umsetzungsidee fest.",
    ],
    "audio": [
        "Höre das Audio „{title}“ bewusst an und protokolliere deine wichtigsten Beobachtungen.",
    ],
    "video": [
        "Sieh dir das Video „{title}“ an und beschreibe anschließend, wie du die Inhalte in der Praxis testen willst.",
    ],
}

THERAPIST_PROGRAMS: Dict[str, List[Dict]] = {
    "Verhaltenstherapie": [
        {
            "title": "Stressmanagement im Alltag",
            "summary": "Psychoedukation und praktische Übungen zur Reduktion von Alltagsstress.",
            "modules": [
                {
                    "title": "Stresskreislauf verstehen",
                    "type": "pdf",
                    "description": "Ein kompaktes Manual erklärt den physiologischen und kognitiven Stresskreislauf mit Reflexionsfragen.",
                },
                {
                    "title": "Progressive Muskelrelaxation",
                    "type": "audio",
                    "description": "Geführte Entspannungsübung mit klaren Anweisungen.",
                },
                {
                    "title": "Stressanalyse-Worksheet",
                    "type": "pdf",
                    "description": "Arbeitsblatt zur Identifikation von Stressoren und Ressourcen.",
                },
                {
                    "title": "Strategien zur Stressbewältigung",
                    "type": "video",
                    "description": "Kurzvideo mit Visualisierung und Reminder für den Alltag.",
                },
            ],
        },
        {
            "title": "Gedanken herausfordern",
            "summary": "Kognitive Umstrukturierung und praktische Gedanken-Experimente.",
            "modules": [
                {
                    "title": "Arbeitsblatt kognitive Umstrukturierung",
                    "type": "pdf",
                    "description": "Manual zum Identifizieren automatischer Gedanken und alternativer Perspektiven.",
                },
                {
                    "title": "Distanzierungsübung",
                    "type": "audio",
                    "description": "Audio leitet durch eine kurze Perspektivwechsel-Übung.",
                },
                {
                    "title": "Gedankentagebuch",
                    "type": "pdf",
                    "description": "Tagesprotokoll zum Dokumentieren von Situationen, Gedanken und Emotionen.",
                },
                {
                    "title": "Fallbeispiel-Video",
                    "type": "video",
                    "description": "Video erklärt anhand eines fiktiven Falls den Ablauf einer kognitiven Intervention.",
                },
            ],
        },
        {
            "title": "Resilienz stärken",
            "summary": "Stärkenorientierte Übungen für mehr innere Widerstandskraft.",
            "modules": [
                {
                    "title": "Resilienzfaktoren-Handout",
                    "type": "pdf",
                    "description": "Übersicht über zentrale Resilienzfaktoren mit Reflexionsfragen.",
                },
                {
                    "title": "Resilienz-Routine",
                    "type": "audio",
                    "description": "Audio-Anleitung für eine Morgenroutine zur Aktivierung persönlicher Ressourcen.",
                },
                {
                    "title": "Stärkeninventar",
                    "type": "pdf",
                    "description": "Arbeitsblatt zum Sammeln persönlicher und sozialer Stärken.",
                },
                {
                    "title": "Resilienztechnik im Alltag",
                    "type": "video",
                    "description": "Video zeigt eine konkrete Mikro-Übung zur Stärkung von Resilienz.",
                },
            ],
        },
        {
            "title": "Verhaltensaktivierung",
            "summary": "Planung positiver Aktivitäten zur Stimmungsaufhellung.",
            "modules": [
                {
                    "title": "Aktivitätenplan",
                    "type": "pdf",
                    "description": "Wochenplan zum Eintragen angenehmer und bedeutungsvoller Aktivitäten.",
                },
                {
                    "title": "Audio-Coaching",
                    "type": "audio",
                    "description": "Motivierendes Audio zur täglichen Planung.",
                },
                {
                    "title": "Stimmungstagebuch",
                    "type": "pdf",
                    "description": "Arbeitsblatt zur Verbindung von Aktivität und Stimmung.",
                },
                {
                    "title": "Aktivierende Ideen",
                    "type": "video",
                    "description": "Kurzvideo mit Beispielaktivitäten und Umsetzungstipps.",
                },
            ],
        },
    ],
    "Systemische Therapie": [
        {
            "title": "Familienressourcen entdecken",
            "summary": "Genogramm-Arbeit und lösungsfokussierte Fragen für Familien.",
            "modules": [
                {
                    "title": "Genogramm-Leitfaden",
                    "type": "pdf",
                    "description": "PDF erklärt Schritt für Schritt, wie ein Genogramm erstellt wird.",
                },
                {
                    "title": "Ressourceninterview",
                    "type": "audio",
                    "description": "Audio mit Leitfragen zur Identifikation familiärer Ressourcen.",
                },
                {
                    "title": "Rituale sammeln",
                    "type": "pdf",
                    "description": "Arbeitsblatt zur Sammlung stärkender Familienrituale.",
                },
                {
                    "title": "Rollenspiel-Impulse",
                    "type": "video",
                    "description": "Video zeigt lösungsfokussierte Fragen in der Anwendung.",
                },
            ],
        },
        {
            "title": "Kommunikation im Paar",
            "summary": "Kommunikationsfertigkeiten und Feedbackschleifen.",
            "modules": [
                {
                    "title": "Aktives Zuhören",
                    "type": "pdf",
                    "description": "Handout mit Techniken des aktiven Zuhörens.",
                },
                {
                    "title": "Ich-Botschaften üben",
                    "type": "audio",
                    "description": "Audio-Coaching zu Ich-Botschaften und Empathie.",
                },
                {
                    "title": "Feedbackstruktur",
                    "type": "pdf",
                    "description": "Worksheet zum gemeinsamen Planen eines Feedbackgesprächs.",
                },
                {
                    "title": "Konfliktlösung live",
                    "type": "video",
                    "description": "Video modelliert eine Konfliktlösungssituation.",
                },
            ],
        },
        {
            "title": "Systemische Aufstellungen",
            "summary": "Einführung in Aufstellungsarbeit und Selbsterfahrung.",
            "modules": [
                {
                    "title": "Aufstellungsmethodik",
                    "type": "pdf",
                    "description": "Manual erläutert Ablauf, Rollen und Ethik.",
                },
                {
                    "title": "Rollenreflexion",
                    "type": "audio",
                    "description": "Geführte Reflexion zur eigenen Position im System.",
                },
                {
                    "title": "Skulptur-Arbeit",
                    "type": "pdf",
                    "description": "Worksheet zur Planung einer Figurenaufstellung.",
                },
                {
                    "title": "Fragenkatalog",
                    "type": "video",
                    "description": "Video mit Beispiel-Fragen für Stellvertretende.",
                },
            ],
        },
        {
            "title": "Narrative Identitätsarbeit",
            "summary": "Geschichten rekonstruieren und neue Narrative schaffen.",
            "modules": [
                {
                    "title": "Storytelling-Fragen",
                    "type": "pdf",
                    "description": "Handout mit narrativen Leitfragen.",
                },
                {
                    "title": "Held:innenreise",
                    "type": "audio",
                    "description": "Audio führt durch eine kurze Imaginationsreise.",
                },
                {
                    "title": "Geschichtenvergleich",
                    "type": "pdf",
                    "description": "Worksheet für problem- vs. präferenzdominante Geschichte.",
                },
                {
                    "title": "Interviewtechnik",
                    "type": "video",
                    "description": "Video zeigt die Durchführung eines narrativen Interviews.",
                },
            ],
        },
    ],
    "Körperorientierte Therapie": [
        {
            "title": "Achtsame Körperwahrnehmung",
            "summary": "Body-Scan und achtsame Selbstwahrnehmung.",
            "modules": [
                {
                    "title": "Body-Scan-Manual",
                    "type": "pdf",
                    "description": "Schritt-für-Schritt Anleitung für den Body-Scan.",
                },
                {
                    "title": "Body-Scan Audio",
                    "type": "audio",
                    "description": "Geführte Body-Scan Session.",
                },
                {
                    "title": "Wahrnehmungstagebuch",
                    "type": "pdf",
                    "description": "Worksheet zum täglichen Festhalten von Körperempfindungen.",
                },
                {
                    "title": "Body-Awareness Übung",
                    "type": "video",
                    "description": "Video-Anleitung für eine sanfte Wahrnehmungsübung.",
                },
            ],
        },
        {
            "title": "Somatische Ressourcen",
            "summary": "Körperliche Ressourcen aktivieren und verankern.",
            "modules": [
                {
                    "title": "Ressourcenanker",
                    "type": "pdf",
                    "description": "Handout über Ressourcenanker im Körper.",
                },
                {
                    "title": "Atemvertiefung",
                    "type": "audio",
                    "description": "Atemübung zur Zentrierung.",
                },
                {
                    "title": "Empfindungsprotokoll",
                    "type": "pdf",
                    "description": "Worksheet zur Dokumentation somatischer Signale.",
                },
                {
                    "title": "Dehnsequenz",
                    "type": "video",
                    "description": "Video mit sanfter Dehn- und Zentrierungssequenz.",
                },
            ],
        },
        {
            "title": "Embodiment & Emotionen",
            "summary": "Zusammenhänge zwischen Körperhaltung und Gefühlen erkunden.",
            "modules": [
                {
                    "title": "Embodiment-Handout",
                    "type": "pdf",
                    "description": "Übersicht zu Körperhaltung und Emotionsregulation.",
                },
                {
                    "title": "Imagery-Reise",
                    "type": "audio",
                    "description": "Imaginationsübung zur Emotionsverarbeitung.",
                },
                {
                    "title": "Emotionsatlas",
                    "type": "pdf",
                    "description": "Worksheet zur Zuordnung von Körperempfindungen.",
                },
                {
                    "title": "Embodiment-Experiment",
                    "type": "video",
                    "description": "Video führt durch ein Experiment zu Haltung und Emotion.",
                },
            ],
        },
        {
            "title": "Selbstregulation durch Bewegung",
            "summary": "Rhythmische Bewegungen zur Nervensystem-Regulation.",
            "modules": [
                {
                    "title": "Bewegungsplan",
                    "type": "pdf",
                    "description": "Wochenplan mit regulierenden Bewegungsimpulsen.",
                },
                {
                    "title": "Rhythmische Regulation",
                    "type": "audio",
                    "description": "Audio mit Rhythmus und Anleitung zur Regulation.",
                },
                {
                    "title": "Puls-Atmung-Tracker",
                    "type": "pdf",
                    "description": "Worksheet zur Beobachtung von Puls und Atmung.",
                },
                {
                    "title": "Regulierende Sequenz",
                    "type": "video",
                    "description": "Video demonstriert kurze Bewegungsabfolge.",
                },
            ],
        },
    ],
    "Kunst- und Kreativtherapie": [
        {
            "title": "Emotionen künstlerisch ausdrücken",
            "summary": "Emotionale Exploration über visuelle Kunst.",
            "modules": [
                {
                    "title": "Impulskarten",
                    "type": "pdf",
                    "description": "Handout mit kreativen Impulsen für unterschiedliche Emotionen.",
                },
                {
                    "title": "Kreative Klanglandschaft",
                    "type": "audio",
                    "description": "Audio-Impuls zur Einstimmung auf eine Ausdruckseinheit.",
                },
                {
                    "title": "Reflexionsbogen",
                    "type": "pdf",
                    "description": "Worksheet zur Reflexion des entstandenen Kunstwerks.",
                },
                {
                    "title": "Mixed-Media Inspiration",
                    "type": "video",
                    "description": "Video zeigt Möglichkeiten der Kombination verschiedener Materialien.",
                },
            ],
        },
        {
            "title": "Narratives Malen",
            "summary": "Geschichten bildlich darstellen und teilen.",
            "modules": [
                {
                    "title": "Storyboard-Vorlagen",
                    "type": "pdf",
                    "description": "Vorlagen, um eine Geschichte in Bildern zu strukturieren.",
                },
                {
                    "title": "Imaginationsreise",
                    "type": "audio",
                    "description": "Audio leitet durch eine Fantasiereise als Ausgangspunkt fürs Malen.",
                },
                {
                    "title": "Galerie-Checkliste",
                    "type": "pdf",
                    "description": "Worksheet zur Dokumentation der Entstehungsschritte.",
                },
                {
                    "title": "Malanleitung",
                    "type": "video",
                    "description": "Video führt Schritt für Schritt durch eine narrative Maltechnik.",
                },
            ],
        },
        {
            "title": "Kreatives Schreiben",
            "summary": "Schreibimpulse zur Selbstreflexion und Ausdruck.",
            "modules": [
                {
                    "title": "Schreibprompts",
                    "type": "pdf",
                    "description": "Sammlung an Schreibimpulsen zu verschiedenen Themen.",
                },
                {
                    "title": "Schreibmeditation",
                    "type": "audio",
                    "description": "Audio bereitet auf fokussiertes Schreiben vor.",
                },
                {
                    "title": "Schreiblog",
                    "type": "pdf",
                    "description": "Worksheet mit Timer- und Reflexionsbereichen.",
                },
                {
                    "title": "Poesieformen",
                    "type": "video",
                    "description": "Video erklärt poetische Ausdrucksformen.",
                },
            ],
        },
        {
            "title": "Musik als Ausdruck",
            "summary": "Musikalische Mittel zur Emotionsregulation.",
            "modules": [
                {
                    "title": "Musik & Gefühle",
                    "type": "pdf",
                    "description": "Handout zur Wirkung verschiedener Musikstile.",
                },
                {
                    "title": "Klangübung",
                    "type": "audio",
                    "description": "Audio mit einfachen Percussion-Übungen.",
                },
                {
                    "title": "Kompositionsjournal",
                    "type": "pdf",
                    "description": "Worksheet zur Planung einer Eigenkomposition.",
                },
                {
                    "title": "Percussion Basics",
                    "type": "video",
                    "description": "Video zeigt grundlegende Rhythmusübungen.",
                },
            ],
        },
    ],
    "Traumatherapie": [
        {
            "title": "Stabilisierung & Sicherheit",
            "summary": "Ressourcenarbeit und Aufbau sicherer Orte.",
            "modules": [
                {
                    "title": "Sicherer Ort",
                    "type": "pdf",
                    "description": "Manual zur Safe-Place-Übung mit Visualisierung.",
                },
                {
                    "title": "Sicherer Ort Audio",
                    "type": "audio",
                    "description": "Geführte Imaginationsübung für Stabilisierung.",
                },
                {
                    "title": "Skill-Tracker",
                    "type": "pdf",
                    "description": "Worksheet zur Dokumentation hilfreicher Skills.",
                },
                {
                    "title": "Selbstberuhigung",
                    "type": "video",
                    "description": "Video demonstriert Selbstberuhigungstechniken.",
                },
            ],
        },
        {
            "title": "Ressourceninstallation",
            "summary": "Ressourcen stärken und verankern.",
            "modules": [
                {
                    "title": "Ressourcenübersicht",
                    "type": "pdf",
                    "description": "Handout mit Möglichkeiten zur Ressourcenaktivierung.",
                },
                {
                    "title": "Bilaterale Stimulation",
                    "type": "audio",
                    "description": "Rhythmisches Audio zur Vorbereitung auf EMDR.",
                },
                {
                    "title": "Ressourcenprotokoll",
                    "type": "pdf",
                    "description": "Worksheet zur Dokumentation positiver Erfahrungen.",
                },
                {
                    "title": "Butterfly Hug",
                    "type": "video",
                    "description": "Video zeigt den Ablauf der Butterfly-Hug-Technik.",
                },
            ],
        },
        {
            "title": "Arbeit mit Triggern",
            "summary": "Trigger identifizieren und Skills zur Reorientierung.",
            "modules": [
                {
                    "title": "Triggeranalyse",
                    "type": "pdf",
                    "description": "Worksheet zur Analyse von Trigger-Situationen.",
                },
                {
                    "title": "5-4-3-2-1",
                    "type": "audio",
                    "description": "Audio führt durch die 5-4-3-2-1 Orientierungstechnik.",
                },
                {
                    "title": "Triggerprotokoll",
                    "type": "pdf",
                    "description": "Worksheet zum Nachhalten von Auslösern und Reaktionen.",
                },
                {
                    "title": "Erdungsstrategien",
                    "type": "video",
                    "description": "Video demonstriert verschiedene Erdungsübungen.",
                },
            ],
        },
        {
            "title": "Selbstfürsorge nach EMDR",
            "summary": "Nachsorge und Selbstfürsorge planen.",
            "modules": [
                {
                    "title": "Selbstfürsorgeplan",
                    "type": "pdf",
                    "description": "Handout mit Ideen für Nachsorge-Rituale.",
                },
                {
                    "title": "Abschlussritual",
                    "type": "audio",
                    "description": "Audio begleitet durch ein kurzes Abschlussritual.",
                },
                {
                    "title": "Nachsorge-Checkliste",
                    "type": "pdf",
                    "description": "Checklist zur Selbstbeobachtung nach intensiven Sitzungen.",
                },
                {
                    "title": "Yoga Nidra",
                    "type": "video",
                    "description": "Video mit sanfter Yoga-Nidra Sequenz.",
                },
            ],
        },
    ],
}


def slugify(value: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in value)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def wrap_text(text: str, width: int = 90) -> List[str]:
    return textwrap.fill(text, width=width)


def create_pdf(path: Path, title: str, description: str) -> None:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.multi_cell(0, 12, title)
    pdf.ln(5)
    pdf.set_font("Helvetica", size=12)
    paragraphs = description.split("\n")
    for paragraph in paragraphs:
        pdf.multi_cell(0, 8, wrap_text(paragraph))
        pdf.ln(3)
    pdf.output(str(path))


def create_audio(path: Path, title: str, description: str) -> None:
    text = f"{title}. {description}"
    tts = gTTS(text=text, lang="de")
    tts.save(str(path))


def create_video(path: Path, title: str, description: str) -> None:
    width, height = 1280, 720
    background_color = (22, 64, 109)
    image = Image.new("RGB", (width, height), background_color)
    draw = ImageDraw.Draw(image)
    title_font = ImageFont.load_default()
    body_font = ImageFont.load_default()

    title_text = textwrap.fill(title, width=40)
    description_text = textwrap.fill(description, width=60)

    title_w, title_h = draw.multiline_textbbox((0, 0), title_text, font=title_font)[2:]
    desc_w, desc_h = draw.multiline_textbbox((0, 0), description_text, font=body_font)[2:]

    total_height = title_h + 20 + desc_h
    start_y = (height - total_height) // 2
    draw.multiline_text(((width - title_w) / 2, start_y), title_text, fill="white", font=title_font, align="center")
    draw.multiline_text(((width - desc_w) / 2, start_y + title_h + 20), description_text, fill="white", font=body_font, align="center")

    image_path = path.with_suffix(".png")
    image.save(image_path)

    clip = ImageClip(str(image_path)).with_duration(6)
    clip.write_videofile(str(path), fps=1, codec="libx264", audio=False, logger=None)
    image_path.unlink()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def main() -> None:
    metadata = []
    for therapist, programs in THERAPIST_PROGRAMS.items():
        therapist_slug = slugify(therapist)
        therapist_dir = OUTPUT_DIR / therapist_slug
        ensure_dir(therapist_dir)

        therapist_entry = {
            "therapist_type": therapist,
            "slug": therapist_slug,
            "programs": [],
        }
        for program in tqdm(programs, desc=f"{therapist}"):
            program_slug = slugify(program["title"])
            program_dir = therapist_dir / program_slug
            ensure_dir(program_dir)

            task_counters = {media_type: 0 for media_type in TASK_TEMPLATES.keys()}
            generated_tasks = []

            program_entry = {
                "title": program["title"],
                "slug": program_slug,
                "summary": program["summary"],
                "modules": [],
                "tasks": [],
            }

            for index, module in enumerate(program["modules"], start=1):
                module_slug = slugify(module["title"])
                base_filename = f"{index:02d}-{module_slug}"
                if module["type"] == "pdf":
                    file_path = program_dir / f"{base_filename}.pdf"
                    create_pdf(file_path, module["title"], module["description"])
                elif module["type"] == "audio":
                    file_path = program_dir / f"{base_filename}.mp3"
                    create_audio(file_path, module["title"], module["description"])
                elif module["type"] == "video":
                    file_path = program_dir / f"{base_filename}.mp4"
                    create_video(file_path, module["title"], module["description"])
                else:
                    raise ValueError(f"Unbekannter Medientyp: {module['type']}")

                program_entry["modules"].append(
                    {
                        "title": module["title"],
                        "type": module["type"],
                        "description": module["description"],
                        "file": str(file_path.relative_to(BASE_DIR)),
                    }
                )

                template_options = TASK_TEMPLATES.get(module["type"], [])
                if template_options:
                    counter = task_counters[module["type"]]
                    template = template_options[counter % len(template_options)]
                    task_counters[module["type"]] = counter + 1
                    generated_tasks.append(
                        {
                            "title": f"Aufgabe: {module['title']}",
                            "description": template.format(title=module["title"]),
                            "related_module": module_slug,
                        }
                    )

            program_entry["tasks"].extend(generated_tasks)
            therapist_entry["programs"].append(program_entry)
        metadata.append(therapist_entry)

    metadata_path = OUTPUT_DIR / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
