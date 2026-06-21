import pickle
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
print("Current Working Directory:", os.getcwd())
print("Backend directory:", backend_dir)

try:
    model_path = "backend/random_forest_dropout_model.pkl"
    feature_cols_path = "backend/feature_columns.pkl"
    model = pickle.load(open(model_path, "rb"))
    feature_columns = pickle.load(open(feature_cols_path, "rb"))
    print("Loaded using relative 'backend/' path.")
except FileNotFoundError:
    model_path = os.path.join(backend_dir, "random_forest_dropout_model.pkl")
    feature_cols_path = os.path.join(backend_dir, "feature_columns.pkl")
    model = pickle.load(open(model_path, "rb"))
    feature_columns = pickle.load(open(feature_cols_path, "rb"))
    print("Loaded using absolute backend_dir path.")

print("Model Type:", type(model))
print("Feature Columns:", feature_columns)
print("Number of columns:", len(feature_columns))
