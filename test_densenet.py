import tensorflow as tf
import numpy as np

from tensorflow.keras.preprocessing.image import ImageDataGenerator

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)


# ============================================================
# SETTINGS
# ============================================================

IMG_SIZE = 224
BATCH_SIZE = 32

TEST_DIR = "dataset/test"

MODEL_PATH = "model/pneumonia_densenet121.keras"

# FINAL CLASSIFICATION THRESHOLD
THRESHOLD = 0.65


# ============================================================
# LOAD MODEL
# ============================================================

print("\n========================================")
print("LOADING DENSENET121 MODEL")
print("========================================\n")

model = tf.keras.models.load_model(MODEL_PATH)

print("DenseNet121 model loaded successfully!")

print(f"Classification Threshold: {THRESHOLD}")


# ============================================================
# LOAD TEST DATA
# ============================================================

print("\n========================================")
print("LOADING TEST DATA")
print("========================================\n")

test_datagen = ImageDataGenerator(
    preprocessing_function=
    tf.keras.applications.densenet.preprocess_input
)

test_data = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)


# ============================================================
# DISPLAY DATA INFORMATION
# ============================================================

print("\n========================================")
print("TEST DATA INFORMATION")
print("========================================")

print("\nClass indices:")
print(test_data.class_indices)

print("\nTotal test images:")
print(test_data.samples)


# ============================================================
# GENERATE TEST PREDICTIONS
# ============================================================

print("\n========================================")
print("GENERATING TEST PREDICTIONS")
print("========================================\n")

test_data.reset()

test_predictions = model.predict(
    test_data,
    verbose=1
)

# Convert predictions to 1D array
test_probabilities = test_predictions.ravel()

# True labels
test_true = test_data.classes


# ============================================================
# APPLY FIXED THRESHOLD
# ============================================================

print("\n========================================")
print("APPLYING CLASSIFICATION THRESHOLD")
print("========================================")

print(f"\nThreshold = {THRESHOLD}")

test_predicted = (
    test_probabilities >= THRESHOLD
).astype(int)


# ============================================================
# ACCURACY
# ============================================================

test_accuracy = accuracy_score(
    test_true,
    test_predicted
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    test_true,
    test_predicted
)

tn, fp, fn, tp = cm.ravel()


# ============================================================
# SENSITIVITY
# ============================================================

sensitivity = tp / (tp + fn)


# ============================================================
# SPECIFICITY
# ============================================================

specificity = tn / (tn + fp)


# ============================================================
# PRECISION
# ============================================================

precision = tp / (tp + fp)


# ============================================================
# FINAL TEST RESULTS
# ============================================================

print("\n========================================")
print("FINAL TEST RESULTS")
print("========================================")

print(
    f"\nModel              : DenseNet121"
)

print(
    f"Image Size         : {IMG_SIZE} x {IMG_SIZE}"
)

print(
    f"Threshold          : {THRESHOLD:.2f}"
)

print(
    f"Test Images        : {test_data.samples}"
)

print(
    f"Test Accuracy      : "
    f"{test_accuracy * 100:.2f}%"
)

print(
    f"Sensitivity        : "
    f"{sensitivity * 100:.2f}%"
)

print(
    f"Specificity        : "
    f"{specificity * 100:.2f}%"
)

print(
    f"Pneumonia Precision: "
    f"{precision * 100:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n========================================")
print("CLASSIFICATION REPORT")
print("========================================\n")

report = classification_report(
    test_true,
    test_predicted,
    target_names=[
        "NORMAL",
        "PNEUMONIA"
    ],
    digits=4
)

print(report)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n========================================")
print("CONFUSION MATRIX")
print("========================================\n")

print(cm)


# ============================================================
# CONFUSION MATRIX DETAILS
# ============================================================

print("\n========================================")
print("CONFUSION MATRIX DETAILS")
print("========================================")

print(
    f"\nTrue Normal       : {tn}"
)

print(
    f"False Pneumonia   : {fp}"
)

print(
    f"False Normal      : {fn}"
)

print(
    f"True Pneumonia    : {tp}"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n========================================")
print("DENSENET121 TESTING COMPLETED")
print("========================================")

print(
    f"\nModel              : DenseNet121"
)

print(
    f"Final Test Accuracy: "
    f"{test_accuracy * 100:.2f}%"
)

print(
    f"Threshold Used     : "
    f"{THRESHOLD:.2f}"
)

print(
    f"Sensitivity        : "
    f"{sensitivity * 100:.2f}%"
)

print(
    f"Specificity        : "
    f"{specificity * 100:.2f}%"
)

print("\n========================================")