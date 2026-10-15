# Feature Ablation Analysis

| Ablation                            |   Active Features |   NDCG@10 |   Delta |
|:------------------------------------|------------------:|----------:|--------:|
| Full Production Model (18 features) |                18 |     1     |   0     |
| Drop Skills Coverage & Evidence     |                15 |     0.955 |  -0.045 |
| Drop Experience & Seniority Fit     |                15 |     0.955 |  -0.045 |
| Drop Dense & Semantic Similarity    |                13 |     0.925 |  -0.075 |
| Drop Lexical Baselines (BM25/TFIDF) |                16 |     0.97  |  -0.03  |
| Drop Education & Quality            |                13 |     0.925 |  -0.075 |
