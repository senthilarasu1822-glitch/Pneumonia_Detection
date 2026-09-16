---
title: PneumoAI
emoji: 🫁
colorFrom: blue
colorTo: cyan
sdk: docker
pinned: false
license: mit
short_description: AI-Assisted Pneumonia Detection via DenseNet121 + Grad-CAM
---

# PneumoAI — AI-Assisted Pneumonia Detection

An educational AI platform for chest X-ray pneumonia screening using **DenseNet121** deep learning with **Grad-CAM** visual attention overlays.

> ⚠️ **Medical Disclaimer:** This is an educational AI demonstration. Not a clinically validated diagnostic system. AI predictions are not a substitute for licensed medical evaluation.

## Features

- 🧠 **DenseNet121** — 121-layer dense convolutional neural network (224×224 input)
- 🔥 **Grad-CAM** — Gradient-weighted Class Activation Mapping heatmaps
- 📊 **Disease Spread Analysis** — Regional opacity quantification
- 📄 **PDF Report Generation** — Clinical-grade formatted report with Grad-CAM images
- 💬 **WhatsApp Integration** — Share reports directly with doctor/patient
- 🎥 **WebRTC Video Consultation** — Browser-based video call with WebSocket signaling
- 🏥 **Doctor Dashboard** — Appointment management (approve/reject/schedule)

## Model Performance (Test Benchmark — 624 images)

| Metric | Value |
|---|---|
| Test Accuracy | 91.51% |
| Sensitivity (Recall) | 93.33% |
| Specificity | 88.46% |
| Pneumonia Precision | 93.09% |
| Pneumonia F1-Score | 93.21% |
| Classification Threshold | 0.65 |

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** FastAPI + Uvicorn
- **Model:** TensorFlow / Keras — DenseNet121
- **Grad-CAM:** OpenCV + NumPy
- **PDF:** ReportLab
- **Deployment:** Docker (Hugging Face Spaces)
