from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import time

from connect_sheet import load_sheet
from clean_duplicates import clean_duplicate_columns
from smart_column_detection import smart_detect_columns
from handle_missing_values import handle_missing_values
from convert_data_types import convert_data_types
from feature_engineering import feature_engineering
from normalize_columns import normalize_columns
from column_validator import validate_columns

# -----------------------------
# CREATE FASTAPI APP
# -----------------------------
app = FastAPI()

# Allow React to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# CACHE VARIABLES
# -----------------------------
cached_data = None
last_update = 0

CACHE_DURATION = 10  # seconds


# -----------------------------
# TEST ROUTE
# -----------------------------
@app.get("/")
def home():
    return {"message": "FSE Dashboard API Running"}


# -----------------------------
# DATA PIPELINE FUNCTION
# -----------------------------
def get_clean_data():

    try:

        df = load_sheet()

        df = clean_duplicate_columns(df)

        numeric_cols, text_cols, date_cols = smart_detect_columns(df)

        df = handle_missing_values(df, numeric_cols, text_cols)

        df = convert_data_types(df, numeric_cols, date_cols)

        df = feature_engineering(df, numeric_cols, date_cols)

        return df

    except Exception as e:

        print("Pipeline Error:", e)

        return pd.DataFrame()


# -----------------------------
# CACHE HANDLER
# -----------------------------
def get_cached_data():

    global cached_data, last_update

    current_time = time.time()

    # Refresh cache only when expired
    if cached_data is None or (current_time - last_update) > CACHE_DURATION:

        df = get_clean_data()

        if df.empty:
            return []

        cached_data = df.to_dict(orient="records")

        last_update = current_time

    return cached_data


# -----------------------------
# DASHBOARD DATA API
# -----------------------------
from fastapi import Query

@app.get("/data")
def get_dashboard_data(month: str = Query(None)):

    data = get_cached_data()

    if not month:
        return data

    filtered = []

    for row in data:

        total = 0
        new_row = row.copy()

        for key in row:

            try:
                date = pd.to_datetime(key)
                if date.strftime("%B") == month:
                    total += float(row[key] or 0)
                else:
                    new_row[key] = 0
            except:
                pass

        new_row["Total_Meetings_Calc"] = total
        filtered.append(new_row)

    return filtered