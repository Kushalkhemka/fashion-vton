import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import shutil
import subprocess
import requests
import base64
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Config
DATASET_IMAGE_DIRS = [
    "/Volumes/Seagate/scw-vton/SCW-VTON/data/test/image",
    "/Volumes/Seagate/scw-vton/SCW-VTON/data/train/image"
]
OUTPUT_DIR = "/Volumes/Seagate/scw-vton/style-flow-motion/public/output"
SCW_VTON_ROOT = "/Volumes/Seagate/scw-vton/SCW-VTON"
STEP1_SCRIPT = "/Volumes/Seagate/scw-vton/SCW-VTON/test_for_step1.py"
STEP2_SCRIPT = "/Volumes/Seagate/scw-vton/SCW-VTON/test_for_step2.py"
TEST_PAIRS_FILENAME = "test_pairs.txt"
TEST_PAIRS_PATH = os.path.join(SCW_VTON_ROOT, "data", TEST_PAIRS_FILENAME)
ABSOLUTE_DATAROOT = "/Volumes/Seagate/scw-vton/SCW-VTON/data"
ABSOLUTE_CONFIG = "/Volumes/Seagate/scw-vton/SCW-VTON/configs/viton.yaml"
ABSOLUTE_CKPT_DIR = "/Volumes/Seagate/scw-vton/SCW-VTON/ckpts"


# Ensure output dir exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def is_in_dataset(filename):
    for d in DATASET_IMAGE_DIRS:
        if filename.startswith("._"):  # Ignore macOS files
            continue
        if os.path.exists(os.path.join(d, filename)):
            return True
    return False

def run_step1_and_step2(model_filename, cloth_filename):
    # Always write to SCW-VTON/data/test_pairs.txt (relative path for scripts)
    with open(TEST_PAIRS_PATH, "w") as f:
        f.write(f"{model_filename} {cloth_filename}\n")
    # Step 1 (NO --data_list)
    subprocess.run([
        "conda", "run", "-n", "scw-vton", "python", STEP1_SCRIPT,
        "--dataroot", ABSOLUTE_DATAROOT,
        "--datamode", "test",
        "--pair_mode", "unpaired",
        "--ckpt_dir", ABSOLUTE_CKPT_DIR,
        "--outdir", "results"
    ], check=True, cwd=SCW_VTON_ROOT)
    # Step 2 (NO --data_list)
    subprocess.run([
        "conda", "run", "-n", "scw-vton", "python", STEP2_SCRIPT,
        "--dataroot", ABSOLUTE_DATAROOT,
        "--pair_mode", "unpaired",
        "--ckpt_dir", ABSOLUTE_CKPT_DIR,
        "--outdir", "results",
        "--pre_data_dir", "results/unpaired",
        "--config", ABSOLUTE_CONFIG
    ], check=True, cwd=SCW_VTON_ROOT)
    # Find output image in the correct directory
    out_img = os.path.join(SCW_VTON_ROOT, "results", "unpaired", "try_on", model_filename.replace(".jpg", ".png"))
    if not os.path.exists(out_img):
        raise FileNotFoundError(f"Output image not found: {out_img}")
    dest_img = os.path.join(OUTPUT_DIR, os.path.basename(out_img))
    shutil.copy(out_img, dest_img)
    return dest_img

def call_segmind_api(model_img_path, cloth_img_path, garment_des="Virtual Try-On"):
    def image_file_to_base64(image_path):
        with open(image_path, 'rb') as f:
            image_data = f.read()
        return base64.b64encode(image_data).decode('utf-8')
    human_img_b64 = image_file_to_base64(model_img_path)
    garm_img_b64 = image_file_to_base64(cloth_img_path)
    data = {
        "crop": False,
        "seed": 42,
        "steps": 30,
        "category": "upper_body",
        "force_dc": False,
        "human_img": human_img_b64,
        "garm_img": garm_img_b64,
        "mask_only": False,
        "garment_des": garment_des
    }
    headers = {'x-api-key': SEG_API_KEY}
    response = requests.post(SEG_API_URL, json=data, headers=headers)
    out_path = os.path.join(OUTPUT_DIR, f"segmind_result_{os.path.basename(model_img_path)}.jpg")
    with open(out_path, "wb") as f:
        f.write(response.content)
    return out_path

@app.route('/tryon', methods=['POST'])
def tryon():
    try:
        model_file = request.files['model_image']
        cloth_filename = request.form['cloth_image']  # Assume cloth is selected from dataset
        model_filename = secure_filename(model_file.filename)
        model_path = os.path.join(OUTPUT_DIR, model_filename)
        model_file.save(model_path)
        # Check if model image is in dataset
        if is_in_dataset(model_filename):
            # Use local pipeline
            out_img = run_step1_and_step2(model_filename, cloth_filename)
            return jsonify({"status": "success", "source": "local", "output_image": f"/output/{os.path.basename(out_img)}"})
        else:
        
            cloth_file = request.files.get('cloth_image_file')
            if cloth_file:
                cloth_path = os.path.join(OUTPUT_DIR, secure_filename(cloth_file.filename))
                cloth_file.save(cloth_path)
            else:
                # Try to find cloth image in dataset
                cloth_path = None
                for d in DATASET_IMAGE_DIRS:
                    candidate = os.path.join(d.replace("image", "cloth"), cloth_filename)
                    if os.path.exists(candidate):
                        cloth_path = candidate
                        break
                if not cloth_path:
                    return jsonify({"status": "error", "message": "Cloth image not found for Segmind API."}), 400
            out_img = call_segmind_api(model_path, cloth_path)
            return jsonify({"status": "success", "source": "segmind", "output_image": f"/output/{os.path.basename(out_img)}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/output/<path:filename>')
def serve_output_file(filename):
    return send_from_directory(OUTPUT_DIR, filename)

@app.route('/upload_image', methods=['POST'])
def upload_image():
    try:
        if 'model_image' not in request.files:
            return jsonify({"status": "error", "message": "No file part"}), 400
        file = request.files['model_image']
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400
        filename = secure_filename(file.filename)
        save_path = os.path.join(OUTPUT_DIR, filename)
        file.save(save_path)
        # Return the public URL (using ngrok base URL)
        public_url = f"https://winston-struggle-alto-skirt.trycloudflare.com/output/{filename}"
        return jsonify({"status": "success", "public_url": public_url})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 360 Video Generation Endpoints ---
import time

@app.route('/generate_360_video', methods=['POST'])
def generate_360_video():
    try:
        data = request.get_json()
        image_url = data.get('image_url')
        if not image_url:
            return jsonify({"status": "error", "message": "Missing image_url"}), 400

        api_key = "SG_304d3bf4ba67ebc6"
        segmind_url = "https://api.segmind.com/workflows/683a8839558645d556597ca4-v2"
        payload = {"Fashion_Model": image_url}
        headers = {'x-api-key': api_key, 'Content-Type': 'application/json'}

        response = requests.post(segmind_url, json=payload, headers=headers)
        if response.status_code != 200:
            return jsonify({"status": "error", "message": "Segmind API error", "details": response.text}), 500

        return jsonify(response.json())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/poll_360_video', methods=['POST'])
def poll_360_video():
    try:
        data = request.get_json()
        poll_url = data.get('poll_url')
        if not poll_url:
            return jsonify({"status": "error", "message": "Missing poll_url"}), 400

        api_key = "SG_304d3bf4ba67ebc6"
        headers = {'x-api-key': api_key}
        response = requests.get(poll_url, headers=headers)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True) 