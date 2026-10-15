"""Golden Corpus Evaluation and Performance Benchmark for Resumio Phase 3.

Evaluates 60 diverse resume documents spanning:
- Single-column standard layouts (10)
- Two-column / sidebar layouts (10)
- LaTeX academic & technical resumes with ligatures & hyphenation (10)
- DOCX / Word export documents (10)
- Table-based structured resumes (10)
- Scanned / image simulated documents (5)
- Adversarial / ATS-gaming resumes with hidden text and keyword spam (5)

Measures and asserts:
- Field-level Precision, Recall, and F1 for Contact, Skills, and Experience
- Performance benchmark: Digital PDF/DOCX p95 latency < 3.0s
- Zero pipeline crashes across all 60 documents
"""

import io
import time
import zipfile
import fitz
import numpy as np
import pytest

from src.parser.pipeline import parse_resume_document
from src.parser.schema import ResumeDocument


def generate_single_column_pdf(name: str, email: str, phone: str, skills: list, role: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    y = 50
    page.insert_text((50, y), f"{name}", fontsize=18)
    y += 24
    page.insert_text((50, y), f"Email: {email} | Phone: {phone} | Location: San Francisco, CA", fontsize=10)
    y += 30
    page.insert_text((50, y), "Professional Summary", fontsize=14)
    y += 18
    page.insert_text((50, y), "Experienced engineer with a track record of delivering scalable web platforms.", fontsize=10)
    y += 30
    page.insert_text((50, y), "Work Experience", fontsize=14)
    y += 18
    page.insert_text((50, y), f"{role} at CloudCorp (2020 - Present)", fontsize=11)
    y += 16
    page.insert_text((50, y), "Architected distributed streaming services with Kafka and Go.", fontsize=10)
    y += 30
    page.insert_text((50, y), "Education", fontsize=14)
    y += 18
    page.insert_text((50, y), "Bachelor of Science in Computer Science, UC Berkeley (2016 - 2020)", fontsize=10)
    y += 30
    page.insert_text((50, y), "Technical Skills", fontsize=14)
    y += 18
    page.insert_text((50, y), f"Languages & Frameworks: {', '.join(skills)}", fontsize=10)
    
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def generate_two_column_pdf(name: str, email: str, phone: str, skills: list, role: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    # Left column: Contact & Skills (x: 40 to 220)
    page.insert_text((40, 60), name, fontsize=16)
    page.insert_text((40, 85), f"Email: {email}", fontsize=9)
    page.insert_text((40, 105), f"Tel: {phone}", fontsize=9)
    page.insert_text((40, 140), "Core Skills", fontsize=12)
    for i, s in enumerate(skills[:6]):
        page.insert_text((40, 165 + i * 18), f"• {s}", fontsize=9)
    page.insert_text((40, 300), "Education", fontsize=12)
    page.insert_text((40, 325), "BS Computer Science", fontsize=9)
    page.insert_text((40, 345), "MIT, 2018", fontsize=9)

    # Right column: Experience & Summary (x: 240 to 560)
    page.insert_text((240, 60), "Professional Profile", fontsize=13)
    page.insert_text((240, 85), "Dedicated software developer specializing in backend cloud infrastructure.", fontsize=10)
    page.insert_text((240, 125), "Work Experience", fontsize=13)
    page.insert_text((240, 150), f"{role} at NextGen Systems (2019 - Present)", fontsize=11)
    page.insert_text((240, 172), "Engineered high-throughput event processing pipelines with 99.99% uptime.", fontsize=9)
    page.insert_text((240, 210), f"Software Developer at EarlyStage Inc (2017 - 2019)", fontsize=11)
    page.insert_text((240, 232), "Developed RESTful APIs and optimized SQL database queries.", fontsize=9)

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def generate_latex_pdf(name: str, email: str, phone: str, skills: list, role: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    y = 60
    # Include LaTeX ligatures fi, fl, ffi in text
    page.insert_text((50, y), f"Curriculum Vitae: {name}", fontsize=16)
    y += 24
    page.insert_text((50, y), f"E-mail: {email} | Mobile: {phone}", fontsize=10)
    y += 30
    page.insert_text((50, y), "Work Experience", fontsize=13)
    y += 18
    page.insert_text((50, y), f"{role} -- High-Performance Computing Lab (2021 - Present)", fontsize=11)
    y += 16
    # Insert ligature and hyphenated break
    page.insert_text((50, y), "Managed o\ufb03ce sta\ufb00 and built a scalable distri-", fontsize=10)
    y += 14
    page.insert_text((50, y), "buted platform with pro\ufb01cient throughput.", fontsize=10)
    y += 28
    page.insert_text((50, y), "Education", fontsize=13)
    y += 18
    page.insert_text((50, y), "Ph.D. in Computer Engineering, Carnegie Mellon University (2017 - 2021)", fontsize=10)
    y += 28
    page.insert_text((50, y), "Technical Skills", fontsize=13)
    y += 18
    page.insert_text((50, y), f"Specialties: {', '.join(skills)}", fontsize=10)

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def generate_docx_document(name: str, email: str, phone: str, skills: list, role: str) -> bytes:
    import docx
    doc = docx.Document()
    doc.add_heading(name, level=0)
    doc.add_paragraph(f"Email: {email} | Phone: {phone}")
    doc.add_heading("Experience", level=1)
    doc.add_paragraph(f"{role} at Enterprise Corp (2018 - 2023)")
    doc.add_heading("Education", level=1)
    doc.add_paragraph("Bachelor of Science, Georgia Tech (2014 - 2018)")
    doc.add_heading("Skills", level=1)
    doc.add_paragraph(", ".join(skills))
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def generate_table_pdf(name: str, email: str, phone: str, skills: list, role: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    # Header
    page.insert_text((50, 50), name, fontsize=16)
    page.insert_text((50, 75), f"{email} | {phone}", fontsize=10)
    page.insert_text((50, 110), "Experience", fontsize=14)
    # Draw table bounding boxes
    rect = fitz.Rect(50, 130, 545, 230)
    page.draw_rect(rect, color=(0.8, 0.8, 0.8), width=1)
    page.insert_text((60, 155), f"Position: {role} (2019 - Present)", fontsize=11)
    page.insert_text((60, 180), "Company: Global FinTech Services", fontsize=10)
    page.insert_text((60, 205), "Responsibilities: Optimized transaction processing speed by 40%.", fontsize=10)

    page.insert_text((50, 260), "Education", fontsize=14)
    page.insert_text((50, 285), "MS Software Engineering, University of Washington (2017 - 2019)", fontsize=10)

    page.insert_text((50, 320), "Skills", fontsize=14)
    page.insert_text((50, 345), f"Core Stack: {', '.join(skills)}", fontsize=10)

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def generate_scanned_pdf(name: str, email: str, role: str) -> bytes:
    """Simulates a scanned resume containing only raster image content (no digital text layer)."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    # Minimal text marker or pure image
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 400, 300), 1)
    pix.clear_with(245)
    page.insert_image(fitz.Rect(50, 50, 450, 350), pixmap=pix)
    
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def generate_adversarial_pdf(name: str, email: str, phone: str, role: str) -> bytes:
    """Simulates an ATS gaming resume with white-on-white text and micro fonts."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 60), name, fontsize=16)
    page.insert_text((50, 85), f"{email} | {phone}", fontsize=10)
    page.insert_text((50, 120), "Experience", fontsize=13)
    page.insert_text((50, 145), f"{role} at TargetCorp (2020 - Present)", fontsize=11)
    page.insert_text((50, 190), "Education", fontsize=13)
    page.insert_text((50, 215), "BS Computer Science (2016 - 2020)", fontsize=10)
    page.insert_text((50, 250), "Skills", fontsize=13)
    page.insert_text((50, 275), "Python, TypeScript, React", fontsize=10)

    # Injected micro-font keyword block (< 3pt)
    page.insert_text((50, 750), "aws gcp azure kubernetes docker terraform rust golang c++ java python", fontsize=2.0)

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def build_golden_corpus():
    """Constructs 60 labeled resume test cases."""
    corpus = []
    
    # 1. Single-column PDFs (10)
    for i in range(10):
        corpus.append({
            "id": f"sc_pdf_{i}",
            "type": "single_column_pdf",
            "name": f"Candidate SC {i}",
            "email": f"candidate.sc{i}@example.com",
            "phone": f"+1 555-01{i:02d}",
            "skills": ["Python", "TypeScript", "React", "PostgreSQL", "Docker"],
            "role": "Senior Full-Stack Engineer",
            "bytes": generate_single_column_pdf(f"Candidate SC {i}", f"candidate.sc{i}@example.com", f"+1 555-01{i:02d}", ["Python", "TypeScript", "React", "PostgreSQL", "Docker"], "Senior Full-Stack Engineer"),
            "file_name": f"resume_sc_{i}.pdf",
        })

    # 2. Two-column PDFs (10)
    for i in range(10):
        corpus.append({
            "id": f"tc_pdf_{i}",
            "type": "two_column_pdf",
            "name": f"Candidate TC {i}",
            "email": f"candidate.tc{i}@example.com",
            "phone": f"+1 555-02{i:02d}",
            "skills": ["Go", "Kubernetes", "AWS", "gRPC", "Redis"],
            "role": "Lead Infrastructure Engineer",
            "bytes": generate_two_column_pdf(f"Candidate TC {i}", f"candidate.tc{i}@example.com", f"+1 555-02{i:02d}", ["Go", "Kubernetes", "AWS", "gRPC", "Redis"], "Lead Infrastructure Engineer"),
            "file_name": f"resume_tc_{i}.pdf",
        })

    # 3. LaTeX PDFs (10)
    for i in range(10):
        corpus.append({
            "id": f"latex_pdf_{i}",
            "type": "latex_pdf",
            "name": f"Scholar {i}",
            "email": f"researcher{i}@university.edu",
            "phone": f"+1 555-03{i:02d}",
            "skills": ["PyTorch", "Python", "C++", "CUDA", "Linux"],
            "role": "Machine Learning Research Scientist",
            "bytes": generate_latex_pdf(f"Scholar {i}", f"researcher{i}@university.edu", f"+1 555-03{i:02d}", ["PyTorch", "Python", "C++", "CUDA", "Linux"], "Machine Learning Research Scientist"),
            "file_name": f"resume_latex_{i}.pdf",
        })

    # 4. DOCX Documents (10)
    for i in range(10):
        corpus.append({
            "id": f"docx_{i}",
            "type": "docx",
            "name": f"Candidate Word {i}",
            "email": f"word.user{i}@corporate.com",
            "phone": f"+1 555-04{i:02d}",
            "skills": ["Java", "Spring Boot", "Oracle", "Kafka", "Microservices"],
            "role": "Principal Backend Architect",
            "bytes": generate_docx_document(f"Candidate Word {i}", f"word.user{i}@corporate.com", f"+1 555-04{i:02d}", ["Java", "Spring Boot", "Oracle", "Kafka", "Microservices"], "Principal Backend Architect"),
            "file_name": f"resume_word_{i}.docx",
        })

    # 5. Table PDFs (10)
    for i in range(10):
        corpus.append({
            "id": f"table_{i}",
            "type": "table_pdf",
            "name": f"Candidate Table {i}",
            "email": f"table.eng{i}@fintech.com",
            "phone": f"+1 555-05{i:02d}",
            "skills": ["Node.js", "Express", "MongoDB", "Jest", "TypeScript"],
            "role": "Staff Software Engineer",
            "bytes": generate_table_pdf(f"Candidate Table {i}", f"table.eng{i}@fintech.com", f"+1 555-05{i:02d}", ["Node.js", "Express", "MongoDB", "Jest", "TypeScript"], "Staff Software Engineer"),
            "file_name": f"resume_table_{i}.pdf",
        })

    # 6. Scanned PDFs (5)
    for i in range(5):
        corpus.append({
            "id": f"scan_{i}",
            "type": "scanned_pdf",
            "name": f"Scanned Candidate {i}",
            "email": f"scan{i}@paper.com",
            "phone": "",
            "skills": [],
            "role": "General Worker",
            "bytes": generate_scanned_pdf(f"Scanned Candidate {i}", f"scan{i}@paper.com", "General Worker"),
            "file_name": f"resume_scanned_{i}.pdf",
        })

    # 7. Adversarial PDFs (5)
    for i in range(5):
        corpus.append({
            "id": f"adv_{i}",
            "type": "adversarial_pdf",
            "name": f"Adversarial Candidate {i}",
            "email": f"spammer{i}@shady.net",
            "phone": f"+1 555-07{i:02d}",
            "skills": ["Python", "TypeScript", "React"],
            "role": "Lead Developer",
            "bytes": generate_adversarial_pdf(f"Adversarial Candidate {i}", f"spammer{i}@shady.net", f"+1 555-07{i:02d}", "Lead Developer"),
            "file_name": f"resume_adv_{i}.pdf",
        })

    return corpus


class TestGoldenCorpusEvaluation:
    def test_run_full_evaluation_and_benchmark(self):
        corpus = build_golden_corpus()
        assert len(corpus) == 60, "Golden corpus must contain exactly 60 documents."

        latencies = []
        email_tp, email_fp, email_fn = 0, 0, 0
        phone_tp, phone_fp, phone_fn = 0, 0, 0
        skills_tp, skills_fp, skills_fn = 0, 0, 0
        experience_tp, experience_fn = 0, 0

        scanned_count = 0
        adversarial_flagged = 0

        for item in corpus:
            t0 = time.perf_counter()
            doc = parse_resume_document(file_bytes=item["bytes"], file_name=item["file_name"])
            elapsed_sec = time.perf_counter() - t0
            latencies.append(elapsed_sec)

            # Contact Evaluation
            expected_email = item.get("email")
            extracted_email = doc.contact.email
            if expected_email:
                if extracted_email and extracted_email.lower() == expected_email.lower():
                    email_tp += 1
                elif extracted_email:
                    email_fp += 1
                else:
                    email_fn += 1

            expected_phone = item.get("phone")
            extracted_phone = doc.contact.phone
            if expected_phone:
                if extracted_phone:
                    phone_tp += 1
                else:
                    phone_fn += 1

            # Skills Evaluation
            expected_skills = set(s.lower() for s in item.get("skills", []))
            extracted_skills = set(s.name.lower() for s in doc.skills)
            if expected_skills:
                matched = expected_skills.intersection(extracted_skills)
                skills_tp += len(matched)
                skills_fp += len(extracted_skills - expected_skills)
                skills_fn += len(expected_skills - extracted_skills)

            # Experience Evaluation
            if item.get("role"):
                if len(doc.experience) > 0 or "experience" in doc.sections_detected:
                    experience_tp += 1
                else:
                    experience_fn += 1

            if item["type"] == "scanned_pdf":
                if doc.ats_report.is_scanned_or_image:
                    scanned_count += 1

            if item["type"] == "adversarial_pdf":
                if doc.ats_report.has_hidden_text:
                    adversarial_flagged += 1

        # Calculate metrics
        email_prec = email_tp / max(1, email_tp + email_fp)
        email_rec = email_tp / max(1, email_tp + email_fn)
        email_f1 = 2 * (email_prec * email_rec) / max(1e-6, email_prec + email_rec)

        phone_rec = phone_tp / max(1, phone_tp + phone_fn)

        skills_prec = skills_tp / max(1, skills_tp + skills_fp)
        skills_rec = skills_tp / max(1, skills_tp + skills_fn)
        skills_f1 = 2 * (skills_prec * skills_rec) / max(1e-6, skills_prec + skills_rec)

        exp_rec = experience_tp / max(1, experience_tp + experience_fn)

        p50 = float(np.percentile(latencies, 50))
        p90 = float(np.percentile(latencies, 90))
        p95 = float(np.percentile(latencies, 95))
        mean_lat = float(np.mean(latencies))

        print("\n=======================================================")
        print("  RESUMIO PHASE 3 - GOLDEN CORPUS EVALUATION RESULTS")
        print("=======================================================")
        print(f"Total Evaluated Documents: {len(corpus)}")
        print(f"Email Extraction:     Precision={email_prec:.3f}, Recall={email_rec:.3f}, F1={email_f1:.3f}")
        print(f"Phone Extraction:     Recall={phone_rec:.3f}")
        print(f"Skills Extraction:    Precision={skills_prec:.3f}, Recall={skills_rec:.3f}, F1={skills_f1:.3f}")
        print(f"Experience Detection: Recall={exp_rec:.3f}")
        print(f"Scanned PDFs Detected: {scanned_count}/5")
        print(f"Adversarial Micro-font Flagged: {adversarial_flagged}/5")
        print("-------------------------------------------------------")
        print(f"Latency (p50): {p50*1000:.1f} ms")
        print(f"Latency (p90): {p90*1000:.1f} ms")
        print(f"Latency (p95): {p95*1000:.1f} ms (Target: < 3000 ms)")
        print(f"Latency (mean): {mean_lat*1000:.1f} ms")
        print("=======================================================\n")

        # Assertions
        assert email_f1 >= 0.85, f"Email F1 ({email_f1:.2f}) below 0.85 threshold"
        assert skills_f1 >= 0.70, f"Skills F1 ({skills_f1:.2f}) below 0.70 threshold"
        assert exp_rec >= 0.85, f"Experience recall ({exp_rec:.2f}) below 0.85 threshold"
        assert p95 < 3.0, f"p95 latency ({p95:.2f}s) exceeded 3.0s SLA target"
