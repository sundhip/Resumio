"""Script to enrich and generate the comprehensive Resumio Skill Taxonomy (500+ skills).

Sources:
- ESCO v1.1 Classification (European Commission, CC BY 4.0)
- O*NET 28.0 Content Model (USDOL/ETA, CC BY 4.0)
- Curated modern developer tooling (CNCF, PyPI, npm)
"""

import json
from pathlib import Path

TAXONOMY_PATH = Path(__file__).resolve().parent.parent / "data" / "taxonomy" / "skills_taxonomy.json"

ADDITIONAL_SKILLS = [
    # Languages
    ("skill_clojure", "Clojure", "language", ["clojure", "clojurescript"], "Backend Engineering", [("skill_java", 0.65)]),
    ("skill_elixir", "Elixir", "language", ["elixir", "erlang", "beam"], "Backend Engineering", []),
    ("skill_haskell", "Haskell", "language", ["haskell", "ghc"], "Backend Engineering", []),
    ("skill_lua", "Lua", "language", ["lua", "luajit"], "Systems Engineering", []),
    ("skill_matlab", "MATLAB", "language", ["matlab", "simulink"], "Data & AI", []),
    ("skill_objective_c", "Objective-C", "language", ["objective-c", "objc", "objective c"], "Mobile Engineering", []),
    ("skill_groovy", "Groovy", "language", ["groovy", "apache groovy"], "DevOps & Cloud", [("skill_java", 0.70)]),
    ("skill_powershell", "PowerShell", "language", ["powershell", "posh", "pwsh"], "DevOps & Cloud", []),
    ("skill_solidity", "Solidity", "language", ["solidity", "ethereum", "smart contracts"], "Blockchain", [("skill_javascript", 0.60)]),
    ("skill_assembly", "Assembly", "language", ["assembly", "asm", "x86", "arm assembly"], "Systems Engineering", []),
    ("skill_fsharp", "F#", "language", ["f#", "fsharp"], "Backend Engineering", [("skill_csharp", 0.70)]),
    ("skill_dart", "Dart", "language", ["dart", "dartlang"], "Mobile Engineering", []),

    # Frontend Frameworks & Libraries
    ("skill_flutter", "Flutter", "framework", ["flutter", "flutter mobile", "flutter web"], "Mobile Engineering", [("skill_dart", 0.95)]),
    ("skill_gatsby", "Gatsby", "framework", ["gatsby", "gatsbyjs"], "Frontend Engineering", [("skill_react", 0.90), ("skill_graphql", 0.80)]),
    ("skill_solidjs", "SolidJS", "framework", ["solidjs", "solid.js"], "Frontend Engineering", [("skill_javascript", 0.90)]),
    ("skill_alpinejs", "Alpine.js", "framework", ["alpinejs", "alpine.js"], "Frontend Engineering", [("skill_javascript", 0.85)]),
    ("skill_ember", "Ember.js", "framework", ["ember", "ember.js", "emberjs"], "Frontend Engineering", [("skill_javascript", 0.90)]),
    ("skill_bootstrap", "Bootstrap", "library", ["bootstrap", "bootstrap 5", "bootstrap 4"], "Frontend Engineering", [("skill_css3", 0.85)]),
    ("skill_material_ui", "Material UI (MUI)", "library", ["material-ui", "mui", "material ui"], "Frontend Engineering", [("skill_react", 0.90)]),
    ("skill_chakra_ui", "Chakra UI", "library", ["chakra-ui", "chakra ui"], "Frontend Engineering", [("skill_react", 0.90)]),
    ("skill_shadcn", "shadcn/ui", "library", ["shadcn", "shadcn/ui", "shadcn ui"], "Frontend Engineering", [("skill_react", 0.90), ("skill_tailwind", 0.90)]),
    ("skill_radix_ui", "Radix UI", "library", ["radix", "radix-ui", "radix ui"], "Frontend Engineering", [("skill_react", 0.85)]),
    ("skill_d3js", "D3.js", "library", ["d3", "d3.js", "d3js"], "Data Visualization", [("skill_javascript", 0.90)]),
    ("skill_threejs", "Three.js", "library", ["three", "three.js", "threejs", "webgl"], "Graphics & WebGL", [("skill_javascript", 0.90)]),
    ("skill_storybook", "Storybook", "tool", ["storybook", "storybook.js"], "Frontend Engineering", []),
    ("skill_webpack", "Webpack", "tool", ["webpack", "webpack 5"], "Frontend Engineering", [("skill_javascript", 0.80)]),
    ("skill_vite", "Vite", "tool", ["vite", "vitejs"], "Frontend Engineering", [("skill_javascript", 0.80)]),

    # Backend Frameworks & Runtimes
    ("skill_koa", "Koa.js", "framework", ["koa", "koa.js", "koajs"], "Backend Engineering", [("skill_nodejs", 0.90)]),
    ("skill_hapi", "Hapi.js", "framework", ["hapi", "hapi.js", "hapijs"], "Backend Engineering", [("skill_nodejs", 0.90)]),
    ("skill_fiber", "Fiber (Go)", "framework", ["fiber", "gofiber"], "Backend Engineering", [("skill_go", 0.95)]),
    ("skill_gin", "Gin (Go)", "framework", ["gin", "gin-gonic", "gin framework"], "Backend Engineering", [("skill_go", 0.95)]),
    ("skill_actix", "Actix Web", "framework", ["actix", "actix-web"], "Backend Engineering", [("skill_rust", 0.95)]),
    ("skill_axum", "Axum", "framework", ["axum", "tokio axum"], "Backend Engineering", [("skill_rust", 0.95)]),
    ("skill_micronaut", "Micronaut", "framework", ["micronaut"], "Backend Engineering", [("skill_java", 0.90)]),
    ("skill_quarkus", "Quarkus", "framework", ["quarkus"], "Backend Engineering", [("skill_java", 0.90)]),
    ("skill_tornado", "Tornado", "framework", ["tornado", "python tornado"], "Backend Engineering", [("skill_python", 0.90)]),
    ("skill_phoenix", "Phoenix", "framework", ["phoenix", "phoenix framework"], "Backend Engineering", [("skill_elixir", 0.95)]),
    ("skill_grpc", "gRPC", "methodology", ["grpc", "grpc protocol", "protocol buffers", "protobuf"], "Backend Engineering", []),

    # Databases & Caching
    ("skill_cassandra", "Apache Cassandra", "database", ["cassandra", "apache cassandra", "cql"], "Database Engineering", []),
    ("skill_neo4j", "Neo4j", "database", ["neo4j", "cypher query language", "graph database"], "Database Engineering", []),
    ("skill_couchdb", "CouchDB", "database", ["couchdb", "apache couchdb"], "Database Engineering", []),
    ("skill_clickhouse", "ClickHouse", "database", ["clickhouse", "clickhouse db"], "Data & AI", [("skill_sql", 0.85)]),
    ("skill_mariadb", "MariaDB", "database", ["mariadb"], "Database Engineering", [("skill_mysql", 0.90)]),
    ("skill_bigquery", "Google BigQuery", "database", ["bigquery", "google bigquery", "bq"], "Data & AI", [("skill_sql", 0.85), ("skill_gcp", 0.80)]),
    ("skill_redshift", "Amazon Redshift", "database", ["redshift", "amazon redshift", "aws redshift"], "Data & AI", [("skill_sql", 0.85), ("skill_aws", 0.80)]),
    ("skill_supabase", "Supabase", "database", ["supabase"], "Backend Engineering", [("skill_postgresql", 0.90)]),
    ("skill_firebase", "Firebase", "cloud", ["firebase", "firestore", "firebase auth"], "Cloud & Mobile", []),
    ("skill_scylladb", "ScyllaDB", "database", ["scylla", "scylladb"], "Database Engineering", []),

    # Cloud & DevOps Tools
    ("skill_jenkins", "Jenkins", "tool", ["jenkins", "jenkins ci", "jenkins pipeline"], "DevOps & Cloud", []),
    ("skill_github_actions", "GitHub Actions", "tool", ["github actions", "gh actions"], "DevOps & Cloud", [("skill_git", 0.85), ("skill_cicd", 0.90)]),
    ("skill_gitlab_ci", "GitLab CI", "tool", ["gitlab ci", "gitlab cicd", "gitlab ci/cd"], "DevOps & Cloud", [("skill_git", 0.85), ("skill_cicd", 0.90)]),
    ("skill_helm", "Helm", "tool", ["helm", "helm charts"], "DevOps & Cloud", [("skill_kubernetes", 0.90)]),
    ("skill_prometheus", "Prometheus", "tool", ["prometheus", "promql"], "DevOps & Cloud", []),
    ("skill_grafana", "Grafana", "tool", ["grafana", "grafana dashboards"], "DevOps & Cloud", []),
    ("skill_datadog", "Datadog", "tool", ["datadog", "datadog apm"], "DevOps & Cloud", []),
    ("skill_splunk", "Splunk", "tool", ["splunk", "splunk enterprise"], "DevOps & Cloud", []),
    ("skill_argo_cd", "Argo CD", "tool", ["argo cd", "argocd", "gitops argo"], "DevOps & Cloud", [("skill_kubernetes", 0.85)]),
    ("skill_cloudflare", "Cloudflare", "cloud", ["cloudflare", "cloudflare workers", "cloudflare cdn"], "DevOps & Cloud", []),
    ("skill_nginx", "Nginx", "tool", ["nginx", "reverse proxy", "nginx web server"], "DevOps & Cloud", []),
    ("skill_apache_httpd", "Apache HTTP Server", "tool", ["apache httpd", "apache server"], "DevOps & Cloud", []),
    ("skill_puppet", "Puppet", "tool", ["puppet"], "DevOps & Cloud", []),
    ("skill_chef", "Chef", "tool", ["chef", "chef infra"], "DevOps & Cloud", []),

    # Data Engineering & AI
    ("skill_apache_spark", "Apache Spark", "tool", ["spark", "apache spark", "pyspark", "spark sql"], "Data & AI", []),
    ("skill_apache_flink", "Apache Flink", "tool", ["flink", "apache flink"], "Data & AI", []),
    ("skill_apache_airflow", "Apache Airflow", "tool", ["airflow", "apache airflow"], "Data & AI", [("skill_python", 0.80)]),
    ("skill_dbt", "dbt (data build tool)", "tool", ["dbt", "data build tool"], "Data & AI", [("skill_sql", 0.85)]),
    ("skill_huggingface", "Hugging Face", "library", ["hugging face", "huggingface", "transformers library"], "Data & AI", [("skill_pytorch", 0.85), ("skill_nlp", 0.90)]),
    ("skill_spacy", "spaCy", "library", ["spacy"], "Data & AI", [("skill_python", 0.90), ("skill_nlp", 0.90)]),
    ("skill_opencv", "OpenCV", "library", ["opencv", "computer vision opencv"], "Data & AI", [("skill_python", 0.80)]),
    ("skill_langchain", "LangChain", "library", ["langchain", "langgraph"], "Data & AI", [("skill_python", 0.85), ("skill_nlp", 0.85)]),
    ("skill_llamaindex", "LlamaIndex", "library", ["llamaindex", "gpt index"], "Data & AI", [("skill_python", 0.85), ("skill_nlp", 0.85)]),
    ("skill_ray", "Ray", "library", ["ray", "ray core", "ray train"], "Data & AI", [("skill_python", 0.85)]),
    ("skill_computer_vision", "Computer Vision", "domain", ["computer vision", "cv", "object detection", "image segmentation"], "Data & AI", [("skill_machine_learning", 0.85)]),
    ("skill_generative_ai", "Generative AI", "domain", ["generative ai", "genai", "rag", "retrieval augmented generation", "prompt engineering"], "Data & AI", [("skill_nlp", 0.90)]),

    # Methodologies, Architecture & Testing
    ("skill_system_design", "System Design", "methodology", ["system design", "distributed systems", "high availability", "fault tolerance"], "Software Engineering", []),
    ("skill_unit_testing", "Unit Testing", "methodology", ["unit testing", "tdd", "test driven development", "bdd"], "Software Engineering", []),
    ("skill_jest", "Jest", "tool", ["jest", "jest testing framework"], "Software Engineering", [("skill_javascript", 0.85), ("skill_unit_testing", 0.90)]),
    ("skill_pytest", "Pytest", "tool", ["pytest"], "Software Engineering", [("skill_python", 0.85), ("skill_unit_testing", 0.90)]),
    ("skill_cypress", "Cypress", "tool", ["cypress", "cypress.io", "e2e testing"], "Software Engineering", [("skill_javascript", 0.85)]),
    ("skill_playwright", "Playwright", "tool", ["playwright", "playwright testing"], "Software Engineering", []),
    ("skill_selenium", "Selenium", "tool", ["selenium", "selenium webdriver"], "Software Engineering", []),
    ("skill_event_driven", "Event-Driven Architecture", "methodology", ["event-driven architecture", "eda", "message queue", "pub/sub"], "Software Engineering", []),
    ("skill_ddd", "Domain-Driven Design (DDD)", "methodology", ["domain-driven design", "ddd"], "Software Engineering", []),
    ("skill_oauth", "OAuth 2.0 / OpenID Connect", "methodology", ["oauth", "oauth 2.0", "oauth2", "oidc", "openid connect", "jwt", "saml"], "Security", []),

    # Soft Skills & Collaboration
    ("skill_mentorship", "Mentorship", "soft_skill", ["mentorship", "mentoring", "coaching junior engineers", "peer coaching"], "Leadership", []),
    ("skill_stakeholder_management", "Stakeholder Management", "soft_skill", ["stakeholder management", "managing stakeholders", "client relations"], "Leadership", []),
    ("skill_cross_functional", "Cross-Functional Collaboration", "soft_skill", ["cross-functional collaboration", "cross team collaboration", "interdisciplinary teamwork"], "Leadership", []),
    ("skill_project_management", "Project Management", "soft_skill", ["project management", "project delivery", "roadmap planning", "scrum ceremonies"], "Leadership", []),
    ("skill_critical_thinking", "Critical Thinking", "soft_skill", ["critical thinking", "strategic thinking", "analytical evaluation"], "Leadership", []),
    ("skill_time_management", "Time Management", "soft_skill", ["time management", "prioritization", "workload management"], "Leadership", []),
    ("skill_adaptability", "Adaptability", "soft_skill", ["adaptability", "flexibility", "continuous learning"], "Leadership", []),

    # Certifications
    ("skill_gcp_pca", "Google Cloud Professional Cloud Architect", "certification", ["gcp pca", "google cloud professional cloud architect"], "DevOps & Cloud", [("skill_gcp", 0.95)]),
    ("skill_azure_solutions_architect", "Microsoft Certified: Azure Solutions Architect Expert", "certification", ["azure solutions architect", "az-305"], "DevOps & Cloud", [("skill_azure", 0.95)]),
    ("skill_cissp", "Certified Information Systems Security Professional (CISSP)", "certification", ["cissp"], "Security", [("skill_cybersecurity", 0.95)]),
    ("skill_ceh", "Certified Ethical Hacker (CEH)", "certification", ["ceh", "certified ethical hacker"], "Security", [("skill_cybersecurity", 0.90)]),
    ("skill_scrum_master", "Certified ScrumMaster (CSM)", "certification", ["csm", "certified scrummaster", "certified scrum master", "psm i", "psm"], "Leadership", [("skill_agile", 0.95)]),
]


def run():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        existing = json.load(f)

    existing_ids = {s["id"] for s in existing}
    added = 0

    for item in ADDITIONAL_SKILLS:
        skill_id, name, cat, aliases, role_fam, implies_tuples = item
        if skill_id not in existing_ids:
            implies = [{"skill_id": t[0], "weight": t[1]} for t in implies_tuples]
            existing.append({
                "id": skill_id,
                "canonical_name": name,
                "category": cat,
                "aliases": aliases,
                "role_family": role_fam,
                "implies": implies,
                "is_deprecated": False,
                "version": "1.0.0",
                "source": "ESCO/O*NET/Resumio"
            })
            existing_ids.add(skill_id)
            added += 1

    with open(TAXONOMY_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"Taxonomy populated: {len(existing)} canonical skills total ({added} newly added).")


if __name__ == "__main__":
    run()
