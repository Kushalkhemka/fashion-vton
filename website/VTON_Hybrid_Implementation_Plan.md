# Hybrid Virtual Try-On (VTON) Implementation Plan

## Overview
This historical plan describes how to implement a hybrid virtual try-on system that uses a local VTON pipeline for known dataset images and the Segmind API for external images. Runtime code now uses the configurable backend in `backend/vton_api`; paths below are examples from the original local prototype. The system will:
- Use local scripts (step 1 + step 2) for images found in the dataset.
- Use the Segmind API for images outside the dataset.
- Save and serve the output image for rendering in the frontend.

---

## Feasibility Analysis

### 1. Local Dataset Check
- **Goal:** When a user uploads a model image, check if its filename (ignoring macOS underscore files) exists in:
  - configured test image directory
  - configured train image directory
- **Feasibility:** Straightforward using Python's `os.path.exists` and filtering out files starting with `._`.

### 2. Local VTON Pipeline (Step 1 + Step 2)
- **Goal:** If the file is found in the dataset, run the local VTON pipeline:
  - **Step 1:** Preprocessing (warping, parsing, limb, etc.) using `test_for_step1.py`
  - **Step 2:** Try-on synthesis using `test_for_step2_fixed.py` (or `test_for_step2.py`)
- **Feasibility:**
  - Scripts are batch-oriented but can be adapted for single image processing.
  - They expect a pairs file (e.g., `test_pairs.txt`).
  - Output images are saved to a results directory, which can be monitored.

### 3. Output Handling
- **Goal:** Once the output image is generated, move/copy it to the configured output directory and render it in the frontend.
- **Feasibility:** Simple file operation.

### 4. Fallback to Segmind API
- **Goal:** If the uploaded image is not in the dataset, use the Segmind API as currently implemented.
- **Feasibility:** Already working in the current pipeline.

### 5. Flask API Option
- **Goal:** Optionally, wrap the local pipeline in a Flask API for easier integration and async processing.
- **Feasibility:** Very feasible; can expose an endpoint for try-on requests.

---

## Step-by-Step Implementation Plan

### A. Backend (Python/Flask)
1. **Image Upload Endpoint**
   - Accepts the uploaded model image and the selected cloth image.
   - Checks if the model image filename exists in the dataset folders (ignoring `._*` files).

2. **If Image Exists in Dataset:**
   - Prepare a temporary `test_pairs_temp.txt` file with the correct image/cloth pair.
   - Run `test_for_step1.py` (if preprocessing is needed and not already done).
   - Run `test_for_step2_fixed.py` (or `test_for_step2.py`) with the temp pairs file.
   - Wait for the output image to be generated.
   - Copy/move the output image to `/style-flow-motion/public/output`.
   - Return the output image path to the frontend.

3. **If Image Does Not Exist in Dataset:**
   - Use the Segmind API as currently implemented.
   - Save the result to `/style-flow-motion/public/output`.
   - Return the output image path to the frontend.

4. **Async/Status Option (Optional):**
   - For long-running jobs, return a job ID and provide a status endpoint for the frontend to poll.

### B. Frontend
1. **On Try-On Request:**
   - Upload the model image to the backend.
   - Show a loading indicator.
   - Poll for the output image in `/output` (or wait for the backend response).
   - Render the output image once available.

2. **No Change Needed for Segmind API Fallback.**

---

## Script Adaptation Notes
- `test_for_step1.py` and `test_for_step2_fixed.py` can be run for a single image/cloth pair by creating a temp pairs file and pointing the scripts to it.
- Check if preprocessing (step 1) is already done for the image/cloth pair to avoid redundant computation.
- The scripts are already set up to run on CPU, which is compatible with most server environments.

---

## Summary Table

| Scenario                | Action                                                                 |
|-------------------------|------------------------------------------------------------------------|
| Image in dataset        | Run local VTON pipeline (step 1 + step 2), return local output         |
| Image NOT in dataset    | Use Segmind API, return API output                                     |

---

## Next Steps
1. **Decide:** Flask API vs. direct script invocation from Node/other backend.
2. **Implement:** The backend logic for file checking, pipeline invocation, and output handling.
3. **Integrate:** Connect the frontend to the new backend endpoint for try-on requests.
4. **Test:** With both dataset and non-dataset images.

---

**Contact the dev team for further details or implementation support.**
