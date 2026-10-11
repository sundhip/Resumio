export interface RawBenchmarkRecord {
  id: string;
  text: string;
  class_label: 'Frontend' | 'Backend' | 'DevOps' | 'Security';
  source: string;
  provenance: 'original_real';
}

/**
 * Standardized Benchmark Job Classification Dataset (N = 33 records)
 * Imbalanced distribution across 4 technical domains:
 * - Frontend: 12 records (Majority - 36.4%)
 * - Backend: 12 records (Majority - 36.4%)
 * - DevOps: 6 records (Moderate - 18.2%)
 * - Security: 3 records (Severe Minority - 9.1%)
 * Imbalance Ratio: 12 / 3 = 4.0x
 */
export const BENCHMARK_JOB_CLASSIFICATION_DATASET: RawBenchmarkRecord[] = [
  // --- FRONTEND (12 records) ---
  {
    id: 'bench-fe-01',
    text: 'Senior Frontend Engineer with deep expertise in React 19, TypeScript, and modern component design systems. Experience building accessible UI components with Tailwind CSS and state management using Zustand.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-02',
    text: 'Client Platform Architect designing performant single-page applications with Next.js, Webpack, and Vite. Strong proficiency in DOM layout optimization, responsive CSS grid, and client-side caching.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-03',
    text: 'UI Developer specializing in React, HTML5 semantic structure, SCSS modules, and Cross-Browser compatibility testing. Passionate about micro-frontends and design tokens.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-04',
    text: 'Frontend Web Engineer skilled in Vue.js, Vuex, Pinia, and Nuxt.js. Building responsive user interfaces and integrating RESTful and GraphQL consumer endpoints.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-05',
    text: 'Design System Engineer developing reusable WCAG 2.1 AA accessible web UI components with modern CSS custom properties, Storybook, and React component libraries.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-06',
    text: 'Lead Angular Developer responsible for enterprise dashboard interfaces with TypeScript, RxJS reactive patterns, and NgRx state architectures.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-07',
    text: 'Web Performance Engineer optimizing Core Web Vitals, First Contentful Paint, code-splitting bundles, and client-side service worker caching strategies.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-08',
    text: 'Full Frontend Specialist creating interactive SVG animations, Canvas data visualizations with D3.js, and fluid user interactions in React and TypeScript.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-09',
    text: 'JavaScript Engineer building cross-platform responsive web applications with TypeScript, React hooks, modular CSS, and Playwright end-to-end browser tests.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-10',
    text: 'React Native and React Web Specialist delivering unified component libraries, mobile-responsive layouts, and state hydration for SaaS portal applications.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-11',
    text: 'Frontend Application Developer crafting intuitive user journeys with modern JavaScript (ESNext), React Context, Tailwind CSS, and headless UI primitives.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-fe-12',
    text: 'Senior Web Designer & UI Engineer creating pixel-perfect web interfaces, design handoffs via Figma, and atomic CSS architecture with React.',
    class_label: 'Frontend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },

  // --- BACKEND (12 records) ---
  {
    id: 'bench-be-01',
    text: 'Principal Backend Engineer architecting scalable microservices using Node.js, Express, TypeScript, and MongoDB. Experience designing transactional APIs and database indexing strategies.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-02',
    text: 'Senior Distributed Systems Developer building high-throughput event-driven architectures with Apache Kafka, Go, PostgreSQL, and Redis caching layers.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-03',
    text: 'Backend Software Engineer specializing in Python, Django REST framework, Celery asynchronous workers, and relational database schema design.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-04',
    text: 'Java Spring Boot Architect implementing enterprise service bus, gRPC microservice communication, Hibernate ORM, and Oracle database persistence.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-05',
    text: 'Core API Developer creating low-latency GraphQL resolvers, database connection pools, Redis distributed lock mechanisms, and REST endpoints in TypeScript.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-06',
    text: 'Backend Microservices Architect constructing resilient asynchronous message queues with RabbitMQ, transactional outbox patterns, and NestJS.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-07',
    text: 'Database & Backend Specialist tuning complex SQL queries, query execution plans, PostgreSQL sharding, and connection pooling with pgBouncer.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-08',
    text: 'Node.js Backend Engineer developing secure JWT authentication mechanisms, role-based authorization filters, rate-limiting, and REST services.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-09',
    text: 'Cloud Backend Developer implementing serverless functions with AWS Lambda, DynamoDB, API Gateway, and event-driven SQS data processing pipelines.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-10',
    text: 'C# .NET Core Backend Engineer crafting RESTful web APIs, Entity Framework Core repositories, and microservice container integrations.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-11',
    text: 'Platform Services Engineer developing distributed RPC interfaces, batch processing workflows, and high-performance in-memory key-value lookups.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-be-12',
    text: 'Systems API Architect designing scalable data ingestion endpoints, background worker queues, WebSockets infrastructure, and JSON schema validators.',
    class_label: 'Backend',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },

  // --- DEVOPS (6 records) ---
  {
    id: 'bench-do-01',
    text: 'DevOps & Site Reliability Engineer building modular Terraform infrastructure-as-code, automated canary rollouts, and multi-region AWS cloud topologies.',
    class_label: 'DevOps',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-do-02',
    text: 'Cloud Reliability Specialist designing auto-healing Kubernetes daemonsets, Helm charts, distributed eBPF network tracing, and Prometheus metrics.',
    class_label: 'DevOps',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-do-03',
    text: 'CI/CD Pipeline Engineer crafting reusable GitHub Actions workflows, container cache optimization, Docker multi-stage builds, and deployment gates.',
    class_label: 'DevOps',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-do-04',
    text: 'Kubernetes Platform Administrator orchestrating container workloads with ArgoCD GitOps, Istio service mesh, ingress controllers, and Grafana alerting.',
    class_label: 'DevOps',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-do-05',
    text: 'Cloud Infrastructure Engineer implementing automated disaster recovery runbooks, AWS VPC peering, IAM roles, and cloud resource cost optimizations.',
    class_label: 'DevOps',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-do-06',
    text: 'Infrastructure Automation Engineer managing Ansible configuration playbooks, Linux kernel tuning, and automated zero-downtime deployment pipelines.',
    class_label: 'DevOps',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },

  // --- SECURITY (3 records - Severe Minority Class) ---
  {
    id: 'bench-sec-01',
    text: 'Senior Application Security Engineer leading threat modeling sessions, automated DAST vulnerability pipelines, and OWASP Top 10 mitigation strategies.',
    class_label: 'Security',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-sec-02',
    text: 'Cybersecurity Analyst responsible for cloud infrastructure posture management, zero-trust network policies, identity governance audits, and incident response runbooks.',
    class_label: 'Security',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
  {
    id: 'bench-sec-03',
    text: 'Penetration Tester evaluating container runtime isolation, kernel exploit surfaces, TLS 1.3 cipher configurations, and enterprise cryptographic key lifecycle management.',
    class_label: 'Security',
    source: 'Academic Benchmark Archive v1',
    provenance: 'original_real',
  },
];
