# 🏛️ ScaleFlow - Cambridge Mock Exam Platform Specifications

## 1. Project Vision
A mobile-first Cambridge Mock Exam Management Platform designed for language schools and educational institutions to eliminate the friction of fragmented legacy grading systems (such as disjointed spreadsheets, paperwork, and scattered cloud folders).

**The Ultimate Value Proposition:** Grade students rapidly through an intuitive interface, enjoy the seamlessness of asynchronous evaluation with minimal coordination overhead, and save data to your institution's preferred platform or destination with a single click.

---

## 2. Core Workflows

### A. Pre-Exam (Administration & Coordination)
- The coordinator/admin creates a new exam session in the system (e.g., *FCE Mock - June 2026*).
- Student names and designated Exam Rooms (if possible) are assigned.
- The system automatically generates professional, school-branded **"Classroom Door Lists"** as PDF printouts.

### B. Exam Day (Asynchronous Grading Flow)
- **Phase 1 (Writing Script Capture):** Immediately after the writing exam, the invigilator/proctor uses their phone to photograph the student's Writing paper and uploads it directly to the student's profile. Physical papers are digitally secured instantly.
- **Phase 2 (Fractional Data Entry):** Different teachers can log into the platform independently to grade different sections (Reading, Use of English, Listening, Writing, Speaking) at their own pace.
- **Autosave Engine:** Every score entered is immediately saved to the secure database in real-time, preventing any data overwrites or concurrency conflicts between evaluators.

### C. Post-Exam (Reporting & Delivery)
- Once all sections for a student are graded, their status automatically switches to **🟢 Ready for Report**.
- The student's class teacher clicks the **"Export/Report"** button to perform two seamless actions:
  1. Copies a clean, pre-formatted text template directly to the clipboard, ready to be pasted instantly into the school's external Student Management System (SMS / LMS) or target data destination.
  2. Downloads a clean, school-branded Cambridge Progress Report PDF for parents and stakeholders.

---

## 3. Technical Architecture (Lightweight Stack)
- **Frontend:** React / Next.js with Tailwind CSS (Responsive, mobile-first, and clean UI).
- **Backend & Database:** Supabase (PostgreSQL).
- **Data Flexibility:** Exam raw scores will be stored inside a dynamic `jsonb` column. Cambridge Scale Score conversions will be calculated instantly on the client-side via static configuration matrices (zero-latency).

---

## 4. UI/UX Guidelines
- **Modular Layout:** Teachers toggle specific sections at the top to dynamically filter and render only the input containers they need.
- **Sticky Summary Bar:** A persistent bottom bar on mobile screens displaying real-time calculated Scale Scores, CEFR levels, and Grades as the teacher inputs data.
- **Mobile-Friendly Inputs:** Large click/tap targets and numeric keypad triggers instead of tedious legacy dropdown menus.

---

## 5. Future Roadmap (Post-MVP Vision)
- **ScaleFlow AI Engine:** - Integrate Vision-to-Text (OCR) to convert captured Writing scripts into digital text.
  - Implement an LLM evaluation layer to provide teachers with preliminary scores and automated feedback based on official Cambridge rubrics (Content, Language, Organisation).
- **Institutional Scale (LMS/SMS Modules):**
  - Expand into a comprehensive student and exam management system.
  - Analytics dashboards to track year-over-year institutional progress and student cohort insights.