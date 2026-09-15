import base64
import io

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw, ImageFont
from tensorflow.keras.applications.densenet import preprocess_input


IMG_SIZE = 224


THRESHOLD = 0.65


def _find_last_convolutional_layer(model):
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
        raise RuntimeError("No convolutional layer with spatial feature maps was found")
    if not base_models:
        raise RuntimeError("No nested feature-extractor model was found")
    return candidates[-1], base_models[-1]


def _encode_png(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def _analyze_disease_spread(heatmap_uint8, original_img, probability):
    """
    Computes disease attention spread region bounding boxes, affected area percentage,
    anatomical zone tags, severity rating, and an annotated spread map.
    """
    w, h = original_img.size
    is_pneumonia = probability >= THRESHOLD
    
    # Resize heatmap to match full image dimensions
    heatmap_full = cv2.resize(heatmap_uint8, (w, h), interpolation=cv2.INTER_LINEAR)
    
    # Colorized Jet colormap for thermal disease spread mode
    heatmap_colored_bgr = cv2.applyColorMap(heatmap_full, cv2.COLORMAP_JET)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)
    
    # Translucent thermal blend
    orig_np = np.array(original_img.convert("RGB"))
    thermal_blend_np = cv2.addWeighted(orig_np, 0.55, heatmap_colored_rgb, 0.45, 0)
    thermal_blend_img = Image.fromarray(thermal_blend_np)
    
    if not is_pneumonia:
        # For Normal scans, return low spread baseline
        return {
            "spread_percentage": 0.0,
            "severity": "No Significant Disease Opacity",
            "regions": [],
            "spread_map": _encode_png(thermal_blend_img),
            "thermal_map": _encode_png(thermal_blend_img),
        }

    # Threshold heatmap for high-activation disease opacity zones (intensity >= 33% of max)
    threshold_val = int(255 * 0.33)
    _, binary_mask = cv2.threshold(heatmap_full, threshold_val, 255, cv2.THRESH_BINARY)
    
    # Calculate affected area spread relative to estimated lung area (~50% of CXR canvas)
    active_pixels = np.count_nonzero(binary_mask)
    estimated_lung_pixels = (w * h) * 0.50
    spread_pct = min(100.0, round((active_pixels / estimated_lung_pixels) * 100, 1))
    
    # Determine overall spread severity
    if spread_pct < 6.0:
        severity = "Mild / Focal Opacity"
    elif spread_pct < 18.0:
        severity = "Moderate Regional Spread"
    else:
        severity = "Extensive / Multi-Lobar Spread"

    # Find region contours for bounding boxes
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    regions = []
    annotated_np = orig_np.copy()
    
    # Sort contours by area descending
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    min_region_area = (w * h) * 0.005  # At least 0.5% of total image area
    
    region_idx = 1
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_region_area:
            continue
            
        bx, by, bw, bh = cv2.boundingRect(cnt)
        
        # Calculate center coordinates for anatomical localization (Radiological orientation: Left of image = Right lung)
        cx, cy = bx + bw / 2.0, by + bh / 2.0
        side = "Right" if cx < w * 0.5 else "Left"
        if cy < h * 0.35:
            vert = "Upper Zone"
        elif cy < h * 0.65:
            vert = "Mid Field"
        else:
            vert = "Lower Lobe Field"
        location_tag = f"{side} {vert}"
        
        # Region specific peak intensity inside bbox
        roi_heatmap = heatmap_full[by:by+bh, bx:bx+bw]
        peak_score = round(float(np.max(roi_heatmap) / 255.0 * 100), 1)
        region_area_pct = round((area / estimated_lung_pixels) * 100, 1)
        
        # Draw bounding box & region highlights on annotated map
        sub_roi = annotated_np[by:by+bh, bx:bx+bw]
        overlay_box = sub_roi.copy()
        overlay_box[:, :] = [239, 68, 68] # Red tint
        cv2.addWeighted(overlay_box, 0.30, sub_roi, 0.70, 0, sub_roi)
        
        cv2.rectangle(annotated_np, (bx, by), (bx + bw, by + bh), (239, 68, 68), 2)
        
        # Draw Label Header Badge
        label_text = f"ROI #{region_idx}: {location_tag} ({region_area_pct}%)"
        (lbl_w, lbl_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        lbl_y = max(by - 5, lbl_h + 5)
        cv2.rectangle(annotated_np, (bx, lbl_y - lbl_h - 4), (bx + lbl_w + 6, lbl_y + 2), (239, 68, 68), -1)
        cv2.putText(annotated_np, label_text, (bx + 3, lbl_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        
        regions.append({
            "id": f"ROI-{region_idx}",
            "location": location_tag,
            "bbox_pct": [
                round(bx / w * 100, 1),
                round(by / h * 100, 1),
                round(bw / w * 100, 1),
                round(bh / h * 100, 1),
            ],
            "bbox_pixels": [int(bx), int(by), int(bw), int(bh)],
            "peak_intensity": peak_score,
            "area_percentage": region_area_pct,
        })
        region_idx += 1

    spread_map_img = Image.fromarray(annotated_np)

    return {
        "spread_percentage": spread_pct,
        "severity": severity,
        "regions": regions,
        "spread_map": _encode_png(spread_map_img),
        "thermal_map": _encode_png(thermal_blend_img),
    }


def predict_with_gradcam(model, image_bytes):
    original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    resized = original.resize((IMG_SIZE, IMG_SIZE))
    array = np.asarray(resized, dtype=np.float32)
    inputs = preprocess_input(np.expand_dims(array, axis=0))

    convolutional_layer, feature_extractor = _find_last_convolutional_layer(model)
    feature_model = tf.keras.Model(
        inputs=feature_extractor.input,
        outputs=[convolutional_layer.output, feature_extractor.output],
    )
    classifier_head = tf.keras.Sequential(model.layers[1:])

    with tf.GradientTape() as tape:
        feature_maps, extracted_features = feature_model(inputs, training=False)
        prediction = classifier_head(extracted_features, training=False)
        probability = tf.reshape(prediction, [-1])[0]
        # Target score for Grad-CAM
        class_score = probability if probability >= THRESHOLD else (1.0 - probability)

    gradients = tape.gradient(class_score, feature_maps)
    if gradients is None or feature_maps.shape.rank != 4:
        raise RuntimeError("Selected convolutional layer did not produce usable Grad-CAM maps")

    weights = tf.reduce_mean(gradients, axis=(1, 2))
    heatmap = tf.reduce_sum(feature_maps * weights[:, tf.newaxis, tf.newaxis, :], axis=-1)[0]
    heatmap = tf.maximum(heatmap, 0)
    maximum = tf.reduce_max(heatmap)
    heatmap = tf.where(maximum > 0, heatmap / maximum, tf.zeros_like(heatmap))
    heatmap_array = (heatmap.numpy() * 255).astype(np.uint8)

    # Standard radiological Grad-CAM JET heatmap
    heatmap_full = cv2.resize(heatmap_array, original.size, interpolation=cv2.INTER_LINEAR)
    heatmap_colored_bgr = cv2.applyColorMap(heatmap_full, cv2.COLORMAP_JET)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)
    heatmap_image = Image.fromarray(heatmap_colored_rgb)

    # Blend original image and Grad-CAM heatmap for overlay
    orig_np = np.array(original.convert("RGB"))
    overlay_np = cv2.addWeighted(orig_np, 0.60, heatmap_colored_rgb, 0.40, 0)
    overlay_image = Image.fromarray(overlay_np)

    prob_float = float(probability.numpy())
    pred_label = "PNEUMONIA" if prob_float >= THRESHOLD else "NORMAL"
    conf_float = prob_float if pred_label == "PNEUMONIA" else (1.0 - prob_float)

    # Perform disease attention spread analysis
    spread_analysis = _analyze_disease_spread(heatmap_array, original, prob_float)

    return {
        "probability": prob_float,
        "prediction": pred_label,
        "confidence": conf_float,
        "threshold": THRESHOLD,
        "heatmap": _encode_png(heatmap_image),
        "overlay": _encode_png(overlay_image),
        "spread_map": spread_analysis["spread_map"],
        "thermal_map": spread_analysis["thermal_map"],
        "disease_spread": {
            "spread_percentage": spread_analysis["spread_percentage"],
            "severity": spread_analysis["severity"],
            "regions": spread_analysis["regions"],
        },
        "layer": convolutional_layer.name,
    }

