# References & Research Bibliographic Details

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Document:** Academic Project Documentation & Reference Citations  

---

## 1. Primary Research Paper Reference

The experimental methodology for Resumio's research data augmentation pipeline was inspired by the following peer-reviewed publication:

```bibtex
@article{fawaz2024llm,
  title={LLM-based data augmentation for text classification on imbalanced datasets: A case study on fake news detection},
  author={Fawaz, M. and others},
  journal={Expert Systems with Applications},
  year={2024},
  publisher={Elsevier},
  note={Methodological inspiration for imbalanced text classification, stratified splitting, and synthetic data quality filtering adapted to the recruitment domain in Resumio.}
}
```

*Note on Academic Scope:* The paper above investigated data augmentation techniques using Large Language Models to counter class imbalance specifically in **fake news detection**. In Resumio, the *methodology* (stratified splitting, controlled synthetic text generation, near-duplicate rejection filtering, and macro-F1 evaluation) is adapted as an empirical inquiry into **recruitment job posting classification** and **candidate-job ranking evaluation**. Resumio does not claim that the cited paper studied recruitment.

---

## 2. Technical Documentation & Framework Citations

1. **React Documentation:**
   - Facebook Open Source. (2024). *React: A JavaScript library for building user interfaces (Version 19)*. Available at: https://react.dev/
2. **TypeScript Language Specification:**
   - Microsoft Corporation. (2024). *TypeScript: Typed JavaScript at Any Scale*. Available at: https://www.typescriptlang.org/
3. **MongoDB Atlas & Mongoose:**
   - MongoDB, Inc. (2024). *MongoDB Atlas Database Documentation & Mongoose ODM Reference*. Available at: https://www.mongodb.com/docs/
4. **SQLite Architecture & PRAGMA Specification:**
   - Hipp, D. R. (2024). *SQLite Database Engine Documentation & Foreign Key Constraint Support*. Available at: https://www.sqlite.org/
5. **JSON Web Token (JWT) Standard:**
   - Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT) - RFC 7519*. Internet Engineering Task Force (IETF). Available at: https://tools.ietf.org/html/rfc7519
6. **Password Hashing with Bcrypt:**
   - Provos, N., & Mazières, D. (1999). *A Future-Adaptable Password Scheme*. Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference.
7. **Information Retrieval & Ranking Metrics (MRR & NDCG):**
   - Järvelin, K., & Kekäläinen, J. (2002). *Cumulated gain-based evaluation of IR techniques*. ACM Transactions on Information Systems (TOIS), 20(4), 422-446.
   - Manning, C. D., Raghavan, P., & Schütze, H. (2008). *Introduction to Information Retrieval*. Cambridge University Press.
8. **OWASP Top Ten Security & Injection Defense:**
   - OWASP Foundation. (2021). *OWASP Top 10:2021 Web Application Security Risks (A01: Broken Access Control, A03: Injection)*. Available at: https://owasp.org/Top10/
