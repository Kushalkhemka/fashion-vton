#!/usr/bin/env python3
"""
Script to generate image-parse-agnostic-v3.2 files
This script uses the get_parse_agnostic_fixed.py from HR-VITON
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # Get current directory
    current_dir = Path.cwd()
    print(f"Current directory: {current_dir}")
    
    # Check if we're in the right directory
    if not (current_dir / "HR-VITON").exists():
        print("Error: HR-VITON directory not found!")
        print("Please run this script from the root directory where HR-VITON is located.")
        return
    
    # Change to HR-VITON directory
    os.chdir("HR-VITON")
    print(f"Changed to directory: {Path.cwd()}")
    
    # Check if get_parse_agnostic_fixed.py exists
    if not Path("get_parse_agnostic_fixed.py").exists():
        print("Error: get_parse_agnostic_fixed.py not found in HR-VITON directory!")
        return
    
    # Create output directories
    output_dirs = [
        "../kaggle/working/data/train/image-parse-agnostic-v3.2",
        "../kaggle/working/data/test/image-parse-agnostic-v3.2"
    ]
    
    for dir_path in output_dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {dir_path}")
    
    # Check if input data exists
    train_data_path = "../kaggle/input/high-resolution-viton-zalando-dataset/train"
    test_data_path = "../kaggle/input/high-resolution-viton-zalando-dataset/test"
    
    if not Path(train_data_path).exists():
        print(f"Error: Training data not found at {train_data_path}")
        return
    
    if not Path(test_data_path).exists():
        print(f"Error: Test data not found at {test_data_path}")
        return
    
    print("Input data directories found!")
    
    # Run the script for training data
    print("\n" + "="*50)
    print("PROCESSING TRAINING DATA - image-parse-agnostic-v3.2")
    print("="*50)
    
    train_cmd = [
        "python", "get_parse_agnostic_fixed.py",
        "--data_path", train_data_path,
        "--output_path", "../kaggle/working/data/train/image-parse-agnostic-v3.2"
    ]
    
    print(f"Running command: {' '.join(train_cmd)}")
    
    try:
        result = subprocess.run(train_cmd, check=True, capture_output=True, text=True)
        print("Training data processing completed successfully!")
        print("Output:", result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error processing training data: {e}")
        print("Error output:", e.stderr)
        return
    
    # Run the script for test data
    print("\n" + "="*50)
    print("PROCESSING TEST DATA - image-parse-agnostic-v3.2")
    print("="*50)
    
    test_cmd = [
        "python", "get_parse_agnostic_fixed.py",
        "--data_path", test_data_path,
        "--output_path", "../kaggle/working/data/test/image-parse-agnostic-v3.2"
    ]
    
    print(f"Running command: {' '.join(test_cmd)}")
    
    try:
        result = subprocess.run(test_cmd, check=True, capture_output=True, text=True)
        print("Test data processing completed successfully!")
        print("Output:", result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error processing test data: {e}")
        print("Error output:", e.stderr)
        return
    
    print("\n" + "="*50)
    print("ALL PROCESSING COMPLETED SUCCESSFULLY!")
    print("="*50)
    
    # Show results
    print("\nGenerated files:")
    for dir_path in output_dirs:
        if Path(dir_path).exists():
            file_count = len(list(Path(dir_path).glob("*")))
            print(f"  {dir_path}: {file_count} files")
    
    print("\n" + "="*50)
    print("NOTE: For image-densepose generation, use the pre-generated files from the Kaggle dataset")
    print("or install DensePose externally if you need to generate new densepose images.")
    print("="*50)

if __name__ == "__main__":
    main() 