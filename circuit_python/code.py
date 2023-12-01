import board
import displayio
import rgbmatrix
import framebufferio
from adafruit_display_text import label
import wifi
import microcontroller
import adafruit_requests
import socketpool
import ssl
import terminalio
from adafruit_bitmap_font import bitmap_font
import time
import rtc
import adafruit_ntp

print("GOOD MORNING!")


#
# Display setup
#
width=64
height=32
bit_depth=2
serpentine=True
tile_rows=1
rotation=90

addr_pins = [board.A0, board.A1, board.A2, board.A3]
rgb_pins = [board.IO7, board.IO8, board.IO9, board.IO10, board.IO11, board.IO12]
clock_pin = board.IO13
oe_pin = board.IO14
latch_pin = board.IO15

print("INITIALIZING DISPLAY")
displayio.release_displays()
matrix = rgbmatrix.RGBMatrix(
    width=width,
    height=height,
    bit_depth=bit_depth,
    rgb_pins=(
        rgb_pins[0],
        rgb_pins[1],
        rgb_pins[2],
        rgb_pins[0 + 3],
        rgb_pins[1 + 3],
        rgb_pins[2 + 3],
    ),
    addr_pins=addr_pins,
    clock_pin=clock_pin,
    latch_pin=latch_pin,
    output_enable_pin=oe_pin,
)
display = framebufferio.FramebufferDisplay(matrix, rotation=rotation)
main_group = displayio.Group()
display.show(main_group)
FONT = bitmap_font.load_font("fonts/bitocra7.bdf")

# Placeholder
ampel_bmp = displayio.OnDiskBitmap("/ampelmannchen.bmp")
ampel_grid = displayio.TileGrid(ampel_bmp, pixel_shader=ampel_bmp.pixel_shader)
main_group.append(ampel_grid)



#
# WIFI setup
#

ssid = "Hayble"
password = "melodicviolin297"
BASE_URL = "http://192.168.0.13:8080"

# ssid = microcontroller.nvm[0]
# password = microcontroller.nvm[1]
# if not ssid or not password:
#     import setup_server

print(f"CONNECTING TO {ssid}")
wifi.radio.connect(ssid, password=password)
pool = socketpool.SocketPool(wifi.radio)
requests = adafruit_requests.Session(pool, ssl.create_default_context())

# Update RTC
print("UDPATING RTC")
ntp = adafruit_ntp.NTP(pool, tz_offset=-5)
rtc.RTC().datetime = ntp.datetime

#
# Main
#

# text = "Hello world"
# text_area = label.Label(terminalio.FONT, text=text)
# text_area.x = 0
# text_area.y = 0

# ampel_bmp = displayio.OnDiskBitmap("/ampelmannchen.bmp")
# ampel_grid = displayio.TileGrid(ampel_bmp, pixel_shader=ampel_bmp.pixel_shader)
# main_group.append(ampel_grid)



def get_arrivals():
    resp = requests.get(BASE_URL + "/septa/bus/arrivals")
    return resp.json()

def build_arrival_row(arrival):
    # {
    #     'arrival': 1701368520000,
    #     'seats': 'EMPTY',
    #     'direction': 'Southbound',
    #     'stopName': 'Ridge Av & Green Ln',
    #     'isNextStop': False,
    #     'routeName': '4th-Walnut to Andorra'
    # }
    
    print(f"Building {arrival['stopName']}")
    group = displayio.Group()
    
    stop = label.Label(FONT, text=arrival["stopName"][:5])
    stop.y = 3
    group.append(stop)
    
    direction = label.Label(FONT, text=arrival["direction"][0])
    direction.y = 3
    direction.x = 21
    group.append(direction)
    
    delta_sec = arrival["arrival"] // 1000 - time.time()
    delta = delta_sec // 60
    time_label = label.Label(FONT, text=str(delta))
    time_label.y = 3
    time_label.x = 25
    group.append(time_label)
    
    return group

def update_arrivals():
    print("Fetching arrivals...")
    arrivals = get_arrivals()
    print(f"Got {len(arrivals)} to display")
    rows = map(build_arrival_row, arrivals)
    
    while len(main_group) > 0:
        main_group.pop()
    
    y_offset = 0
    for row in rows:
        row.y = y_offset
        main_group.append(row)
        y_offset += 6

update_arrivals()

last_update = time.time()
while True:
    # Wait for next update
    while time.time() - last_update < 30:
        pass
    
    # Do update
    update_arrivals()
    
    # Reset for next loop
    last_update = time.time()