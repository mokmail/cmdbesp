import pandas as pd

def main():
    print("Loading data...")
    try:
        shares_df = pd.read_csv("parsed_fileshares.csv", sep=";")
    except Exception as e:
        print(f"Error loading parsed_fileshares.csv: {e}")
        return

    try:
        esp_df = pd.read_csv("ESP_20260416_with_ID.csv", sep=";", encoding="latin1")
    except Exception as e:
        print(f"Error loading ESP_20260416_with_ID.csv: {e}")
        return

    # Normalize server names for comparison
    shares_servers = set(shares_df["Server"].dropna().astype(str).str.upper())
    esp_servers = set(esp_df["Gerätename"].dropna().astype(str).str.upper())

    matching_servers = shares_servers.intersection(esp_servers)
    
    print("-" * 40)
    print(f"Total unique servers in parsed_fileshares.csv: {len(shares_servers)}")
    print(f"Total unique servers (Gerätename) in ESP_20260416_with_ID.csv: {len(esp_servers)}")
    print(f"Servers from fileshares found in ESP: {len(matching_servers)}")
    
    # Also attempt to find shares inside the 'Bemerkungen' or 'System Name' columns
    shares_list = shares_df["Share"].dropna().astype(str).str.upper().tolist()
    
    esp_bemerkungen = esp_df["Bemerkungen"].dropna().astype(str).str.upper().tolist()
    esp_system_name = esp_df["System Name"].dropna().astype(str).str.upper().tolist()
    
    found_shares_in_bemerkungen = 0
    for share in set(shares_list):
        # We check if the share name is mentioned in Bemerkungen
        if any(share in b for b in esp_bemerkungen):
            found_shares_in_bemerkungen += 1
            
    print(f"Total unique shares in parsed_fileshares.csv: {len(set(shares_list))}")
    print(f"Shares found mentioned in ESP 'Bemerkungen' column: {found_shares_in_bemerkungen}")
    print("-" * 40)

if __name__ == "__main__":
    main()
