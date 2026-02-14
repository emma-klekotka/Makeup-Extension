import requests
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

def get_working_percent(country_name):
    api_key = os.getenv('DOL_API_KEY')
    
    if not api_key:
        print("Error: DOL_API_KEY not found in .env file.")
        return None
    
    base_url = "https://apiprod.dol.gov/v4/get/ILAB/LaborShield_ReportingData/json"
    
    params = {
        "limit": "1",
        "offset": "0",
        "fields": "working_percent",
        "filter_object": f'{{"field": "country", "operator": "eq", "value": "{country_name}"}}',
        "X-API-KEY": api_key
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status() 
        
        raw_data = response.json()

        data_json = raw_data.get('data', [])
        
        df = pd.DataFrame(data_json)
        return df['working_percent'].iloc[0]

    except Exception as e:
        print(f"Error occurred: {e}")
        return None
    
def calculate_score(n):
    return (n - 100) * -1


result_df = get_working_percent("Brazil")
if result_df is not None:
    clean_number = float(str(result_df).replace('%', ''))
    print(calculate_score(clean_number))