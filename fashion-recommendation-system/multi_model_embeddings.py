import tensorflow
from tensorflow.keras.preprocessing import image
from tensorflow.keras.layers import GlobalMaxPooling2D
from tensorflow.keras.applications import EfficientNetB7, NASNetLarge, InceptionResNetV2, Xception, ResNet101
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess
from tensorflow.keras.applications.nasnet import preprocess_input as nasnet_preprocess
from tensorflow.keras.applications.inception_resnet_v2 import preprocess_input as inceptionresnet_preprocess
from tensorflow.keras.applications.xception import preprocess_input as xception_preprocess
from tensorflow.keras.applications.resnet import preprocess_input as resnet_preprocess
import numpy as np
from numpy.linalg import norm
import os
from tqdm import tqdm
import pickle

MODELS = [
    {
        'name': 'ResNet101',
        'model': ResNet101(weights='imagenet', include_top=False, input_shape=(224,224,3)),
        'preprocess': resnet_preprocess,
        'input_shape': (224,224)
    },
    {
        'name': 'NASNetLarge',
        'model': NASNetLarge(weights='imagenet', include_top=False, input_shape=(331,331,3)),
        'preprocess': nasnet_preprocess,
        'input_shape': (331,331)
    },
    {
        'name': 'InceptionResNetV2',
        'model': InceptionResNetV2(weights='imagenet', include_top=False, input_shape=(299,299,3)),
        'preprocess': inceptionresnet_preprocess,
        'input_shape': (299,299)
    },
    {
        'name': 'Xception',
        'model': Xception(weights='imagenet', include_top=False, input_shape=(299,299,3)),
        'preprocess': xception_preprocess,
        'input_shape': (299,299)
    }
]

# NOTE: For true SOTA feature extraction of fashion items, consider models like CLIP, ViT, or Swin Transformer. These are not available in TensorFlow Keras applications by default, but can be used via HuggingFace Transformers or timm (PyTorch).

valid_extensions = ('.jpg', '.jpeg', '.png')
image_dir = 'images/cloth'

filenames = []
for file in os.listdir(image_dir):
    if file.lower().endswith(valid_extensions) and not file.startswith('._'):
        filenames.append(os.path.join(image_dir, file))

def extract_features(img_path, model, preprocess_func, input_shape):
    img = image.load_img(img_path, target_size=input_shape)
    img_array = image.img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_func(expanded_img_array)
    result = model.predict(preprocessed_img).flatten()
    normalized_result = result / norm(result)
    return normalized_result

for m in MODELS:
    print(f"Processing model: {m['name']}")
    base_model = m['model']
    base_model.trainable = False
    model = tensorflow.keras.Sequential([
        base_model,
        GlobalMaxPooling2D()
    ])
    feature_list = []
    for file in tqdm(filenames):
        try:
            feature_list.append(extract_features(file, model, m['preprocess'], m['input_shape']))
        except Exception as e:
            print(f"Skipping {file}: {e}")
    pickle.dump(feature_list, open(f'embeddings_{m["name"]}.pkl', 'wb'))
    pickle.dump(filenames, open(f'filenames_{m["name"]}.pkl', 'wb'))
    print(f"Done with {m['name']}\n") 