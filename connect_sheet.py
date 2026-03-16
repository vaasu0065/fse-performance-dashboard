import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials


def load_sheet():

    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]

    creds = ServiceAccountCredentials.from_json_keyfile_name(
        "credentials.json", scope
    )

    client = gspread.authorize(creds)

    sheet = client.open("VV - Day Working (Responses)").worksheet("FSE")

    data = sheet.get_all_values()

    df = pd.DataFrame(data)

    # Fix header
    df.columns = df.iloc[2]
    df = df[3:]
    df = df.reset_index(drop=True)

    return df