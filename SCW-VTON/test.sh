#!/bin/bash
# Run with smaller batch size to save memory and disk space
python test_for_step1.py --outdir ./results --dataroot ./data --ckpt_dir ./ckpts --pair_mode unpaired --batch-size 1
python test_for_step2.py --outdir ./results --dataroot ./data --ckpt_dir ./ckpts --pair_mode unpaired --plms --n_samples 1



