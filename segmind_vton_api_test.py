import requests
import base64

# Use this function to convert an image file from the filesystem to base64
def image_file_to_base64(image_path):
    with open(image_path, 'rb') as f:
        image_data = f.read()
    return base64.b64encode(image_data).decode('utf-8')

api_key = "SG_8eecc1cccd02d40b"
url = "https://api.segmind.com/v1/idm-vton"

# Paths to your local images
model_image_path = "SCW-VTON/data/test/image/00705_00.jpg"
cloth_image_path = "SCW-VTON/data/test/cloth/12500_00.jpg"

# Convert local images to base64
human_img_b64 = image_file_to_base64(model_image_path)
garm_img_b64 = image_file_to_base64(cloth_image_path)

# Request payload
data = {
    "crop": False,
    "seed": 42,
    "steps": 30,
    "category": "upper_body",
    "force_dc": False,
    "human_img": human_img_b64,
    "garm_img": garm_img_b64,
    "mask_only": False,
    "garment_des": "Green colour semi Formal Blazer"
}

headers = {'x-api-key': api_key}

response = requests.post(url, json=data, headers=headers)
print(f"Status code: {response.status_code}")

# Always save the response as a JPEG for rendering
output_path = "vton_result.jpg"
with open(output_path, "wb") as f:
    f.write(response.content)
print(f"Response content saved to {output_path} (may or may not be a valid image)")

if response.status_code == 200:
    print(f"Result saved to {output_path}")
else:
    print("Response headers:", response.headers)
    print("Response content (decoded):", response.content.decode(errors='replace')) 