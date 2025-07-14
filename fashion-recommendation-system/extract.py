import json
from collections import defaultdict

# Path to your JSON file
json_path = "/Users/kushalkhemka/Desktop/fashion_recommender_system/fashion-recommender-system/vitonhd_train_tagged.json"

# Load the JSON data
with open(json_path, "r") as f:
    data = json.load(f)["data"]

# Dictionary to store unique values for each tag_name
unique_values = defaultdict(set)

# Iterate through all entries and collect unique tag_category values for each tag_name
for entry in data:
    for tag in entry["tag_info"]:
        tag_name = tag["tag_name"]
        tag_category = tag["tag_category"]
        if tag_category is not None:
            unique_values[tag_name].add(tag_category)

# Print the unique values for each tag_name
for tag_name, values in unique_values.items():
    print(f"{tag_name}: {sorted(values)}\n")