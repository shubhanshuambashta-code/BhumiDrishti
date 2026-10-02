import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
import json

def load_and_validate_csv(filepath: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(filepath)
        return df
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return pd.DataFrame()

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=['ownership_risk', 'legal_risk', 'compensation_risk'])
    df = df.fillna(0)
    return df

def validate_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    if 'latitude' in df.columns and 'longitude' in df.columns:
        df = df[(df['latitude'].between(-90, 90)) & (df['longitude'].between(-180, 180))]
    return df

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    if 'area_hectares' not in df.columns:
        df['area_hectares'] = np.random.uniform(0.1, 100, len(df))
    return df

def calculate_risk_score(row: pd.Series) -> float:
    # weighted formula: score = (ownership_risk*2 + legal_risk*2.5 + compensation_risk*2 + environmental_risk*1.5 + social_risk*1 + delay_risk*1) * 10 / 10
    score = (
        row.get('ownership_risk', 0) * 2 +
        row.get('legal_risk', 0) * 2.5 +
        row.get('compensation_risk', 0) * 2 +
        row.get('environmental_risk', 0) * 1.5 +
        row.get('social_risk', 0) * 1 +
        row.get('delay_risk', 0) * 1
    ) # max is 10 * 10 = 100
    return min(max(score, 0), 100)

def generate_geojson(df: pd.DataFrame) -> dict:
    if 'longitude' in df.columns and 'latitude' in df.columns:
        geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry)
        return json.loads(gdf.to_json())
    return {"type": "FeatureCollection", "features": []}

if __name__ == "__main__":
    print("Data processor module.")
