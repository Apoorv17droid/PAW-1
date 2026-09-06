"""
Soil photo classifier.

Loads the trained multinomial logistic regression model (model_weights.json)
and runs the same feature extraction and inference pipeline the model was
trained with. Test accuracy on the held out set was 76.9 percent, noted here
so the API can pass that context back to the frontend instead of overstating
confidence.
"""

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

WEIGHTS_PATH = Path(__file__).parent / "model_weights.json"
with open(WEIGHTS_PATH, "r") as f:
    MODEL = json.load(f)

ZONE_LABEL = {
    "Alluvial_Soil": "Alluvial",
    "Arid_Soil": "Arid",
    "Black_Soil": "Black",
    "Laterite_Soil": "Laterite",
    "Mountain_Soil": "Mountain",
    "Red_Soil": "Red",
    "Yellow_Soil": "Yellow",
}

ZONE_COLORS = {
    "Alluvial": "#C9A66B",
    "Arid": "#E3A857",
    "Black": "#4B4B54",
    "Laterite": "#B5533C",
    "Mountain": "#748A98",
    "Red": "#A6512E",
    "Yellow": "#D6A23C",
}

RESIZE = MODEL["feature_config"]["resize"]
H_BINS = MODEL["feature_config"]["h_bins"]
S_BINS = MODEL["feature_config"]["s_bins"]
V_BINS = MODEL["feature_config"]["v_bins"]


def _rgb_to_hsv255(r, g, b):
    """Vectorised RGB (0 to 255) to HSV, H and S and V rescaled to 0 to 255."""
    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    maxc = np.maximum(np.maximum(rf, gf), bf)
    minc = np.minimum(np.minimum(rf, gf), bf)
    diff = maxc - minc
    diff_safe = np.where(diff == 0, 1, diff)

    h = np.zeros_like(rf)
    is_r = (maxc == rf) & (diff != 0)
    is_g = (maxc == gf) & (diff != 0) & (~is_r)
    is_b = (maxc == bf) & (diff != 0) & (~is_r) & (~is_g)

    h = np.where(is_r, (60 * ((gf - bf) / diff_safe) + 360) % 360, h)
    h = np.where(is_g, 60 * ((bf - rf) / diff_safe) + 120, h)
    h = np.where(is_b, 60 * ((rf - gf) / diff_safe) + 240, h)

    s = np.where(maxc == 0, 0, diff / np.where(maxc == 0, 1, maxc))
    v = maxc
    return h / 360 * 255, s * 255, v * 255


def _histogram(arr, bins):
    bin_width = 255 / bins
    idx = np.floor(arr / bin_width).astype(int)
    idx = np.clip(idx, 0, bins - 1)
    counts = np.bincount(idx.flatten(), minlength=bins).astype(float)
    return counts / (arr.size * bin_width)


def extract_features(img: Image.Image):
    img = img.convert("RGB").resize((RESIZE, RESIZE))
    arr = np.asarray(img).astype(float)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    h, s, v = _rgb_to_hsv255(r, g, b)
    h_hist = _histogram(h, H_BINS)
    s_hist = _histogram(s, S_BINS)
    v_hist = _histogram(v, V_BINS)

    gray = 0.299 * r + 0.587 * g + 0.114 * b
    tex_std = float(np.std(gray) / 255.0)

    # 3x3 FIND_EDGES kernel, replicate border, matches the client side model
    padded = np.pad(gray, 1, mode="edge")
    kernel_sum = (
        8 * padded[1:-1, 1:-1]
        - padded[0:-2, 0:-2] - padded[0:-2, 1:-1] - padded[0:-2, 2:]
        - padded[1:-1, 0:-2] - padded[1:-1, 2:]
        - padded[2:, 0:-2] - padded[2:, 1:-1] - padded[2:, 2:]
    )
    kernel_sum = np.clip(kernel_sum, 0, 255)
    edge_density = float(np.mean(kernel_sum) / 255.0)

    r01, g01, b01 = r / 255.0, g / 255.0, b / 255.0
    r_mean, g_mean, b_mean = float(np.mean(r01)), float(np.mean(g01)), float(np.mean(b01))
    r_std, g_std, b_std = float(np.std(r01)), float(np.std(g01)), float(np.std(b01))

    return list(h_hist) + list(s_hist) + list(v_hist) + [
        tex_std, edge_density, r_mean, g_mean, b_mean, r_std, g_std, b_std
    ]


def predict(img: Image.Image):
    features = np.array(extract_features(img))
    mean = np.array(MODEL["scaler_mean"])
    scale = np.array(MODEL["scaler_scale"])
    x = (features - mean) / scale

    weights = np.array(MODEL["weights"])
    intercept = np.array(MODEL["intercept"])
    logits = weights @ x + intercept

    logits = logits - np.max(logits)
    exps = np.exp(logits)
    probs = exps / np.sum(exps)

    best = int(np.argmax(probs))
    cls = MODEL["classes"][best]
    return {
        "class": cls,
        "label": ZONE_LABEL[cls],
        "confidence": float(probs[best]),
        "model_test_accuracy": MODEL["test_accuracy"],
    }
