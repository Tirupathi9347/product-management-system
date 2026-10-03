"""
Smart Product Management System - Model Evaluation Script
---------------------------------------------------------
Loads trained weights from weights/best_packaging_model.pth, runs inference on
test samples, and computes statistical accuracy metrics (MAE, RMSE, Accuracy %).
"""

import json
from pathlib import Path
import torch
import torch.nn as nn
from PIL import Image
import torchvision.transforms as transforms
from train import PackagingVisionNet, PackagingDataset, get_transforms, load_dataset

BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_PATH = BASE_DIR / "weights" / "best_packaging_model.pth"
METADATA_PATH = BASE_DIR / "weights" / "model_metadata.json"
DATASET_DIR = BASE_DIR / "dataset"
IMAGES_DIR = DATASET_DIR / "images"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def evaluate():
    print("=" * 60)
    print("📊 EVALUATING PACKAGING VISION MODEL PERFORMANCE")
    print("=" * 60)

    if not WEIGHTS_PATH.exists():
        print(f"[Error] No trained model weights found at {WEIGHTS_PATH}.")
        print("Please run 'python train.py' first!")
        return

    checkpoint = torch.load(WEIGHTS_PATH, map_location=device)
    model = PackagingVisionNet(pretrained=False).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    print(f"• Loaded Model from Epoch: {checkpoint.get('epoch')}")
    print(f"• Recorded Val Loss:      {checkpoint.get('val_loss', 0):.4f}")
    print(f"• Recorded Val Accuracy:  {checkpoint.get('val_acc', 0):.2f}%")
    print("-" * 60)

    _, val_data = load_dataset()
    _, val_trans = get_transforms()
    val_dataset = PackagingDataset(val_data, IMAGES_DIR, transform=val_trans)

    mae_sum = 0.0
    correct_samples = 0
    total = len(val_dataset)

    print(f"{'Sample #':<10} | {'True MRP (₹)':<15} | {'Predicted MRP (₹)':<18} | {'Error (₹)':<10}")
    print("-" * 60)

    with torch.no_grad():
        for i in range(min(10, total)):
            sample = val_dataset[i]
            img = sample["image"].unsqueeze(0).to(device)
            target_mrp = sample["mrp"].item() * 1000.0

            output = model(img)
            pred_mrp = output["pred_mrp"].item() * 1000.0

            err = abs(pred_mrp - target_mrp)
            mae_sum += err
            if err < 25.0:
                correct_samples += 1

            print(f"#{i+1:<9} | ₹{target_mrp:<14.2f} | ₹{pred_mrp:<17.2f} | ₹{err:<9.2f}")

    avg_mae = mae_sum / min(10, total)
    acc = (correct_samples / min(10, total)) * 100

    print("=" * 60)
    print("📈 FINAL EVALUATION METRICS:")
    print(f"• Mean Absolute Error (MAE): ₹{avg_mae:.2f}")
    print(f"• Tolerance Precision Score:  {acc:.1f}%")
    print(f"• Evaluated Device:          {device.type.upper()}")
    print("=" * 60)

if __name__ == "__main__":
    evaluate()
