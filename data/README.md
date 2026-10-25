# Data Directory

## Structure

- `raw/` — Original RetailRocket dataset files (not committed to git)
  - `events.csv` — User interaction events (view, addtocart, transaction)
  - `item_properties_part1.csv` — Item property snapshots part 1
  - `item_properties_part2.csv` — Item property snapshots part 2
  - `category_tree.csv` — Category hierarchy

- `processed/` — Preprocessed outputs from the Colab notebook (not committed to git)
  - `model_ready_dataset.parquet` — Final model-ready dataset (6,516 rows, 18 columns)
  - `labeled_units_with_all_features.csv` — Full features before export
  - Other intermediate files from preprocessing

## Dataset Source

RetailRocket E-commerce Dataset: https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset

## Important Notes

- Raw data files are large (events: 94MB, properties: ~900MB combined)
- These files are excluded from git via .gitignore
- To reproduce: run the preprocessing notebook in Google Colab with the raw data
- The `model_ready_dataset.parquet` is the input for model training
