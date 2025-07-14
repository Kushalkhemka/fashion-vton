from flask import Flask, request, jsonify
import pickle
import numpy as np
import json
from sklearn.neighbors import NearestNeighbors
from flask_cors import CORS
import os

# --- Load your model and data as in main.py ---
with open('embeddings.pkl', 'rb') as f:
    feature_list = np.array(pickle.load(f))
with open('filenames.pkl', 'rb') as f:
    filenames = pickle.load(f)

with open('vitonhd_train_tagged.json', 'r') as f:
    tag_data = json.load(f)["data"]

# Build a mapping from file_name (basename only) to index
filename_to_index = {os.path.basename(fn): idx for idx, fn in enumerate(filenames)}

# --- Flask app ---
app = Flask(__name__)
CORS(app)

@app.route('/similar', methods=['POST'])
def similar():
    data = request.json
    file_name = data.get('file_name')
    if file_name not in filename_to_index:
        return jsonify({'error': 'file_name not found'}), 404

    idx = filename_to_index[file_name]
    query_feature = feature_list[idx]

    # Find 10 nearest neighbors (excluding the query itself)
    neighbors = NearestNeighbors(n_neighbors=11, algorithm='brute', metric='euclidean')
    neighbors.fit(feature_list)
    distances, indices = neighbors.kneighbors([query_feature])
    similar_indices = [i for i in indices[0] if i != idx][:10]
    similar_files = [os.path.basename(filenames[i]) for i in similar_indices]

    return jsonify({'similar': similar_files})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 