import board
import displayio
import rgbmatrix
import framebufferio
from adafruit_bitmap_font import bitmap_font
from adafruit_display_text import label

import wifi
import adafruit_requests
import socketpool
import ssl
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
FONT_OFFSET_Y = 2
FONT_HEIGHT = 5

LEMON = bitmap_font.load_font("fonts/lemon.bdf")
LEMON_FILLED_OFFSET_Y = 4
LEMON_HEIGHT = 6

# Placeholder
ampel_bmp = displayio.OnDiskBitmap("/ampelmannchen.bmp")
ampel_grid = displayio.TileGrid(ampel_bmp, pixel_shader=ampel_bmp.pixel_shader)
main_group.append(ampel_grid)

# Error icon
error_txt = label.Label(LEMON, text="!!!", color=(244, 67, 54) )
error_txt.y = width - LEMON_HEIGHT
error_txt.hidden = True
main_group.append(error_txt)

# Arrivals group
arrivals_group = displayio.Group()



#
# WIFI setup
#
BASE_URL = "https://adorable-better-education.glitch.me"
pool = socketpool.SocketPool(wifi.radio)
requests = adafruit_requests.Session(pool, ssl.create_default_context())

# Update RTC
print("UDPATING RTC")
ntp = adafruit_ntp.NTP(pool, tz_offset=0)
rtc.RTC().datetime = ntp.datetime


#
# GRAPHICS UTILITIES
#
def get_line_b():
    return label.Label(LEMON, text="B", padding_right=2, padding_left=1, background_color=(250, 100, 0) )

def get_line_l():
    return label.Label(LEMON, text="L", padding_right=2, padding_left=1, background_color=(0, 154, 222) )

def get_line_t():
    return label.Label(LEMON, text="T", padding_right=2, padding_left=1, background_color=(97, 166, 13) )

def get_line_g():
    return label.Label(LEMON, text="G", padding_right=2, padding_left=1, background_color=(254, 215, 2), color=(0,0,0) )

def get_line(name):
    l = label.Label(LEMON, text=name, padding_right=1, padding_left=1, color=(0,0,0), background_color=(100,100,100))
    l.y = 4
    return l

def get_bmp(fn):
    bmp = displayio.OnDiskBitmap(fn)
    return displayio.TileGrid(bmp, pixel_shader=bmp.pixel_shader)

def get_ampelmannchaen():
    return get_bmp("/ampelmannchen.bmp")

def get_bus_image():
    return get_bmp("/bus.bmp")





#
# Main
#

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
    
    # Create a group for this arrival
    group = displayio.Group()
    
    # Parse icon, route name
    route_id, route_name = arrival["routeName"].split(": ")
    print(f"building <{route_id}> - {route_name}")
    
    # Build icon
    if route_id == "B":
        icon = get_line_b
    elif route_id == "L":
        icon = get_line_l()
    elif route_id == "T":
        icon = get_line_t()
    elif route_id == "G":
        icon = get_line_g()
    else:
        icon = get_line(route_id)
    icon.y = LEMON_FILLED_OFFSET_Y
    group.append(icon)
    
    # Top row: build stop
    stop = label.Label(FONT, text=arrival["stopName"])
    stop.y = FONT_OFFSET_Y
    stop.x = 12
    group.append(stop)
    
    # Bottom row: build direction
    direction = label.Label(FONT, text=arrival["direction"][0])
    direction.y = FONT_OFFSET_Y + FONT_HEIGHT + 1
    direction.x = 12
    group.append(direction)
    
    # Bottom row: build time
    delta_sec = arrival["arrival"] // 1000 - time.time()
    delta = delta_sec // 60
    time_label = label.Label(FONT, text=str(delta))
    time_label.y = FONT_OFFSET_Y + FONT_HEIGHT + 1
    time_label.x = 20
    group.append(time_label)
    
    return group

def update_arrivals():
    print("Fetching arrivals...")
    arrivals = get_arrivals()
    print(f"Got {len(arrivals)} to display")
    rows = map(build_arrival_row, arrivals)
    
    while len(arrivals_group) > 0:
        arrivals_group.pop()
    
    y_offset = 0
    for row in rows:
        row.y = y_offset
        arrivals_group.append(row)
        y_offset += 12

# Load initial arrivals, remove placeholder
try:
    update_arrivals()
except:
    error_txt.hidden = False
main_group.remove(ampel_grid)


last_update = time.time()
while True:
    # Wait for next update
    while time.time() - last_update < 30:
        pass
    
    try:
        error_txt.hidden = True
        # Do update
        update_arrivals()
        
        # Reset for next loop
        last_update = time.time()
    except:
        error_txt.hidden = False