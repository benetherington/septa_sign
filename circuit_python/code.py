import nvm_helper
import wifi

# Load credentials from memory
credentials = nvm_helper.read_data()
print(credentials)

# Run setup if no credentials are present
if not credentials["ssid"] or not credentials["password"]:
    print("running setup...")
    import setup

# Connect to WIFI
attempts = 0
while attempts < 2:
    print(f"CONNECTING TO {credentials['ssid']}")
    
    try:
        wifi.radio.connect(credentials["ssid"], password=credentials["password"])
    except: pass

    if wifi.radio.connected:
        break
    else:
        attempts += 1

# Check if attempt was successful, revert to setup if not
if wifi.radio.connected:
    print("We're connected! Sunning septa")
    import septa
else:
    print("Connection attempts unsuccessful, entering setup")
    import setup
