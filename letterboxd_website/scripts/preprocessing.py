import pandas as pd
import simplejson
import json
DATA_PATH = "letterboxd_website/app/data/"
country_map ={
  "USA": 'United States of America',
  "UK": 'United Kingdom',
  "Serbia": 'Republic of Serbia',
  'Czech Republic': 'Czechia',
  "Congo": 'Republic of the Congo',
  'Democratic Republic of Congo': 'Democratic Republic of the Congo',
  "Côte d'Ivoire": 'Ivory Coast',
  'Timor-Leste': 'East Timor',
  "Bahamas": 'The Bahamas',
  "Tanzania": 'United Republic of Tanzania',
  'North Macedonia': 'Macedonia',
  'Brunei Darussalam': 'Brunei',
  "Lao People's Democratic Republic": 'Laos',
  'Republic of Moldova': 'Moldova',
  'Russian Federation': 'Russia',
  'Syrian Arab Republic': 'Syria',
  'Bolivarian Republic of Venezuela': 'Venezuela',
  'State of Palestine': 'Palestine',
  "Eswatini": 'Swaziland',
  'French Southern Territories': 'French Southern and Antarctic Lands',
}
list_cols = ["countries", "genres", "spoken_languages", "countries_released", "themes"]
n_cols = ["n_countries_released","n_countries" ,"n_actors", "n_crew", "rating", "minute"]
single_cols = ["coproduction" ]
all_col = list_cols + n_cols + single_cols

def compute_stat(country, df_movies):
    if isinstance(country, str):
        df_c_stat = pd.DataFrame(columns=["country"] + all_col)
        df_c_stat["country"] = [country_map.get(country,country)]
        
        print(country)
        df_c = df_movies[pd.notna(df_movies["countries"]) & df_movies["countries"].str.contains(country)]

        for col in list_cols:
            df_c[col] = df_c[col].apply(eval)
            c_exploded = df_c[col].explode().where(lambda x: x != country).dropna()
            df_c_stat[col] = [list(c_exploded.value_counts(normalize=True).to_dict().items())]
        for col in n_cols:
            df_c_stat[col] = df_c[col].mean()
        for col in single_cols:
            df_c_stat[col] = [list(df_c[col].value_counts(normalize=True).to_dict().items())]
        df_c_stat["countries"] = df_c_stat["countries"].apply(lambda x: [e for e in x if e[1] >= 0.01])
        df_c_stat["spoken_languages"] = df_c_stat["spoken_languages"].apply(lambda x: [e for e in x if e[1] >= 0.01])
        df_c_stat["themes"] = df_c_stat["themes"].apply(lambda x: x[:10] if len(x) > 10 else x)
        df_c_stat["countries_released"] = df_c_stat["countries_released"].apply(lambda x: x[:10] if len(x) > 10 else x)
        
        df_c_stat["main_language"] = df_c_stat["main_language"].apply(lambda x: [e for e in x if e[1] >= 0.005] if isinstance(x, list) else [])
        return df_c_stat
    return pd.DataFrame()


def compute_stat_by_year(country, df_movies):
    """Compute the same stats as compute_stat, but broken down year by year."""
    if isinstance(country, str):
        df_c = df_movies[pd.notna(df_movies["countries"]) & df_movies["countries"].str.contains(country)].copy()

        rows = []
        for year, df_year in df_c.groupby("date"):
            df_year = df_year.copy()
            row = {"country": country_map.get(country,country), "year": year}

            for col in list_cols:
                df_year[col] = df_year[col].apply(eval)
                c_exploded = df_year[col].explode().where(lambda x: x != country).dropna()
                counts = list(c_exploded.value_counts(normalize=True).to_dict().items())
                # Apply the same filters as compute_stat
                if col == "countries":
                    counts = [e for e in counts if e[1] >= 0.01]
                elif col == "spoken_languages":
                    counts = [e for e in counts if e[1] >= 0.01]
                elif col == "themes":
                    counts = counts[:10]
                elif col == "countries_released":
                    counts = counts[:10]
                row[col] = counts

            for col in n_cols:
                row[col] = df_year[col].mean()

            for col in single_cols:
                row[col] = list(df_year[col].value_counts(normalize=True).to_dict().items())


            rows.append(row)

        df_yearly = pd.DataFrame(rows, columns=["country", "year"] + all_col)
        return df_yearly
    return pd.DataFrame()


df_movies = pd.read_csv(DATA_PATH + "movies_with_stats.csv", dtype=dict(zip(list_cols, ["str"] * len(list_cols))))
df_movies.fillna(inplace=True, value=dict(zip(list_cols, ["[]"] * len(list_cols))))
df_movies["countries_released"] = df_movies["countries_released"].apply(lambda x: x.replace("{", "[").replace("}", "]"))
countries_l = list(df_movies["countries"].apply(eval).explode().unique())


# --- Overall stats (unchanged) ---
df_countries_stat = pd.DataFrame(columns=["country"] + all_col)

print(countries_l)
for country in countries_l:
    df_c_stat = compute_stat(country, df_movies)
    if not df_c_stat.empty:
        df_countries_stat = pd.concat([df_countries_stat, df_c_stat])

print(df_countries_stat)
df_countries_stat.set_index("country").to_json(DATA_PATH + "stats.json", orient="index")

# --- Year-by-year stats ---
 
stats_by_year = {}
for country in countries_l:
    df_c_yearly = compute_stat_by_year(country, df_movies)
    if not df_c_yearly.empty:
        stats_by_year[country_map.get(country, country)] = {
            int(row["year"]): {col: row[col] for col in all_col}
            for _, row in df_c_yearly.iterrows()
        }
 
print(stats_by_year)
with open(DATA_PATH + "stats_by_year.json", "w") as f:
    simplejson.dump(stats_by_year, f, ignore_nan=True)

