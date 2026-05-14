"""
Fine-tune PhoBERT for multi-label dental symptom classification.

Expected dataset format:
  text,symptoms
  răng tôi bị ê buốt khi uống nước lạnh,e_buot
  nướu sưng đỏ và hay chảy máu,sung_nuou,chay_mau_nuou

Output:
  models/phobert_multilabel/
    model.pt
    tokenizer/
    mlb.joblib
    config.json
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
from torch import nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoModel, AutoTokenizer


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


class DentalDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.texts = list(texts)
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": torch.FloatTensor(self.labels[idx]),
        }


class PhoBERTMultiLabel(nn.Module):
    def __init__(self, model_name: str, num_labels: int, dropout: float):
        super().__init__()
        self.bert = AutoModel.from_pretrained(model_name, use_safetensors=True)
        hidden_size = self.bert.config.hidden_size
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_size, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0, :]
        cls_output = self.dropout(cls_output)
        return self.classifier(cls_output)


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
        texts_array = np.array(texts, dtype=object)
        return texts_array[train_idx].tolist(), texts_array[test_idx].tolist(), y[train_idx], y[test_idx]

    return train_test_split(
        texts,
        y,
        test_size=test_size,
        random_state=seed,
    )


def tune_thresholds(probs: np.ndarray, labels: np.ndarray) -> np.ndarray:
    thresholds = []
    for label_index in range(labels.shape[1]):
        best_threshold = 0.5
        best_f1 = -1.0
        y_true = labels[:, label_index]
        for threshold in np.arange(0.15, 0.76, 0.05):
            y_pred = (probs[:, label_index] >= threshold).astype(int)
            score = f1_score(y_true, y_pred, zero_division=0)
            if score > best_f1:
                best_f1 = score
                best_threshold = float(threshold)
        thresholds.append(best_threshold)
    return np.array(thresholds)


def apply_thresholds(probs: np.ndarray, thresholds: float | np.ndarray) -> np.ndarray:
    return (probs >= thresholds).astype(int)


def evaluate(model, data_loader, device, threshold: float | np.ndarray):
    model.eval()
    all_probs = []
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in data_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"]

            logits = model(input_ids, attention_mask)
            probs = torch.sigmoid(logits).cpu().numpy()
            preds = apply_thresholds(probs, threshold)

            all_probs.append(probs)
            all_preds.append(preds)
            all_labels.append(labels.numpy())

    return np.vstack(all_probs), np.vstack(all_preds), np.vstack(all_labels)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train PhoBERT multi-label symptom classifier")
    parser.add_argument("--data", default="dental_dataset.csv", help="CSV with text,symptoms columns")
    parser.add_argument("--save-dir", default="models/phobert_multilabel", help="Output model directory")
    parser.add_argument("--model-name", default="vinai/phobert-base-v2", help="Hugging Face model name")
    parser.add_argument("--max-len", type=int, default=128)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--dropout", type=float, default=0.3)
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--tune-thresholds", action="store_true")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--val-size", type=float, default=0.15)
    parser.add_argument("--split-mode", choices=["random", "group"], default="random")
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    texts, labels, groups = load_dataset(Path(args.data))
    mlb = MultiLabelBinarizer(classes=ALLOWED_LABELS)
    y = mlb.fit_transform(labels)

    print(f"Labels: {list(mlb.classes_)}")
    print(f"Samples: {len(texts)}, num_labels: {len(mlb.classes_)}")

    X_train_full, X_test, y_train_full, y_test = split_dataset(
        texts,
        y,
        groups,
        test_size=args.test_size,
        seed=args.seed,
        split_mode=args.split_mode,
    )
    print(f"Split mode: {args.split_mode}")

    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full,
        y_train_full,
        test_size=args.val_size,
        random_state=args.seed,
    )
    print(f"Train/val/test samples: {len(X_train)}/{len(X_val)}/{len(X_test)}")

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    train_dataset = DentalDataset(X_train, y_train, tokenizer, args.max_len)
    val_dataset = DentalDataset(X_val, y_val, tokenizer, args.max_len)
    test_dataset = DentalDataset(X_test, y_test, tokenizer, args.max_len)
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size)

    model = PhoBERTMultiLabel(
        model_name=args.model_name,
        num_labels=len(mlb.classes_),
        dropout=args.dropout,
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    criterion = nn.BCEWithLogitsLoss()

    for epoch in range(args.epochs):
        model.train()
        total_loss = 0.0

        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            batch_labels = batch["labels"].to(device)

            optimizer.zero_grad()
            logits = model(input_ids, attention_mask)
            loss = criterion(logits, batch_labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / max(len(train_loader), 1)
        _, val_preds, val_labels = evaluate(model, val_loader, device, args.threshold)
        macro_f1 = f1_score(val_labels, val_preds, average="macro", zero_division=0)
        micro_f1 = f1_score(val_labels, val_preds, average="micro", zero_division=0)
        print(
            f"Epoch {epoch + 1}/{args.epochs} - "
            f"loss: {avg_loss:.4f} - macro_f1: {macro_f1:.4f} - micro_f1: {micro_f1:.4f}"
        )

    threshold_config: float | np.ndarray = args.threshold
    if args.tune_thresholds:
        val_probs, _, val_labels = evaluate(model, val_loader, device, args.threshold)
        threshold_config = tune_thresholds(val_probs, val_labels)
        print("\n=== TUNED THRESHOLDS ===")
        for label, threshold in zip(mlb.classes_, threshold_config):
            print(f"{label}: {threshold:.2f}")

    _, all_preds, all_labels = evaluate(model, test_loader, device, threshold_config)

    print("\n=== CLASSIFICATION REPORT ===")
    print(classification_report(
        all_labels,
        all_preds,
        target_names=mlb.classes_,
        zero_division=0,
    ))

    macro_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    micro_f1 = f1_score(all_labels, all_preds, average="micro", zero_division=0)
    print(f"Macro F1-score: {macro_f1:.4f}")
    print(f"Micro F1-score: {micro_f1:.4f}")

    save_dir = Path(args.save_dir)
    tokenizer_dir = save_dir / "tokenizer"
    save_dir.mkdir(parents=True, exist_ok=True)
    tokenizer_dir.mkdir(parents=True, exist_ok=True)

    torch.save(model.state_dict(), save_dir / "model.pt")
    tokenizer.save_pretrained(tokenizer_dir)
    joblib.dump(mlb, save_dir / "mlb.joblib")

    config = {
        "model_name": args.model_name,
        "max_len": args.max_len,
        "threshold": threshold_config.tolist() if isinstance(threshold_config, np.ndarray) else threshold_config,
        "labels": list(mlb.classes_),
        "macro_f1": macro_f1,
        "micro_f1": micro_f1,
    }
    with (save_dir / "config.json").open("w", encoding="utf-8") as file:
        json.dump(config, file, ensure_ascii=False, indent=2)

    print(f"\nModel saved to {save_dir}")


if __name__ == "__main__":
    main()
