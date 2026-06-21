import pickle
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))

print("=" * 60)
print("METADATA.PKL INSPECTION")
print("=" * 60)

with open(os.path.join(backend_dir, "metadata.pkl"), "rb") as f:
    meta = pickle.load(f)

print("Type:", type(meta))
print()

if isinstance(meta, dict):
    for key, val in meta.items():
        print(f"  KEY: {key!r}")
        print(f"  VALUE: {val!r}")
        print()
else:
    print("RAW VALUE:", repr(meta))

# Check scaler
print("=" * 60)
print("SCALER.PKL INSPECTION")
print("=" * 60)
with open(os.path.join(backend_dir, "scaler.pkl"), "rb") as f:
    scaler = pickle.load(f)
print("Scaler type:", type(scaler).__name__)
if hasattr(scaler, "feature_names_in_"):
    print("Scaler feature_names_in_:", list(scaler.feature_names_in_))
if hasattr(scaler, "n_features_in_"):
    print("Scaler n_features_in_:", scaler.n_features_in_)

# Check model
print("=" * 60)
print("MODEL.PKL INSPECTION")
print("=" * 60)
with open(os.path.join(backend_dir, "model.pkl"), "rb") as f:
    model = pickle.load(f)
print("Model type:", type(model).__name__)
if hasattr(model, "n_features_in_"):
    print("Model n_features_in_:", model.n_features_in_)
if hasattr(model, "feature_names_in_"):
    print("Model feature_names_in_:", list(model.feature_names_in_))
