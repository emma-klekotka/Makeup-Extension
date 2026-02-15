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
        df_result = df['working_percent'].iloc[0]
        return float(str(df_result).replace('%', ''))

    except Exception as e:
        print(f"Error occurred: {e}")
        return None
    
def calculate_score(n):
    # calculate so anything higher tham 50% is a 0, after that each percent removes 2 from the score out of 100
    if (n >= 50):
        return 0
    return int(100 - (n * 2))

def countries_to_score(countries):
    description = ""
    country_list = [countries[0], countries[1]]
    country_scores = []
    final_score = -1

    for country in country_list:
        new_val = get_working_percent(country)
        if (new_val != None): country_scores.append(new_val)
    
    if len(country_scores) == 0:
        description += "Unfortunately no information was found on these countries"
    else:
        final_score = int(sum(country_scores) / len(country_scores))
        description += "This score was created by evaluating the child labor practices of " + countries[0] + " and " + countries[1]
        description += " using Department of Labor statistics."

    report = {
        "labor_score": final_score,
        "labor_description": description
    }
    
    return report

#result2 = countries_to_score(['Chad', 'Somalia'])
#print(result2)