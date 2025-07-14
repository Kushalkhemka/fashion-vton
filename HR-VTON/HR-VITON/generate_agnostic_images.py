import json
from os import path as osp
import os

import numpy as np
from PIL import Image, ImageDraw

import argparse

from tqdm import tqdm


def load_json_with_encoding_fix(file_path):
    """Load JSON file with multiple encoding attempts"""
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return json.load(f)
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    
    # If all encodings fail, try reading as bytes and decoding
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            # Try to decode and parse
            for encoding in encodings:
                try:
                    decoded = content.decode(encoding)
                    return json.loads(decoded)
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
    except Exception:
        pass
    
    raise ValueError(f"Could not read JSON file {file_path} with any encoding")


def get_agnostic(im, im_parse, pose_data):
    """Generate agnostic image by masking out clothing regions"""
    parse_array = np.array(im_parse)
    parse_head = ((parse_array == 4).astype(np.float32) +
                  (parse_array == 13).astype(np.float32))
    parse_lower = ((parse_array == 9).astype(np.float32) +
                   (parse_array == 12).astype(np.float32) +
                   (parse_array == 16).astype(np.float32) +
                   (parse_array == 17).astype(np.float32) +
                   (parse_array == 18).astype(np.float32) +
                   (parse_array == 19).astype(np.float32))

    agnostic = im.copy()
    agnostic_draw = ImageDraw.Draw(agnostic)

    length_a = np.linalg.norm(pose_data[5] - pose_data[2])
    length_b = np.linalg.norm(pose_data[12] - pose_data[9])
    point = (pose_data[9] + pose_data[12]) / 2
    pose_data[9] = point + (pose_data[9] - point) / length_b * length_a
    pose_data[12] = point + (pose_data[12] - point) / length_b * length_a

    r = int(length_a / 16) + 1

    # mask torso
    for i in [9, 12]:
        pointx, pointy = pose_data[i]
        agnostic_draw.ellipse((pointx-r*3, pointy-r*6, pointx+r*3, pointy+r*6), 'gray', 'gray')
    agnostic_draw.line([tuple(pose_data[i]) for i in [2, 9]], 'gray', width=r*6)
    agnostic_draw.line([tuple(pose_data[i]) for i in [5, 12]], 'gray', width=r*6)
    agnostic_draw.line([tuple(pose_data[i]) for i in [9, 12]], 'gray', width=r*12)
    agnostic_draw.polygon([tuple(pose_data[i]) for i in [2, 5, 12, 9]], 'gray', 'gray')

    # mask neck
    pointx, pointy = pose_data[1]
    agnostic_draw.rectangle((pointx-r*5, pointy-r*9, pointx+r*5, pointy), 'gray', 'gray')

    # mask arms
    agnostic_draw.line([tuple(pose_data[i]) for i in [2, 5]], 'gray', width=r*12)
    for i in [2, 5]:
        pointx, pointy = pose_data[i]
        agnostic_draw.ellipse((pointx-r*5, pointy-r*6, pointx+r*5, pointy+r*6), 'gray', 'gray')
    for i in [3, 4, 6, 7]:
        if (pose_data[i-1, 0] == 0.0 and pose_data[i-1, 1] == 0.0) or (pose_data[i, 0] == 0.0 and pose_data[i, 1] == 0.0):
            continue
        agnostic_draw.line([tuple(pose_data[j]) for j in [i - 1, i]], 'gray', width=r*10)
        pointx, pointy = pose_data[i]
        agnostic_draw.ellipse((pointx-r*5, pointy-r*5, pointx+r*5, pointy+r*5), 'gray', 'gray')

    for parse_id, pose_ids in [(14, [5, 6, 7]), (15, [2, 3, 4])]:
        mask_arm = Image.new('L', (768, 1024), 'white')
        mask_arm_draw = ImageDraw.Draw(mask_arm)
        pointx, pointy = pose_data[pose_ids[0]]
        mask_arm_draw.ellipse((pointx-r*5, pointy-r*6, pointx+r*5, pointy+r*6), 'black', 'black')
        for i in pose_ids[1:]:
            if (pose_data[i-1, 0] == 0.0 and pose_data[i-1, 1] == 0.0) or (pose_data[i, 0] == 0.0 and pose_data[i, 1] == 0.0):
                continue
            mask_arm_draw.line([tuple(pose_data[j]) for j in [i - 1, i]], 'black', width=r*10)
            pointx, pointy = pose_data[i]
            if i != pose_ids[-1]:
                mask_arm_draw.ellipse((pointx-r*5, pointy-r*5, pointx+r*5, pointy+r*5), 'black', 'black')
        mask_arm_draw.ellipse((pointx-r*4, pointy-r*4, pointx+r*4, pointy+r*4), 'black', 'black')

        parse_arm = (np.array(mask_arm) / 255) * (parse_array == parse_id).astype(np.float32)
        agnostic.paste(im, None, Image.fromarray(np.uint8(parse_arm * 255), 'L'))

    agnostic.paste(im, None, Image.fromarray(np.uint8(parse_head * 255), 'L'))
    agnostic.paste(im, None, Image.fromarray(np.uint8(parse_lower * 255), 'L'))
    return agnostic


def generate_agnostic_mask(im, im_parse, pose_data):
    """Generate binary agnostic mask"""
    parse_array = np.array(im_parse)
    
    # Create a white mask (everything visible)
    mask = Image.new('L', im.size, 255)
    mask_draw = ImageDraw.Draw(mask)
    
    # Get pose data dimensions
    length_a = np.linalg.norm(pose_data[5] - pose_data[2])
    length_b = np.linalg.norm(pose_data[12] - pose_data[9])
    point = (pose_data[9] + pose_data[12]) / 2
    pose_data[9] = point + (pose_data[9] - point) / length_b * length_a
    pose_data[12] = point + (pose_data[12] - point) / length_b * length_a

    r = int(length_a / 16) + 1

    # mask torso (black = masked)
    for i in [9, 12]:
        pointx, pointy = pose_data[i]
        mask_draw.ellipse((pointx-r*3, pointy-r*6, pointx+r*3, pointy+r*6), 0, 0)
    mask_draw.line([tuple(pose_data[i]) for i in [2, 9]], 0, width=r*6)
    mask_draw.line([tuple(pose_data[i]) for i in [5, 12]], 0, width=r*6)
    mask_draw.line([tuple(pose_data[i]) for i in [9, 12]], 0, width=r*12)
    mask_draw.polygon([tuple(pose_data[i]) for i in [2, 5, 12, 9]], 0, 0)

    # mask neck
    pointx, pointy = pose_data[1]
    mask_draw.rectangle((pointx-r*5, pointy-r*9, pointx+r*5, pointy), 0, 0)

    # mask arms
    mask_draw.line([tuple(pose_data[i]) for i in [2, 5]], 0, width=r*12)
    for i in [2, 5]:
        pointx, pointy = pose_data[i]
        mask_draw.ellipse((pointx-r*5, pointy-r*6, pointx+r*5, pointy+r*6), 0, 0)
    for i in [3, 4, 6, 7]:
        if (pose_data[i-1, 0] == 0.0 and pose_data[i-1, 1] == 0.0) or (pose_data[i, 0] == 0.0 and pose_data[i, 1] == 0.0):
            continue
        mask_draw.line([tuple(pose_data[j]) for j in [i - 1, i]], 0, width=r*10)
        pointx, pointy = pose_data[i]
        mask_draw.ellipse((pointx-r*5, pointy-r*5, pointx+r*5, pointy+r*5), 0, 0)

    return mask


if __name__=="__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_path', type=str, help="dataset dir")
    parser.add_argument('--agnostic_output', type=str, help="agnostic images output dir")
    parser.add_argument('--mask_output', type=str, help="agnostic masks output dir")

    args = parser.parse_args()
    data_path = args.data_path
    agnostic_output = args.agnostic_output
    mask_output = args.mask_output
    
    os.makedirs(agnostic_output, exist_ok=True)
    os.makedirs(mask_output, exist_ok=True)
    
    processed_count = 0
    error_count = 0
    
    for im_name in tqdm(os.listdir(osp.join(data_path, 'image'))):
        
        # load pose image
        pose_name = im_name.replace('.jpg', '_keypoints.json')
        pose_path = osp.join(data_path, 'openpose_json', pose_name)
        
        # Check if pose file exists
        if not os.path.exists(pose_path):
            print(f"Warning: Pose file not found: {pose_name}")
            error_count += 1
            continue
        
        try:
            # Use the fixed JSON loading function
            pose_label = load_json_with_encoding_fix(pose_path)
            
            # Check if people data exists
            if 'people' not in pose_label or len(pose_label['people']) == 0:
                print(f"Warning: No people data in {pose_name}")
                error_count += 1
                continue
                
            pose_data = pose_label['people'][0]['pose_keypoints_2d']
            pose_data = np.array(pose_data)
            pose_data = pose_data.reshape((-1, 3))[:, :2]
            
        except Exception as e:
            print(f"Error processing {pose_name}: {str(e)}")
            error_count += 1
            continue

        # load parsing image
        parse_name = im_name.replace('.jpg', '.png')
        parse_path = osp.join(data_path, 'image-parse-v3', parse_name)
        
        # Check if parse file exists
        if not os.path.exists(parse_path):
            print(f"Warning: Parse file not found: {parse_name}")
            error_count += 1
            continue
            
        try:
            # Load original image
            im = Image.open(osp.join(data_path, 'image', im_name))
            im_parse = Image.open(parse_path)
            
            # Generate agnostic image
            agnostic = get_agnostic(im, im_parse, pose_data)
            agnostic.save(osp.join(agnostic_output, im_name))
            
            # Generate agnostic mask
            mask = generate_agnostic_mask(im, im_parse, pose_data)
            mask_name = im_name.replace('.jpg', '_mask.png')
            mask.save(osp.join(mask_output, mask_name))
            
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing {im_name}: {str(e)}")
            error_count += 1
            continue
    
    print(f"\nProcessing complete!")
    print(f"Successfully processed: {processed_count} files")
    print(f"Errors encountered: {error_count} files") 