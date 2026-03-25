from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import pandas as pd
import time
import threading
import gspread
from oauth2client.service_account import ServiceAccountCredentials

from connect_sheet import load_sheet
from clean_duplicates import clean_duplicate_columns
from smart_column_detection import smart_detect_columns
from handle_missing_values import handle_missing_values
from convert_data_types import convert_data_types
from feature_engineering import feature_engineering
from history_store import merge_with_history

# -----------------------------
# CREATE FASTAPI APP
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# ONBOARD COLUMN CONFIG — update here when monthly condition changes
# -----------------------------
ONBOARD_COLUMN_BY_MONTH = {
    "January 2026":  "Tide OB with PP",
    "February 2026": "Tide OB with PP",
    "March 2026":    "Tide OB with PP + 5K QR Load + 4 Txns",
    # Add future months here, e.g.:
    # "April 2026": "Tide OB with PP",
}
DEFAULT_ONBOARD_COLUMN = "Tide OB with PP"  # fallback for unmapped months


# -----------------------------
# CACHE VARIABLES
# -----------------------------
cached_data = None
last_update = 0

# Force reload on startup so combined FSE + Old working data is picked up
CACHE_DURATION = 300  # seconds (5 minutes)


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

        # Merge with historical data so previous months are preserved
        df = merge_with_history(df)

        numeric_cols, text_cols, date_cols = smart_detect_columns(df)

        df = handle_missing_values(df, numeric_cols, text_cols)

        df = convert_data_types(df, numeric_cols, date_cols)

        df, daily_trend, monthly_meetings, tl_performance, total_meetings, product_columns, product_totals, product_groups = feature_engineering(
            df, numeric_cols, date_cols
        )

        return (
            df,
            daily_trend,
            monthly_meetings,
            tl_performance,
            total_meetings,
            product_columns,
            product_totals,
            product_groups
        )

    except Exception as e:

        print("Pipeline Error:", e)

        return pd.DataFrame(), [], {}, {}, 0, [], {}, {}


# -----------------------------
# CACHE HANDLER
# -----------------------------
_refresh_lock = threading.Lock()

def _refresh_cache():
    """Run the full pipeline and update the cache. Thread-safe."""
    global cached_data, last_update
    df, daily_trend, monthly_meetings, tl_performance, total_meetings, product_columns, product_totals, product_groups = get_clean_data()
    if isinstance(df, pd.DataFrame) and df.empty:
        return
    with _refresh_lock:
        cached_data = {
            "raw": df.to_dict(orient="records"),
            "meeting_trend": daily_trend,
            "monthly_meetings": monthly_meetings,
            "tl_performance": tl_performance,
            "total_meetings": float(total_meetings),
            "product_columns": product_columns,
            "product_totals": product_totals,
            "product_groups": product_groups,
            "onboard_column_by_month": ONBOARD_COLUMN_BY_MONTH,
            "default_onboard_column": DEFAULT_ONBOARD_COLUMN,
        }
        last_update = time.time()
    print(f"[Cache] Refreshed — {len(cached_data['raw'])} rows")


def get_cached_data():
    global cached_data, last_update
    now = time.time()
    stale = cached_data is None or (now - last_update) > CACHE_DURATION
    if stale:
        if cached_data is None:
            # First load — must block until we have data
            _refresh_cache()
        else:
            # Stale but we have data — refresh in background, return old data instantly
            threading.Thread(target=_refresh_cache, daemon=True).start()
    return cached_data or {}


# -----------------------------
# DASHBOARD DATA API
# -----------------------------
@app.get("/data")
def get_dashboard_data():
    return get_cached_data()


# -----------------------------
# SHEET UPDATE API
# -----------------------------
class UpdateRequest(BaseModel):
    email: str          # identify row by Email ID
    column: str         # column name to update
    value: Any          # new value

def get_sheet_client():
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
    client = gspread.authorize(creds)
    return client.open("VV - Day Working (Responses)").worksheet("FSE")

@app.post("/update-row")
def update_row(req: UpdateRequest):
    try:
        ws = get_sheet_client()
        all_values = ws.get_all_values()

        # Row 3 (index 2) is the header row (0-indexed)
        header_row = all_values[2]

        # Find column index
        if req.column not in header_row:
            return {"success": False, "error": f"Column '{req.column}' not found in sheet"}
        col_idx = header_row.index(req.column) + 1  # gspread is 1-indexed

        # Find Email ID column
        if "Email ID" not in header_row:
            return {"success": False, "error": "Email ID column not found"}
        email_col_idx = header_row.index("Email ID") + 1

        # Data starts at row 4 (index 3), so sheet row = index + 4
        target_row = None
        for i, row in enumerate(all_values[3:], start=4):
            if len(row) >= email_col_idx and row[email_col_idx - 1] == req.email:
                target_row = i
                break

        if target_row is None:
            return {"success": False, "error": f"Email '{req.email}' not found in sheet"}

        ws.update_cell(target_row, col_idx, req.value)

        # Invalidate cache so next fetch gets fresh data
        global cached_data, last_update
        cached_data = None
        last_update = 0

        return {"success": True, "row": target_row, "col": col_idx}

    except Exception as e:
        return {"success": False, "error": str(e)}


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    # Warm cache in background so first request is instant
    threading.Thread(target=get_cached_data, daemon=True).start()
    uvicorn.run("api_server:app", host="127.0.0.1", port=8001, reload=False)
