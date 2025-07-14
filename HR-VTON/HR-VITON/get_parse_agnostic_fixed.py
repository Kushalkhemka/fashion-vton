import json
from os import path as osp
import os

import numpy as np
from PIL import Image, ImageDraw

import argparse

from tqdm import tqdm


def get_im_parse_agnostic(im_parse, pose_data, w=768, h=1024):
    parse_array = np.array(im_parse)
    parse_upper = ((parse_array == 5).astype(np.float32) +
                    (parse_array == 6).astype(np.float32) +
                    (parse_array == 7).astype(np.float32))
    parse_neck = (parse_array == 10).astype(np.float32)

    r = 10
    agnostic = im_parse.copy()

    # mask arms
    for parse_id, pose_ids in [(14, [2, 5, 6, 7]), (15, [5, 2, 3, 4])]:
        mask_arm = Image.new('L', (w, h), 'black')
        mask_arm_draw = ImageDraw.Draw(mask_arm)
        i_prev = pose_ids[0]
        for i in pose_ids[1:]:
            if (pose_data[i_prev, 0] == 0.0 and pose_data[i_prev, 1] == 0.0) or (pose_data[i, 0] == 0.0 and pose_data[i, 1] == 0.0):
                continue
            mask_arm_draw.line([tuple(pose_data[j]) for j in [i_prev, i]], 'white', width=r*10)
            pointx, pointy = pose_data[i]
            radius = r*4 if i == pose_ids[-1] else r*15
            mask_arm_draw.ellipse((pointx-radius, pointy-radius, pointx+radius, pointy+radius), 'white', 'white')
            i_prev = i
        parse_arm = (np.array(mask_arm) / 255) * (parse_array == parse_id).astype(np.float32)
        agnostic.paste(0, None, Image.fromarray(np.uint8(parse_arm * 255), 'L'))

    # mask torso & neck
    agnostic.paste(0, None, Image.fromarray(np.uint8(parse_upper * 255), 'L'))
    agnostic.paste(0, None, Image.fromarray(np.uint8(parse_neck * 255), 'L'))

    return agnostic


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


if __name__=="__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_path', type=str, help="dataset dir")
    parser.add_argument('--output_path', type=str, help="output dir")

    args = parser.parse_args()
    data_path = args.data_path
    output_path = args.output_path
    
    os.makedirs(output_path, exist_ok=True)
    
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
            im_parse = Image.open(parse_path)
            agnostic = get_im_parse_agnostic(im_parse, pose_data)
            agnostic.save(osp.join(output_path, parse_name))
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing parse for {im_name}: {str(e)}")
            error_count += 1
            continue
    
    print(f"\nProcessing complete!")
    print(f"Successfully processed: {processed_count} files")
    print(f"Errors encountered: {error_count} files") 