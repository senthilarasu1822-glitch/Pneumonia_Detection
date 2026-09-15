import gc
import base64
import io

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications.densenet import preprocess_input


# ============================================================
# CONFIGURATION
# ============================================================

IMG_SIZE = 224
THRESHOLD = 0.65

# Maximum size used for visualization.
# This prevents very large uploaded X-rays from consuming
# excessive RAM on Render.
MAX_DISPLAY_SIZE = 1024


# ============================================================
# FIND LAST CONVOLUTIONAL LAYER
# ============================================================

def _find_last_convolutional_layer(model):
    """
    Find the last Conv2D layer inside the DenseNet feature extractor.
    """

    candidates = []
    base_models = []

    def visit(layer):
        if isinstance(layer, tf.keras.Model):
            base_models.append(layer)

        if isinstance(layer, tf.keras.layers.Conv2D):
            candidates.append(layer)

        for child in getattr(layer, "layers", []):
            visit(child)

    visit(model)

    if not candidates:
        raise RuntimeError(
            "No convolutional layer with spatial feature maps was found."
        )

    if not base_models:
        raise RuntimeError(
            "No nested feature-extractor model was found."
        )

    # The last nested model is normally the DenseNet backbone.
    feature_extractor = base_models[-1]

    # Last convolutional layer.
    convolutional_layer = candidates[-1]

    return convolutional_layer, feature_extractor


# ============================================================
# IMAGE ENCODING
# ============================================================

def _encode_image(image, quality=82):
    """
    Encode PIL image as a compact JPEG data URL.

    JPEG is considerably smaller than PNG for large X-ray images,
    which reduces API response size and memory usage.
    """

    buffer = io.BytesIO()

    image.convert("RGB").save(
        buffer,
        format="JPEG",
        quality=quality,
        optimize=True
    )

    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")

    return "data:image/jpeg;base64," + encoded


# ============================================================
# RESIZE DISPLAY IMAGE
# ============================================================

def _resize_for_display(image):
    """
    Limit visualization image dimensions.

    The neural network still receives 224x224 input.
    This only limits the size of generated heatmaps/overlays.
    """

    width, height = image.size

    largest_dimension = max(width, height)

    if largest_dimension <= MAX_DISPLAY_SIZE:
        return image

    scale = MAX_DISPLAY_SIZE / float(largest_dimension)

    new_width = max(1, int(width * scale))
    new_height = max(1, int(height * scale))

    return image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS
    )


# ============================================================
# DISEASE SPREAD / AI ATTENTION ANALYSIS
# ============================================================

def _analyze_disease_spread(
    heatmap_uint8,
    original_img,
    probability
):
    """
    Analyze high-attention regions.

    IMPORTANT:
    These regions represent model attention, not confirmed
    disease/lesion locations.
    """

    try:
        w, h = original_img.size

        is_pneumonia = probability >= THRESHOLD

        # Resize Grad-CAM to display-image dimensions.
        heatmap_full = cv2.resize(
            heatmap_uint8,
            (w, h),
            interpolation=cv2.INTER_LINEAR
        )

        # Create colored Grad-CAM.
        heatmap_colored_bgr = cv2.applyColorMap(
            heatmap_full,
            cv2.COLORMAP_JET
        )

        heatmap_colored_rgb = cv2.cvtColor(
            heatmap_colored_bgr,
            cv2.COLOR_BGR2RGB
        )

        orig_np = np.asarray(
            original_img.convert("RGB"),
            dtype=np.uint8
        )

        # ----------------------------------------------------
        # Thermal / attention overlay
        # ----------------------------------------------------

        thermal_blend_np = cv2.addWeighted(
            orig_np,
            0.55,
            heatmap_colored_rgb,
            0.45,
            0
        )

        thermal_blend_img = Image.fromarray(
            thermal_blend_np
        )

        # ----------------------------------------------------
        # NORMAL prediction
        # ----------------------------------------------------

        if not is_pneumonia:

            result = {
                "spread_percentage": 0.0,
                "severity": "No Significant Disease Opacity",
                "regions": [],
                "spread_map": _encode_image(
                    thermal_blend_img
                ),
                "thermal_map": _encode_image(
                    thermal_blend_img
                ),
            }

            del heatmap_full
            del heatmap_colored_bgr
            del heatmap_colored_rgb
            del orig_np
            del thermal_blend_np
            del thermal_blend_img

            return result

        # ----------------------------------------------------
        # Threshold attention map
        # ----------------------------------------------------

        threshold_val = int(255 * 0.33)

        _, binary_mask = cv2.threshold(
            heatmap_full,
            threshold_val,
            255,
            cv2.THRESH_BINARY
        )

        active_pixels = np.count_nonzero(
            binary_mask
        )

        # Approximate lung area.
        # This is a visualization heuristic, not medical
        # segmentation.
        estimated_lung_pixels = max(
            1,
            (w * h) * 0.50
        )

        spread_pct = min(
            100.0,
            round(
                (active_pixels / estimated_lung_pixels)
                * 100,
                1
            )
        )

        # ----------------------------------------------------
        # Severity label
        # ----------------------------------------------------

        if spread_pct < 6.0:

            severity = "Mild / Focal Opacity"

        elif spread_pct < 18.0:

            severity = "Moderate Regional Spread"

        else:

            severity = "Extensive / Multi-Lobar Spread"

        # ----------------------------------------------------
        # Find attention regions
        # ----------------------------------------------------

        contours, _ = cv2.findContours(
            binary_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        contours = sorted(
            contours,
            key=cv2.contourArea,
            reverse=True
        )

        regions = []

        annotated_np = orig_np.copy()

        min_region_area = (
            (w * h) * 0.005
        )

        region_idx = 1

        for cnt in contours:

            area = cv2.contourArea(cnt)

            if area < min_region_area:
                continue

            bx, by, bw, bh = cv2.boundingRect(cnt)

            cx = bx + bw / 2.0
            cy = by + bh / 2.0

            # Image-side labeling.
            if cx < w * 0.5:
                side = "Right"
            else:
                side = "Left"

            if cy < h * 0.35:
                vert = "Upper Zone"

            elif cy < h * 0.65:
                vert = "Mid Field"

            else:
                vert = "Lower Lobe Field"

            location_tag = f"{side} {vert}"

            # Region attention intensity.
            roi_heatmap = heatmap_full[
                by:by + bh,
                bx:bx + bw
            ]

            if roi_heatmap.size > 0:
                peak_score = round(
                    float(
                        np.max(roi_heatmap) / 255.0
                        * 100
                    ),
                    1
                )
            else:
                peak_score = 0.0

            region_area_pct = round(
                (area / estimated_lung_pixels)
                * 100,
                1
            )

            # ------------------------------------------------
            # Draw region
            # ------------------------------------------------

            sub_roi = annotated_np[
                by:by + bh,
                bx:bx + bw
            ]

            if sub_roi.size > 0:

                overlay_box = np.empty_like(
                    sub_roi
                )

                overlay_box[:, :] = [
                    239,
                    68,
                    68
                ]

                cv2.addWeighted(
                    overlay_box,
                    0.30,
                    sub_roi,
                    0.70,
                    0,
                    sub_roi
                )

            cv2.rectangle(
                annotated_np,
                (bx, by),
                (bx + bw, by + bh),
                (239, 68, 68),
                2
            )

            label_text = (
                f"ROI #{region_idx}: "
                f"{location_tag} "
                f"({region_area_pct}%)"
            )

            (
                (lbl_w, lbl_h),
                _
            ) = cv2.getTextSize(
                label_text,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                1
            )

            lbl_y = max(
                by - 5,
                lbl_h + 5
            )

            cv2.rectangle(
                annotated_np,
                (
                    bx,
                    lbl_y - lbl_h - 4
                ),
                (
                    bx + lbl_w + 6,
                    lbl_y + 2
                ),
                (239, 68, 68),
                -1
            )

            cv2.putText(
                annotated_np,
                label_text,
                (
                    bx + 3,
                    lbl_y - 2
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

            regions.append(
                {
                    "id": f"ROI-{region_idx}",

                    "location": location_tag,

                    "bbox_pct": [
                        round(
                            bx / w * 100,
                            1
                        ),
                        round(
                            by / h * 100,
                            1
                        ),
                        round(
                            bw / w * 100,
                            1
                        ),
                        round(
                            bh / h * 100,
                            1
                        ),
                    ],

                    "bbox_pixels": [
                        int(bx),
                        int(by),
                        int(bw),
                        int(bh)
                    ],

                    "peak_intensity": peak_score,

                    "area_percentage": region_area_pct,
                }
            )

            region_idx += 1

            # Prevent huge response payloads.
            if region_idx > 6:
                break

        # ----------------------------------------------------
        # Final images
        # ----------------------------------------------------

        spread_map_img = Image.fromarray(
            annotated_np
        )

        result = {
            "spread_percentage": spread_pct,

            "severity": severity,

            "regions": regions,

            "spread_map": _encode_image(
                spread_map_img
            ),

            "thermal_map": _encode_image(
                thermal_blend_img
            ),
        }

        # ----------------------------------------------------
        # Cleanup
        # ----------------------------------------------------

        del heatmap_full
        del heatmap_colored_bgr
        del heatmap_colored_rgb
        del orig_np
        del thermal_blend_np
        del thermal_blend_img
        del binary_mask
        del annotated_np

        return result

    except Exception as error:

        print(
            f"Disease spread analysis warning: {error}"
        )

        return {
            "spread_percentage": 0.0,
            "severity": "Attention Analysis Unavailable",
            "regions": [],
            "spread_map": None,
            "thermal_map": None,
        }


# ============================================================
# MAIN PREDICTION + GRAD-CAM
# ============================================================

def predict_with_gradcam(model, image_bytes):
    """
    Run DenseNet121 prediction and generate Grad-CAM.

    Returns:
        probability
        prediction
        confidence
        heatmap
        overlay
        spread_map
        thermal_map
        disease_spread
        layer
    """

    original = None
    resized = None
    array = None
    inputs = None
    feature_model = None
    classifier_head = None
    feature_maps = None
    extracted_features = None
    prediction = None
    gradients = None
    weights = None
    heatmap = None
    heatmap_array = None
    heatmap_full = None
    heatmap_colored_bgr = None
    heatmap_colored_rgb = None
    orig_np = None
    overlay_np = None
    overlay_image = None

    try:

        # ====================================================
        # LOAD IMAGE
        # ====================================================

        original = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        # Limit visualization resolution.
        original = _resize_for_display(
            original
        )

        # ====================================================
        # MODEL INPUT
        # ====================================================

        resized = original.resize(
            (IMG_SIZE, IMG_SIZE),
            Image.Resampling.LANCZOS
        )

        array = np.asarray(
            resized,
            dtype=np.float32
        )

        inputs = preprocess_input(
            np.expand_dims(
                array,
                axis=0
            )
        )

        # ====================================================
        # FIND DENSENET BACKBONE + LAST CONV LAYER
        # ====================================================

        convolutional_layer, feature_extractor = (
            _find_last_convolutional_layer(model)
        )

        # ====================================================
        # BUILD FEATURE MODEL
        # ====================================================

        feature_model = tf.keras.Model(
            inputs=feature_extractor.input,

            outputs=[
                convolutional_layer.output,
                feature_extractor.output
            ]
        )

        # ====================================================
        # CLASSIFIER HEAD
        # ====================================================

        # Your saved model contains the DenseNet feature
        # extractor followed by the classification head.
        classifier_head = tf.keras.Sequential(
            model.layers[1:]
        )

        # ====================================================
        # GRAD-CAM
        # ====================================================

        with tf.GradientTape() as tape:

            feature_maps, extracted_features = (
                feature_model(
                    inputs,
                    training=False
                )
            )

            prediction = classifier_head(
                extracted_features,
                training=False
            )

            probability_tensor = tf.reshape(
                prediction,
                [-1]
            )[0]

            probability_value = (
                float(
                    probability_tensor.numpy()
                )
            )

            if probability_value >= THRESHOLD:

                class_score = (
                    probability_tensor
                )

            else:

                class_score = (
                    1.0 - probability_tensor
                )

        # ====================================================
        # GRADIENT
        # ====================================================

        gradients = tape.gradient(
            class_score,
            feature_maps
        )

        if gradients is None:

            raise RuntimeError(
                "Grad-CAM gradients could not be calculated."
            )

        if feature_maps.shape.rank != 4:

            raise RuntimeError(
                "Selected convolutional layer "
                "does not produce spatial feature maps."
            )

        # ====================================================
        # GRAD-CAM WEIGHTS
        # ====================================================

        weights = tf.reduce_mean(
            gradients,
            axis=(1, 2)
        )

        heatmap = tf.reduce_sum(
            feature_maps
            * weights[
                :,
                tf.newaxis,
                tf.newaxis,
                :
            ],
            axis=-1
        )[0]

        # ReLU.
        heatmap = tf.maximum(
            heatmap,
            0
        )

        maximum = tf.reduce_max(
            heatmap
        )

        heatmap = tf.where(
            maximum > 0,
            heatmap / maximum,
            tf.zeros_like(heatmap)
        )

        heatmap_array = (
            heatmap.numpy() * 255
        ).astype(np.uint8)

        # ====================================================
        # CREATE HEATMAP
        # ====================================================

        heatmap_full = cv2.resize(
            heatmap_array,
            original.size,
            interpolation=cv2.INTER_LINEAR
        )

        heatmap_colored_bgr = (
            cv2.applyColorMap(
                heatmap_full,
                cv2.COLORMAP_JET
            )
        )

        heatmap_colored_rgb = cv2.cvtColor(
            heatmap_colored_bgr,
            cv2.COLOR_BGR2RGB
        )

        heatmap_image = Image.fromarray(
            heatmap_colored_rgb
        )

        # ====================================================
        # CREATE OVERLAY
        # ====================================================

        orig_np = np.asarray(
            original.convert("RGB"),
            dtype=np.uint8
        )

        overlay_np = cv2.addWeighted(
            orig_np,
            0.60,
            heatmap_colored_rgb,
            0.40,
            0
        )

        overlay_image = Image.fromarray(
            overlay_np
        )

        # ====================================================
        # PREDICTION
        # ====================================================

        prob_float = probability_value

        if prob_float >= THRESHOLD:

            pred_label = "PNEUMONIA"

            conf_float = prob_float

        else:

            pred_label = "NORMAL"

            conf_float = 1.0 - prob_float

        # ====================================================
        # DISEASE SPREAD / ATTENTION
        # ====================================================

        spread_analysis = (
            _analyze_disease_spread(
                heatmap_array,
                original,
                prob_float
            )
        )

        # ====================================================
        # ENCODE MAIN OUTPUTS
        # ====================================================

        heatmap_encoded = _encode_image(
            heatmap_image
        )

        overlay_encoded = _encode_image(
            overlay_image
        )

        # ====================================================
        # RESULT
        # ====================================================

        result = {

            "probability": prob_float,

            "prediction": pred_label,

            "confidence": conf_float,

            "threshold": THRESHOLD,

            "heatmap": heatmap_encoded,

            "overlay": overlay_encoded,

            "spread_map": (
                spread_analysis[
                    "spread_map"
                ]
            ),

            "thermal_map": (
                spread_analysis[
                    "thermal_map"
                ]
            ),

            "disease_spread": {

                "spread_percentage":
                    spread_analysis[
                        "spread_percentage"
                    ],

                "severity":
                    spread_analysis[
                        "severity"
                    ],

                "regions":
                    spread_analysis[
                        "regions"
                    ],
            },

            "layer":
                convolutional_layer.name,
        }

        return result

    finally:

        # ====================================================
        # MEMORY CLEANUP
        # ====================================================

        # Delete temporary references.
        original = None
        resized = None
        array = None
        inputs = None
        feature_maps = None
        extracted_features = None
        prediction = None
        gradients = None
        weights = None
        heatmap = None
        heatmap_array = None
        heatmap_full = None
        heatmap_colored_bgr = None
        heatmap_colored_rgb = None
        orig_np = None
        overlay_np = None
        overlay_image = None

        # Do not clear the TensorFlow session here.
        # The loaded DenseNet model is reused by the API.

        gc.collect()