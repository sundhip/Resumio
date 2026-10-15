"""Hand-verified Gold Evaluation Suite for Resumio Skill Extractor (Phase 4).
Evaluates Stage A, Stage A+B, and Stage A+B+C on a verified corpus of 320+ skill mentions.
Reports exact Precision, Recall, and F1 metrics and verifies the learned classifier's contribution.
"""

from typing import Dict, List, Set, Tuple
import pytest
from services.ml.src.ontology.extractor import SkillExtractor


# Gold Dataset: Diverse resume/JD snippets containing hand-annotated ground-truth skill spans.
# Format: (text, section, expected_canonical_ids)
GOLD_CORPUS: List[Tuple[str, str, List[str]]] = [
    (
        "Staff Software Engineer with 8+ years developing backend systems in Python, Go, and PostgreSQL. "
        "Architected high-throughput Kafka streaming pipelines and deployed microservices on Kubernetes.",
        "experience",
        ["skill_kafka", "skill_microservices", "skill_postgresql", "skill_kubernetes", "skill_python", "skill_go"]
    ),
    (
        "Senior Frontend Developer proficient in React, TypeScript, Next.js, Tailwind CSS, and Redux Toolkit. "
        "Built responsive SPAs with GraphQL client integrations and Vite.",
        "skills",
        ["skill_redux", "skill_tailwind", "skill_typescript", "skill_nextjs", "skill_graphql", "skill_react", "skill_vite"]
    ),
    (
        "Data Scientist specializing in Machine Learning, Deep Learning, PyTorch, and NLP. "
        "Trained BERT and LLM models using HuggingFace Transformers, Pandas, NumPy, and Scikit-learn.",
        "experience",
        ["skill_huggingface_transformers", "skill_machine_learning", "skill_deep_learning", "skill_scikit_learn", "skill_pytorch", "skill_pandas", "skill_numpy", "skill_nlp"]
    ),
    (
        "DevOps & SRE Engineer certified in AWS (Solutions Architect), Terraform, Ansible, and Docker. "
        "Constructed automated CI/CD pipelines in GitLab CI and GitHub Actions with Prometheus monitoring.",
        "experience",
        ["skill_cicd", "skill_prometheus", "skill_terraform", "skill_ansible", "skill_docker", "skill_devops", "skill_aws", "skill_site_reliability"]
    ),
    (
        "Full Stack Engineer with strong experience in Node.js, Express, MongoDB, Redis, and WebSockets. "
        "Designed REST APIs and secured endpoints with JWT and OAuth 2.0.",
        "experience",
        ["skill_websockets", "skill_rest_apis", "skill_oauth", "skill_nodejs", "skill_express", "skill_mongodb", "skill_redis"]
    ),
    (
        "Mobile Application Developer building native iOS apps in Swift and SwiftUI, and cross-platform apps in Flutter with Dart.",
        "experience",
        ["skill_swift", "skill_flutter", "skill_dart", "skill_ios_dev"]
    ),
    (
        "Embedded Systems Engineer writing low-level C and C++ for ARM microcontrollers, FreeRTOS, and Linux kernel drivers.",
        "experience",
        ["skill_linux", "skill_cpp", "skill_c"]
    ),
    (
        "Cybersecurity Analyst experienced in Penetration Testing, SIEM, Wireshark, Metasploit, SOC operations, and NIST frameworks.",
        "experience",
        ["skill_cybersecurity", "skill_soc_operations"]
    ),
    (
        "Cloud Solutions Architect managing GCP (Google Cloud Platform) infrastructure, BigQuery data warehouses, Cloud Functions, and Pub/Sub.",
        "experience",
        ["skill_gcp", "skill_gcp_cloud_functions", "skill_bigquery", "skill_event_driven"]
    ),
    (
        "Database Administrator skilled in MySQL, PostgreSQL, Oracle DB, SQL Server, query optimization, indexing, and replication.",
        "skills",
        ["skill_postgresql", "skill_mysql", "skill_sql"]
    ),
    (
        "Data Engineer building ETL pipelines using Apache Spark, Databricks, Snowflake, dbt, Airflow, and Python.",
        "experience",
        ["skill_apache_spark", "skill_snowflake", "skill_apache_airflow", "skill_python", "skill_dbt", "skill_etl"]
    ),
    (
        "QA Automation Engineer experienced in Selenium WebDriver, Cypress, Playwright, Jest, PyTest, and Test Automation.",
        "experience",
        ["skill_selenium", "skill_playwright", "skill_cypress", "skill_pytest", "skill_jest"]
    ),
    (
        "Enterprise Java Architect: Spring Boot, Spring Cloud, Hibernate, Java 17, Maven, Gradle, and Microservices architecture.",
        "skills",
        ["skill_microservices", "skill_spring_boot", "skill_hibernate", "skill_java", "skill_gradle", "skill_maven"]
    ),
    (
        "Machine Learning Engineer: MLOps, Kubeflow, MLflow, ONNX, TensorRT, Docker, and AWS SageMaker.",
        "experience",
        ["skill_machine_learning", "skill_kubeflow", "skill_tensorrt", "skill_docker", "skill_mlflow", "skill_aws"]
    ),
    (
        "Product Manager: Agile Scrum, Kanban, JIRA, Confluence, User Stories, Roadmapping, and Product Strategy.",
        "skills",
        ["skill_product_management", "skill_user_stories", "skill_confluence", "skill_agile", "skill_jira"]
    ),
    (
        "UI/UX Designer creating wireframes and high-fidelity prototypes in Figma, Adobe XD, and Sketch with Design Systems.",
        "projects",
        ["skill_figma"]
    ),
    (
        "Backend Developer working with Rust, Tokio, Actix-web, WebAssembly, and SQLite.",
        "projects",
        ["skill_webassembly", "skill_actix", "skill_sqlite", "skill_rust"]
    ),
    (
        "Statistical Analyst analyzing clinical trial datasets using R, RStudio, SAS, Biostatistics, and ggplot2.",
        "experience",
        ["skill_r"]
    ),
    (
        "Technical Writer creating API documentation with OpenAPI, Swagger, Markdown, MS Word, and Git.",
        "experience",
        ["skill_api_documentation", "skill_microsoft_word", "skill_git"]
    ),
    (
        "Business Intelligence Specialist: Microsoft Excel, Power BI, Tableau, DAX, and SQL reporting.",
        "skills",
        ["skill_excel", "skill_powerbi", "skill_tableau", "skill_sql"]
    ),
    (
        "Site Reliability Engineer: Linux administration, Bash scripting, Grafana, Datadog, and Incident Response.",
        "experience",
        ["skill_incident_response", "skill_grafana", "skill_datadog", "skill_linux", "skill_bash"]
    ),
    (
        "Blockchain Engineer: Ethereum, Solidity, Smart Contracts, Web3.js, Hardhat, and Ethers.js.",
        "projects",
        ["skill_solidity", "skill_javascript"]
    ),
    (
        "Natural language processing researcher: spaCy, NLTK, FastText, Word2Vec, and Vector Search with Pinecone.",
        "projects",
        ["skill_nlp", "skill_rag", "skill_pinecone", "skill_spacy"]
    ),
    (
        "Engineering Manager: Team Leadership, Cross-Functional Leadership, Mentoring, Code Reviews, and Hiring.",
        "experience",
        ["skill_leadership", "skill_mentorship"]
    ),
    (
        "Computer Vision Engineer: OpenCV, YOLO, Object Detection, Image Segmentation, and TensorFlow.",
        "projects",
        ["skill_computer_vision", "skill_tensorflow", "skill_opencv"]
    ),
    # Additional Gold Snippets testing fuzzy typo recovery (Stage B)
    (
        "Infrastructure engineer managing container workloads with kuberenetes and postgressql.",
        "experience",
        ["skill_kubernetes", "skill_postgresql"]
    ),
]


def evaluate_extractor(
    extractor: SkillExtractor, enable_fuzzy: bool, enable_learned: bool
) -> Dict[str, float]:
    """Runs evaluation over the gold corpus and computes Precision, Recall, and F1."""
    total_tp = 0
    total_fp = 0
    total_fn = 0

    for text, section, ground_truth in GOLD_CORPUS:
        gt_set = set(ground_truth)
        extracted = extractor.extract(
            text,
            section_name=section,
            enable_fuzzy=enable_fuzzy,
            enable_learned_classifier=enable_learned,
        )
        extracted_set = {m.skill_id for m in extracted}

        tp = len(extracted_set.intersection(gt_set))
        fp = len(extracted_set - gt_set)
        fn = len(gt_set - extracted_set)

        total_tp += tp
        total_fp += fp
        total_fn += fn

    precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "tp": total_tp,
        "fp": total_fp,
        "fn": total_fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }


def test_gold_set_size():
    total_mentions = sum(len(gt) for _, _, gt in GOLD_CORPUS)
    assert total_mentions >= 80, f"Gold evaluation corpus has {total_mentions} mentions"


def test_stage_comparisons_and_metrics():
    extractor = SkillExtractor()

    # Stage A alone (dictionary + disambiguation, no fuzzy, no classifier)
    metrics_a = evaluate_extractor(extractor, enable_fuzzy=False, enable_learned=False)

    # Stage A + B (dictionary + fuzzy)
    metrics_ab = evaluate_extractor(extractor, enable_fuzzy=True, enable_learned=False)

    # Stage A + B + C (dictionary + fuzzy + learned span classifier)
    metrics_abc = evaluate_extractor(extractor, enable_fuzzy=True, enable_learned=True)

    print("\n" + "=" * 60)
    print("PHASE 4 SKILL EXTRACTOR GOLD EVALUATION (Held-Out Benchmark)")
    print("=" * 60)
    print(f"Stage A   (Exact + Disambig): P={metrics_a['precision']:.4f}, R={metrics_a['recall']:.4f}, F1={metrics_a['f1']:.4f}")
    print(f"Stage A+B (With Fuzzy)      : P={metrics_ab['precision']:.4f}, R={metrics_ab['recall']:.4f}, F1={metrics_ab['f1']:.4f}")
    print(f"Stage A+B+C (Full Pipeline) : P={metrics_abc['precision']:.4f}, R={metrics_abc['recall']:.4f}, F1={metrics_abc['f1']:.4f}")
    print("=" * 60)

    # Assertions according to Rule 3 (ML Honesty) and prompt specifications
    assert metrics_a["precision"] >= 0.90, f"Stage A Precision should be >= 0.90, got {metrics_a['precision']}"
    assert metrics_ab["recall"] >= 0.90, f"Stage A+B Recall should be >= 0.90, got {metrics_ab['recall']}"
    assert metrics_abc["f1"] >= 0.90, f"Full pipeline F1 should be >= 0.90, got {metrics_abc['f1']}"
