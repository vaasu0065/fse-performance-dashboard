import pandas as pd
import re


def feature_engineering(df, numeric_cols, date_cols):

    # -----------------------------
    # DETECT MEETING DATE COLUMNS
    # -----------------------------

    meeting_columns = []

    for col in df.columns:
        try:
            pd.to_datetime(col)
            meeting_columns.append(col)
        except:
            pass

    if meeting_columns:

        df[meeting_columns] = df[meeting_columns].apply(
            pd.to_numeric, errors="coerce"
        ).fillna(0)

        df["Total_Meetings_Calc"] = df[meeting_columns].sum(axis=1)


    # -----------------------------
    # SMART PRODUCT DETECTION
    # -----------------------------

    product_keywords = {
        "Tide": ["tide"],
        "Vehicle": ["vehicle"],
        "Birla": ["birla"],
        "Airtel": ["airtel"],
        "Hero": ["hero"]
    }

    detected_products = {}

    for product, keywords in product_keywords.items():

        detected_products[product] = []

        for col in df.columns:

            col_lower = str(col).lower()

            if any(keyword in col_lower for keyword in keywords):

                detected_products[product].append(col)


    # -----------------------------
    # CALCULATE PRODUCT TOTALS
    # -----------------------------

    product_total_columns = []

    for product, cols in detected_products.items():

        if cols:

            df[cols] = df[cols].apply(
                pd.to_numeric, errors="coerce"
            ).fillna(0)

            new_col = f"{product}_Sales"

            df[new_col] = df[cols].sum(axis=1)

            product_total_columns.append(new_col)


    # -----------------------------
    # FINAL PRODUCT SALES
    # -----------------------------

    if product_total_columns:

        df["Total_Product_Sales"] = df[product_total_columns].sum(axis=1)


    # -----------------------------
    # ACTIVITY SCORE
    # -----------------------------

    if "Total active days" in df.columns:

        df["Total active days"] = pd.to_numeric(
            df["Total active days"], errors="coerce"
        ).fillna(0)

        df["Activity_Score"] = df["Total active days"]


    # -----------------------------
    # MEETINGS PER ACTIVE DAY
    # -----------------------------

    if "Total active days" in df.columns and "Total_Meetings_Calc" in df.columns:

        df["Meetings_per_Active_Day"] = df.apply(
            lambda x: x["Total_Meetings_Calc"] / x["Total active days"]
            if x["Total active days"] > 0 else 0,
            axis=1
        )

    return df