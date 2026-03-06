import { loadTensorflowModel } from 'react-native-fast-tflite';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import jpeg from 'jpeg-js';

let model = null;

const CLASS_NAMES = ['broken-chipped-cut', 'dried-cherry-pod', 'floater', 'foreign-matter', 'full-black', 'full-sour', 'fungus-damage', 'good', 'husk', 'immature', 'parchment', 'partial-black', 'partial-sour', 'severe-insect-damage', 'shell', 'slight-insect-damage', 'withered'];
const CONFIDENCE_THRESHOLD = 0.5;
const NMS_IOU_THRESHOLD = 0.5; // Suppress detections that overlap more than this with a higher-confidence box
const INPUT_SIZE = 640; 
// Native pre-resize so we decode a smaller image in JS (fixes ~24s jpeg-js decode on large photos).
// 1920 keeps good detail while making decode fast (~2–5s instead of 20s+).
const MAX_PREPROCESS_SIZE = 1920;

function getResizedPath(resized) {
  if (resized.path) return resized.path;
  if (resized.uri && String(resized.uri).startsWith('file://')) {
    return String(resized.uri).replace('file://', '');
  }
  return resized.uri || resized.path;
}

// IoU (Intersection over Union) for two boxes { x1, y1, x2, y2 }
function iou(a, b) {
  const xi1 = Math.max(a.x1, b.x1);
  const yi1 = Math.max(a.y1, b.y1);
  const xi2 = Math.min(a.x2, b.x2);
  const yi2 = Math.min(a.y2, b.y2);
  const interW = Math.max(0, xi2 - xi1);
  const interH = Math.max(0, yi2 - yi1);
  const inter = interW * interH;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  const union = areaA + areaB - inter;
  return union <= 0 ? 0 : inter / union;
}

// Non-Maximum Suppression: keep one box per object, drop overlapping lower-confidence duplicates
function nonMaxSuppression(detections) {
  const byClass = new Map();
  for (const d of detections) {
    const k = d.classId;
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(d);
  }
  const out = [];
  for (const list of byClass.values()) {
    list.sort((a, b) => b.confidence - a.confidence);
    const keep = [];
    for (const box of list) {
      let suppressed = false;
      for (const k of keep) {
        if (iou(box, k) > NMS_IOU_THRESHOLD) {
          suppressed = true;
          break;
        }
      }
      if (!suppressed) keep.push(box);
    }
    out.push(...keep);
  }
  return out;
}

// Letterbox: scale image to fit INPUT_SIZE x INPUT_SIZE, pad with black
function letterboxToInputSize(decoded) {
  const { width, height, data } = decoded; // data is RGBA Uint8Array
  const scale = Math.min(INPUT_SIZE / width, INPUT_SIZE / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  const padX = Math.floor((INPUT_SIZE - newWidth) / 2);
  const padY = Math.floor((INPUT_SIZE - newHeight) / 2);

  // Resize image to newWidth x newHeight (nearest neighbor)
  const resized = new Uint8ClampedArray(newWidth * newHeight * 4);
  for (let y = 0; y < newHeight; y++) {
    const srcY = Math.floor(y / scale);
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x / scale);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;
      resized[dstIdx] = data[srcIdx];
      resized[dstIdx + 1] = data[srcIdx + 1];
      resized[dstIdx + 2] = data[srcIdx + 2];
      resized[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  // Create padded (letterboxed) RGB float32 array
  const target = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  for (let y = 0; y < INPUT_SIZE; y++) {
    for (let x = 0; x < INPUT_SIZE; x++) {
      const dstIdx = (y * INPUT_SIZE + x) * 3;
      // Check if inside the resized image
      if (
        x >= padX && x < padX + newWidth &&
        y >= padY && y < padY + newHeight
      ) {
        const srcX = x - padX;
        const srcY = y - padY;
        const srcIdx = (srcY * newWidth + srcX) * 4;
        target[dstIdx] = resized[srcIdx] / 255;
        target[dstIdx + 1] = resized[srcIdx + 1] / 255;
        target[dstIdx + 2] = resized[srcIdx + 2] / 255;
      } else {
        // Black padding
        target[dstIdx] = 0;
        target[dstIdx + 1] = 0;
        target[dstIdx + 2] = 0;
      }
    }
  }
  return target;
}

export async function initModel() {
  if (model) return;

  model = await loadTensorflowModel(
    require('../assets/best_float32.tflite')
  );

  console.log("Model loaded successfully");
  try {
    console.log('Model inputs:', model.inputs);
    console.log('Model outputs:', model.outputs);
  } catch (e) {
    console.log('Failed to inspect model tensors:', e);
  }
}

// Create input TypedArray from image file path
async function createImageTensor(imagePath) {
  try {
    const t0 = Date.now();
    const fsPath = imagePath.startsWith('file://') ? imagePath.replace('file://', '') : imagePath;

    // Native resize first: decode a smaller image in JS (fixes very slow jpeg-js on full-res).
    const resized = await ImageResizer.createResizedImage(
      fsPath,
      MAX_PREPROCESS_SIZE,
      MAX_PREPROCESS_SIZE,
      'JPEG',
      90,
      0
    );
    const t1 = Date.now();
    console.log(`[PROFILE] Native resize: ${(t1 - t0)} ms`);

    const pathToRead = getResizedPath(resized);
    const base64 = await RNFS.readFile(pathToRead, 'base64');
    const t2 = Date.now();
    console.log(`[PROFILE] File read: ${(t2 - t1)} ms`);

    const t3 = Date.now();
    const binaryString = global.atob ? global.atob(base64) : atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoded = jpeg.decode(bytes, { useTArray: true });
    const t4 = Date.now();
    console.log(`[PROFILE] JPEG decode: ${(t4 - t3)} ms`);

    if (!decoded || !decoded.data) {
      throw new Error('Failed to decode JPEG');
    }

    const t5 = Date.now();
    const pixelData = letterboxToInputSize(decoded);
    const t6 = Date.now();
    console.log(`[PROFILE] Preprocess (letterbox): ${(t6 - t5)} ms`);
    console.log(`[PROFILE] Total input tensor creation: ${(t6 - t0)} ms`);
    console.log('Created input tensor data with length:', pixelData.length);
    return pixelData;
  } catch (error) {
    console.error('Tensor creation error:', error);
    throw error;
  }
}

// Parse model output into detection objects for a single-output detection head:
// Identity: [1, 300, 6] with [x1, y1, x2, y2, confidence, classId]
function parseDetections(modelOutput) {
  try {
    console.log('=== RAW MODEL OUTPUT ===');
    console.log('Type:', typeof modelOutput);
    console.log('Is Array:', Array.isArray(modelOutput));
    console.log('Length:', modelOutput?.length);

    if (!Array.isArray(modelOutput) || modelOutput.length === 0) {
      return [];
    }

    // Single output tensor: Identity [1, 300, 6]
    const identity = modelOutput[0];

    let data;
    if (ArrayBuffer.isView(identity)) {
      data = identity;
    } else if (Array.isArray(identity)) {
      data = identity;
    } else {
      console.warn('Identity output is not an array or TypedArray:', identity);
      return [];
    }

    const values = Array.from(data);
    const numDetections = Math.floor(values.length / 6);
    const detections = [];

    console.log(`[TFLite] Processing ${numDetections} raw detections (each row has 6 values: x1, y1, x2, y2, confidence?, classId?)`);

    // Log first 3 rows to see format; then max confidence we use (index 4) vs threshold
    let maxConfUsed = -Infinity;
    for (let i = 0; i < numDetections; i++) {
      const base = i * 6;
      const v = (j) => (values[base + j] != null ? Number(values[base + j]).toFixed(4) : '?');
      if (i < 3) {
        console.log(`[TFLite] Raw row ${i}: [${v(0)}, ${v(1)}, ${v(2)}, ${v(3)}, ${v(4)}, ${v(5)}]`);
      }
      const conf = values[base + 4];
      if (typeof conf === 'number' && !isNaN(conf) && conf > maxConfUsed) maxConfUsed = conf;
    }
    const maxStr = maxConfUsed === -Infinity ? 'none' : maxConfUsed.toFixed(4);
    console.log(`[TFLite] Using column 4 as confidence. Max = ${maxStr}, threshold = ${CONFIDENCE_THRESHOLD}. (If 0 detections: try lower threshold or check if confidence is in column 5.)`);

    // Parse as [x1, y1, x2, y2, confidence, classId]. Model outputs pixel coords (0..INPUT_SIZE), not 0..1.
    const scale = 1 / INPUT_SIZE;
    for (let i = 0; i < numDetections; i++) {
      const base = i * 6;
      const x1 = values[base + 0] * scale;
      const y1 = values[base + 1] * scale;
      const x2 = values[base + 2] * scale;
      const y2 = values[base + 3] * scale;
      const confidence = values[base + 4];
      const classId = values[base + 5];

      if (typeof confidence !== 'number' || isNaN(confidence)) continue;
      if (confidence < CONFIDENCE_THRESHOLD) continue;

      const classIdx = Math.floor(classId);
      detections.push({
        x1: Math.max(0, Math.min(1, x1)),
        y1: Math.max(0, Math.min(1, y1)),
        x2: Math.max(0, Math.min(1, x2)),
        y2: Math.max(0, Math.min(1, y2)),
        confidence,
        classId: classIdx,
        label: CLASS_NAMES[classIdx] ?? `Class ${classIdx}`,
      });
    }

    const nmsDetections = nonMaxSuppression(detections);
    console.log(`Found ${nmsDetections.length} valid detections (after NMS, was ${detections.length})`);
    return nmsDetections;
  } catch (error) {
    console.error('Detection parsing error:', error);
    return [];
  }
}

// High resolution inference for captured photos
export async function runModelOnImage(imagePath) {
  if (!model) throw new Error("Model not loaded");

  try {
    console.log('Running inference on image:', imagePath);

    const t0 = Date.now();
    const input = await createImageTensor(imagePath);
    const t1 = Date.now();

    console.log('[TFLite] Calling model.runSync([input])...');
    const t2 = Date.now();
    // Must use runSync so native can read the buffer on the same thread (run() would error).
    const result = model.runSync([input]);
    const t3 = Date.now();
    console.log(`[PROFILE] Inference (model.runSync): ${(t3 - t2)} ms`);

    console.log('[TFLite] runSync returned, parsing output...');
    const detections = parseDetections(result);
    return detections;
  } catch (error) {
    console.error("Model inference error:", error);
    throw error;
  }
}