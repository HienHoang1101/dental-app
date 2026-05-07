# ML models (download required)

Large model artifacts are not stored in Git. Download them from the team shared drive
and place them under `ml-service/models/`.

Expected layout:

```
ml-service/
└── models/
    ├── svm_pipeline.joblib
    ├── label_map.json
    ├── metrics.json
    └── phobert_best/
        ├── config.json
        ├── model.safetensors
        ├── tokenizer_config.json
        └── ...
```

Notes:
- `svm_pipeline.joblib` is required for the SVM backend.
- `phobert_best/` is only required when `MODEL_BACKEND=phobert`.
- If you do not have access to the shared drive, ask the ML owner for the link.

