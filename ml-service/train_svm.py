"""
Train a fast SVM baseline for multi-label dental symptom classification.

Expected dataset format:
  text,symptoms
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.svm import LinearSVC


ALLOWED_LABELS = [
    "dau_rang",
    "e_buot",
    "sung_nuou",
    "chay_mau_nuou",
    "hoi_mieng",
    "rang_lung_lay",
    "sau_rang_nhin_thay",
    "dau_khi_nhai",
    "nhuc_rang_dem",
    "nuou_tut",
    "rang_khon_dau",
    "sung_ma",
    "khan_ham",
    "rang_gay",
    "rang_doi_mau",
]


def parse_symptoms(value: str) -> list[str]:
    labels = []
    for raw_label in str(value).split(","):
        label = raw_label.strip()
        if label and label not in labels:
            labels.append(label)
    return labels


def load_dataset(path: Path) -> tuple[list[str], list[list[str]], list[str] | None]:
    df = pd.read_csv(path)
    required_columns = {"text", "symptoms"}
    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(
            f"Dataset must contain columns {sorted(required_columns)}. "
            f"Missing: {sorted(missing)}. Current columns: {list(df.columns)}"
        )

    df = df.dropna(subset=["text", "symptoms"]).copy()
    df["text"] = df["text"].astype(str).str.strip()
    df["label_list"] = df["symptoms"].apply(parse_symptoms)
    df = df[df["text"].ne("") & df["label_list"].map(bool)]

    invalid_labels = sorted({
        label
        for labels in df["label_list"]
        for label in labels
        if label not in ALLOWED_LABELS
    })
    if invalid_labels:
        raise ValueError(f"Dataset contains labels outside allowed set: {invalid_labels}")

    groups = df["group"].astype(str).tolist() if "group" in df.columns else None
    return df["text"].tolist(), df["label_list"].tolist(), groups


def split_dataset(texts, y, groups, test_size: float, seed: int, split_mode: str):
    if split_mode == "group":
        if groups is None:
            raise ValueError("Group split requires a 'group' column in the dataset CSV.")
        splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
        train_idx, test_idx = next(splitter.split(texts, y, groups=groups))
        texts_array = pd.Series(texts)
        return texts_array.iloc[train_idx].tolist(), texts_array.iloc[test_idx].tolist(), y[train_idx], y[test_idx]

    return train_test_split(
        texts,
        y,
        test_size=test_size,
        random_state=seed,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train SVM multi-label symptom baseline")
    parser.add_argument("--data", default="dental_dataset.csv", help="CSV with text,symptoms columns")
    parser.add_argument("--save-dir", default="models/svm_multilabel", help="Output model directory")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--split-mode", choices=["random", "group"], default="random")
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    texts, labels, groups = load_dataset(Path(args.data))

    mlb = MultiLabelBinarizer(classes=ALLOWED_LABELS)
    y = mlb.fit_transform(labels)

    print(f"Labels: {list(mlb.classes_)}")
    print(f"Samples: {len(texts)}, num_labels: {len(mlb.classes_)}")

    X_train, X_test, y_train, y_test = split_dataset(
        texts,
        y,
        groups,
        test_size=args.test_size,
        seed=args.seed,
        split_mode=args.split_mode,
    )
    print(f"Split mode: {args.split_mode}")

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            min_df=2,
            max_features=50000,
        )),
        ("clf", OneVsRestClassifier(LinearSVC(class_weight="balanced"))),
    ])

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)

    print("\n=== CLASSIFICATION REPORT ===")
    print(classification_report(
        y_test,
        preds,
        target_names=mlb.classes_,
        zero_division=0,
    ))

    macro_f1 = f1_score(y_test, preds, average="macro", zero_division=0)
    micro_f1 = f1_score(y_test, preds, average="micro", zero_division=0)
    print(f"Macro F1-score: {macro_f1:.4f}")
    print(f"Micro F1-score: {micro_f1:.4f}")

    save_dir = Path(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, save_dir / "svm_pipeline.joblib")
    joblib.dump(mlb, save_dir / "mlb.joblib")

    with (save_dir / "config.json").open("w", encoding="utf-8") as file:
        json.dump({
            "labels": list(mlb.classes_),
            "macro_f1": macro_f1,
            "micro_f1": micro_f1,
        }, file, ensure_ascii=False, indent=2)

    print(f"\nModel saved to {save_dir}")


if __name__ == "__main__":
    main()
