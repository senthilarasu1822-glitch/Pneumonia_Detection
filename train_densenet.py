import os
import numpy as np
import tensorflow as tf

from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.applications.densenet import preprocess_input
from sklearn.utils.class_weight import compute_class_weight


# ==============================
# SETTINGS
# ==============================

IMG_SIZE = 224
BATCH_SIZE = 32

TRAIN_EPOCHS = 10
FINE_TUNE_EPOCHS = 10

TRAIN_DIR = "dataset/train"
MODEL_PATH = "model/pneumonia_densenet121.keras"


# ==============================
# TRAINING DATA
# IMPROVED DATA AUGMENTATION
# ==============================

train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,

    # Small realistic rotations
    rotation_range=7,

    # Small positional changes
    width_shift_range=0.05,
    height_shift_range=0.05,

    # Slightly stronger zoom
    zoom_range=0.10,

    # Horizontal variation
    horizontal_flip=True,

    # Small brightness variation
    brightness_range=(0.9, 1.1),

    validation_split=0.20
)


train_data = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="training",
    shuffle=True,
    seed=42
)


# ==============================
# VALIDATION DATA
# NO AUGMENTATION
# ==============================

val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.20
)


val_data = val_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="validation",
    shuffle=False,
    seed=42
)


# ==============================
# CLASS WEIGHTS
# ==============================

classes = train_data.classes

weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(classes),
    y=classes
)

class_weights = dict(enumerate(weights))


print("\nClass indices:")
print(train_data.class_indices)

print("\nClass weights:")
print(class_weights)


# ==============================
# DENSENET121
# ==============================

base_model = DenseNet121(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)


# Freeze DenseNet initially
base_model.trainable = False


# ==============================
# MODEL
# ==============================

model = models.Sequential([

    layers.Input(
        shape=(IMG_SIZE, IMG_SIZE, 3)
    ),

    base_model,

    layers.GlobalAveragePooling2D(),

    layers.Dense(
        128,
        activation="relu"
    ),

    layers.Dropout(0.4),

    layers.Dense(
        1,
        activation="sigmoid"
    )
])


# ==============================
# COMPILE
# ==============================

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.0003
    ),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)


model.summary()


# ==============================
# CALLBACKS
# ==============================

checkpoint = tf.keras.callbacks.ModelCheckpoint(
    MODEL_PATH,
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)


early_stopping = tf.keras.callbacks.EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True,
    verbose=1
)


reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=2,
    min_lr=1e-7,
    verbose=1
)


# ==============================
# STAGE 1
# ==============================

print("\n========================================")
print("DENSENET121 - STAGE 1")
print("Training classification head")
print("========================================\n")


history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=TRAIN_EPOCHS,
    class_weight=class_weights,
    callbacks=[
        checkpoint,
        early_stopping,
        reduce_lr
    ]
)


# ==============================
# STAGE 2 - FINE TUNING
# ==============================

print("\n========================================")
print("DENSENET121 - STAGE 2")
print("Fine-tuning last 30 layers")
print("========================================\n")


base_model.trainable = True


# Freeze all except last 30 layers
for layer in base_model.layers[:-30]:
    layer.trainable = False


# Recompile with very small learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=1e-5
    ),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)


history_finetune = model.fit(
    train_data,
    validation_data=val_data,
    epochs=FINE_TUNE_EPOCHS,
    class_weight=class_weights,
    callbacks=[
        checkpoint,
        early_stopping,
        reduce_lr
    ]
)


# ==============================
# SAVE MODEL
# ==============================

os.makedirs(
    "model",
    exist_ok=True
)


model.save(
    MODEL_PATH
)


# ==============================
# COMPLETED
# ==============================

print("\n========================================")
print("TRAINING COMPLETED")
print("========================================")

print("\nDenseNet121 model saved to:")

print(MODEL_PATH)