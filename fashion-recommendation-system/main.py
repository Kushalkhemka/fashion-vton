import streamlit as st
import os
from PIL import Image
import numpy as np
import pickle
import tensorflow
from tensorflow.keras.preprocessing import image
from tensorflow.keras.layers import GlobalMaxPooling2D
from tensorflow.keras.applications.resnet50 import ResNet50,preprocess_input
from sklearn.neighbors import NearestNeighbors
from numpy.linalg import norm
from tensorflow.keras.applications import EfficientNetB7
from tensorflow.keras.applications.efficientnet import preprocess_input
import json

# Model options and their configs
MODEL_OPTIONS = {
    'EfficientNetB7': {
        'embedding_file': 'embeddings.pkl',
        'filenames_file': 'filenames.pkl',
        'model': EfficientNetB7,
        'input_shape': (600, 600),
        'preprocess': preprocess_input
    },
    'Xception': {
        'embedding_file': 'embeddings_Xception.pkl',
        'filenames_file': 'filenames_Xception.pkl',
        'model': tensorflow.keras.applications.Xception,
        'input_shape': (299, 299),
        'preprocess': tensorflow.keras.applications.xception.preprocess_input
    },
    'ResNet101': {
        'embedding_file': 'embeddings_ResNet101.pkl',
        'filenames_file': 'filenames_ResNet101.pkl',
        'model': tensorflow.keras.applications.ResNet101,
        'input_shape': (224, 224),
        'preprocess': tensorflow.keras.applications.resnet.preprocess_input
    },
    'NASNetLarge': {
        'embedding_file': 'embeddings_NASNetLarge.pkl',
        'filenames_file': 'filenames_NASNetLarge.pkl',
        'model': tensorflow.keras.applications.NASNetLarge,
        'input_shape': (331, 331),
        'preprocess': tensorflow.keras.applications.nasnet.preprocess_input
    },
    'InceptionResNetV2': {
        'embedding_file': 'embeddings_InceptionResNetV2.pkl',
        'filenames_file': 'filenames_InceptionResNetV2.pkl',
        'model': tensorflow.keras.applications.InceptionResNetV2,
        'input_shape': (299, 299),
        'preprocess': tensorflow.keras.applications.inception_resnet_v2.preprocess_input
    }
}

st.title('Fashion Recommender System')

# Model selection UI
selected_model = st.selectbox(
    'Select Model for Recommendations',
    list(MODEL_OPTIONS.keys()),
    index=0  # Default to EfficientNetB7
)

# Load embeddings and filenames for selected model
option = MODEL_OPTIONS[selected_model]
feature_list = np.array(pickle.load(open(option['embedding_file'], 'rb')))
# Update filenames to use the correct cloth directory and ignore MacOS '._' files
cloth_dir = '/Volumes/Seagate/scw-vton/SCW-VTON/data/train/cloth'
filenames = [os.path.join(cloth_dir, f) for f in os.listdir(cloth_dir) if not f.startswith('._')]

# Load tag metadata
with open('vitonhd_train_tagged.json', 'r') as f:
    tag_data = json.load(f)["data"]

# Build a mapping from file_name to tag_info for fast lookup
tag_map = {entry["file_name"]: entry["tag_info"] for entry in tag_data}

def get_tag_dict(tag_info):
    """Convert tag_info list to a dict for easy comparison."""
    return {tag['tag_name']: tag['tag_category'] for tag in tag_info}

def tag_similarity(query_tags, candidate_tags, weights):
    """Compute weighted tag similarity score between two tag dicts."""
    score = 0.0
    max_score = sum(weights.values())
    for tag, weight in weights.items():
        if tag in query_tags and tag in candidate_tags and query_tags[tag] == candidate_tags[tag]:
            score += weight
    return score, max_score

# Define tag weights (tunable)
tag_weights = {
    'item': 0.5,
    'looks': 0.4,
    'length': 0.3,
    'neckLine': 0.3,
    'prints': 0.1,
    'colors': 0.1,
    'details': 0.1,
    # 'fit': 0.0,  # ignored
    # 'textures': 0.0,  # ignored
}

# Load the selected model
base_model = option['model'](weights='imagenet', include_top=False, input_shape=option['input_shape'] + (3,))
base_model.trainable = False
model = tensorflow.keras.Sequential([
    base_model,
    GlobalMaxPooling2D()
])

def save_uploaded_file(uploaded_file):
    try:
        os.makedirs('uploads', exist_ok=True)  # Ensure the directory exists
        with open(os.path.join('uploads', uploaded_file.name), 'wb') as f:
            f.write(uploaded_file.getbuffer())
        return 1
    except Exception as e:
        print("File upload error:", e)  # Optional: log the error for debugging
        return 0

def feature_extraction(img_path, model, input_shape, preprocess_func):
    img = image.load_img(img_path, target_size=input_shape)
    img_array = image.img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_func(expanded_img_array)
    result = model.predict(preprocessed_img).flatten()
    normalized_result = result / norm(result)
    return normalized_result

def recommend(features, feature_list, n_neighbors=25):
    neighbors = NearestNeighbors(n_neighbors=n_neighbors, algorithm='brute', metric='euclidean')
    neighbors.fit(feature_list)
    distances, indices = neighbors.kneighbors([features])
    return distances[0], indices[0]

# Dropdown/filter options (from extracted unique values)
item_options = [''] + ['Bikini Top', 'Blouse', 'Blouson', 'Bolero', 'Bra Top', 'Bustier', 'Camisole', 'Cape/Shawl', 'Cardigan', 'Denim Dress', 'Fitness Jacket', 'Full Zip Jacket', 'Full Zip Vest', 'Fur Jacket', 'Halter Neck Dress', 'Hoodie', 'Jacket', 'Jumper Dress', 'Knit Dress', 'Knit vest', 'Leather Jacket', 'Leggings/Treggings', 'Offshoulder Dress', 'One piece Swimsuit', 'Pique Dress', 'Pleats Skirt', 'Polo Shirts', 'Ruffle skirt', 'Sarong skirt', 'Shirt Dress', 'Shirts', 'Slip Dress', 'Sweat Pants', 'Sweater', 'Sweatshirt', 'T-shirts', 'Tank Top', 'Trumpet Skirt', 'Tube Top', 'Tunic Dress', 'Turtleneck', 'Vest', 'Vest Suit', 'Wide Pants', 'Wrap Dress', 'Wrap Skirt', 'Y-Shirts', 'denim skirt', 'flared skirt', 'pajama-top']
looks_options = [''] + ['Casual', 'Ethnic', 'Feminine', 'Marine', 'Military', 'Office look', 'Outdoor Sports', 'Party', 'Preppy', 'Punk', 'Resort', 'Retro']
colors_options = [''] + ['Beige', 'Black', 'Blue', 'Brown', 'Green', 'Grey', 'Khaki', 'Lavender', 'Mint', 'Navy', 'Orange', 'Pink', 'Purple', 'Red', 'Sky Blue', 'White', 'Wine', 'Yellow']
sleeveLength_options = [''] + ['Cropped Sleeve', 'Long Sleeve', 'Short Sleeve', 'Sleeveless']
length_options = [''] + ['cropped', 'half', 'kneelength', 'long', 'midi', 'mini', 'normal', 'short']
neckLine_options = [''] + ['Bow Collar', 'Collarless', 'Halter Neck', 'Hood', 'Offshoulder', 'Round Neck', 'Shawl Collar', 'Shirt Collar', 'Square Neck', 'Stand-up Collar', 'Tailored Collar', 'Turtle Neck', 'U Neck', 'V Neck']
prints_options = [''] + ['Camouflage', 'Check', 'Dot', 'Floral', 'Gradation', 'Leopard', 'Paisley', 'Skull', 'Solid', 'Stripe', 'Tiedyed', 'Zebra', 'ZigZag', 'graphic', 'lettering']

# UI: Hard filter selectors
with st.expander('Filter by attributes (hard filtering, optional)', expanded=False):
    selected_item = st.selectbox('Item', item_options)
    selected_looks = st.selectbox('Looks', looks_options)
    selected_colors = st.selectbox('Colors', colors_options)
    selected_sleeveLength = st.selectbox('Sleeve Length', sleeveLength_options)
    selected_length = st.selectbox('Length', length_options)
    selected_neckLine = st.selectbox('Neck Line', neckLine_options)
    selected_prints = st.selectbox('Prints', prints_options)

# steps
# file upload -> save
uploaded_file = st.file_uploader("Choose an image")
if uploaded_file is not None:
    if save_uploaded_file(uploaded_file):
        # display the uploaded file (revert to original behavior)
        display_image = Image.open(uploaded_file)
        st.image(display_image)
        # feature extract
        features = feature_extraction(
            os.path.join("uploads", uploaded_file.name),
            model,
            option['input_shape'],
            option['preprocess']
        )
        # Get top 25 candidates by embedding distance
        distances, indices = recommend(features, feature_list, n_neighbors=25)
        # Get query image's tags (if available)
        query_filename = uploaded_file.name
        query_tags = None
        if query_filename in tag_map:
            query_tags = get_tag_dict(tag_map[query_filename])
        # Prepare reranking with hard filtering
        rerank_list = []
        for rank, (dist, idx) in enumerate(zip(distances, indices)):
            candidate_path = filenames[idx]
            candidate_filename = os.path.basename(candidate_path)
            candidate_tags = get_tag_dict(tag_map.get(candidate_filename, []))
            # Hard filtering: skip if any selected filter does not match
            if (
                (selected_item and candidate_tags.get('item') != selected_item) or
                (selected_looks and candidate_tags.get('looks') != selected_looks) or
                (selected_colors and candidate_tags.get('colors') != selected_colors) or
                (selected_sleeveLength and candidate_tags.get('sleeveLength') != selected_sleeveLength) or
                (selected_length and candidate_tags.get('length') != selected_length) or
                (selected_neckLine and candidate_tags.get('neckLine') != selected_neckLine) or
                (selected_prints and candidate_tags.get('prints') != selected_prints)
            ):
                continue
            # Tag similarity
            if query_tags:
                tag_score, max_tag_score = tag_similarity(query_tags, candidate_tags, tag_weights)
                tag_score_norm = tag_score / max_tag_score if max_tag_score > 0 else 0.0
            else:
                tag_score_norm = 0.0
            rerank_list.append({
                'idx': idx,
                'distance': dist,
                'tag_score_norm': tag_score_norm,
                'candidate_path': candidate_path
            })
        # If no candidates after filtering, show message
        if not rerank_list:
            st.warning('No results found for the selected filters. Please relax your filters and try again.')
        else:
            # Normalize embedding distances to similarity (higher is better)
            dists = [x['distance'] for x in rerank_list]
            d_min, d_max = min(dists), max(dists)
            for x in rerank_list:
                if d_max > d_min:
                    x['emb_sim'] = 1 - (x['distance'] - d_min) / (d_max - d_min)
                else:
                    x['emb_sim'] = 1.0
            # Combine scores (alpha = 0.5)
            alpha = 0.5
            for x in rerank_list:
                x['final_score'] = alpha * x['emb_sim'] + (1 - alpha) * x['tag_score_norm']
            # Sort by final score (descending)
            rerank_list.sort(key=lambda x: x['final_score'], reverse=True)
            # Show top 5
            col1, col2, col3, col4, col5 = st.columns(5)
            for i, col in enumerate([col1, col2, col3, col4, col5]):
                if i < len(rerank_list):
                    img_path = filenames[rerank_list[i]['idx']]
                    if os.path.exists(img_path):
                        col.image(img_path)
                    else:
                        col.warning(f"Image not found: {img_path}")
    else:
        st.header("Some error occured in file upload")

