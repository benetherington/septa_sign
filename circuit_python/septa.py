import board
import displayio
import rgbmatrix
import framebufferio
from io import BytesIO
from time import sleep

from adafruit_bitmap_font import bitmap_font
from adafruit_display_text import label
import adafruit_imageload as imageload

import wifi
import adafruit_requests
import socketpool
import ssl
import time
import rtc
import adafruit_ntp
import traceback

from timezone import US_Eastern

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
ampel_bmp = displayio.OnDiskBitmap("images/ampelmannchen.bmp")
ampel_grid = displayio.TileGrid(ampel_bmp, pixel_shader=ampel_bmp.pixel_shader)
image_group = displayio.Group()
image_group.append(ampel_grid)
main_group.append(image_group)

# Error icon
error_txt = label.Label(FONT, text="!!!", color=(244, 67, 54))
error_txt.y = FONT_OFFSET_Y
error_txt.hidden = True
main_group.insert(0, error_txt)

# Clock header
clock_text = label.Label(FONT, text="00:00")
clock_text.x = 8
clock_text.y = FONT_OFFSET_Y
main_group.insert(0, clock_text)

# Arrivals group
arrivals_group = displayio.Group()
arrivals_group.y = FONT_HEIGHT + 2
main_group.insert(0, arrivals_group)



#
# WIFI setup
#
# BASE_URL = "http://192.168.0.13:8080"
BASE_URL = "https://septa-sign-rae-riley.glitch.me"
pool = socketpool.SocketPool(wifi.radio)
requests = adafruit_requests.Session(pool, ssl.create_default_context())

# Update RTC
print("UDPATING RTC")
ntp = adafruit_ntp.NTP(pool, tz_offset=0)
rtc.RTC().datetime = ntp.datetime


#
# GRAPHICS UTILITIES
#
def clear_image():
    while len(image_group) > 0:
        image_group.pop()
def clear_arrivals():
    while len(arrivals_group) > 0:
        arrivals_group.pop()

def get_line_b():
    return label.Label(LEMON, text="B", padding_right=2, padding_left=1, background_color=(250, 100, 0) )

def get_line_l():
    return label.Label(LEMON, text="L", padding_right=2, padding_left=1, background_color=(0, 154, 222) )

def get_line_t():
    return label.Label(LEMON, text="T", padding_right=2, padding_left=1, background_color=(97, 166, 13) )

def get_line_g():
    return label.Label(LEMON, text="G", padding_right=2, padding_left=1, background_color=(254, 215, 2), color=(0,0,0) )

def get_line(name, color, background_color):
    l = label.Label(
        LEMON,
        text=name,
        padding_right=1,
        padding_left=1,
        padding_bottom=1,
        color=color,
        background_color=background_color
    )
    l.y = 4
    return l

def load_on_disk_bmp(filename):
    bmp = displayio.OnDiskBitmap(filename)
    return displayio.TileGrid(bmp, pixel_shader=bmp.pixel_shader)

def load_network_bmp(path):
    # Fetch the bmp
    resp = requests.get(BASE_URL + path)
    bytes_img = BytesIO(resp.content)
    resp.close()
    
    # Create a tile grid to display the bmp
    image, palette = imageload.load(bytes_img)
    return displayio.TileGrid(image, pixel_shader=palette)

def show_image(path):
    print(f"Showing image {path}")
    path = f"images/{path}"
    tile_grid = load_on_disk_bmp(path)
    
    # Clear the screen
    clear_image()
    clear_arrivals()
    
    # Add the new image
    image_group.append(tile_grid)

def convert_color(api_color):
    r, g, b = api_color
    r *= 85
    g *= 85
    b *= 85
    return [r, g, b]



#
# Arrivals display
#
ARRIVAL_ROW_HEIGHT = 12
def build_arrival_row(arrival):
    # {
    #     'arrival': 1701368520000,
    #     'seats': 'EMPTY',
    #     'direction': 'Southbound',
    #     'stopName': 'Ridge Av & Green Ln',
    #     'isNextStop': False,
    #     'routeName': '4th-Walnut to Andorra'
    #     'colors': [[0, 0, 0], [0, 0, 0]]
    # }
    
    # Create a group for this arrival
    group = displayio.Group()
    
    # Parse icon, route name
    route_id, route_name = arrival["routeName"].split(": ")
    print(f"building <{route_id}> - {route_name}")
    
    # Get configured colors
    if "colors" in arrival:
        route_color = convert_color(arrival["colors"][0])
        arrival_color = convert_color(arrival["colors"][1])
    else:
        use_default_colors = True
        route_color = [170, 170, 170]
        arrival_color = [255, 255, 255]
    
    # Build icon
    if route_id == "B" and not use_default_colors:
        icon = get_line_b()
    elif route_id == "L" and not use_default_colors:
        icon = get_line_l()
    elif route_id == "T" and not use_default_colors:
        icon = get_line_t()
    elif route_id == "G" and not use_default_colors:
        icon = get_line_g()
    else:
        icon = get_line(route_id, (0,0,0), route_color)
    icon.y = LEMON_FILLED_OFFSET_Y
    group.append(icon)
    
    # Top row: build stop
    stop = label.Label(FONT, text=arrival["stopName"], color=arrival_color)
    stop.y = FONT_OFFSET_Y
    stop.x = 12
    group.append(stop)
    
    # Bottom row: build direction
    direction = label.Label(FONT, text=arrival["direction"][0], color=arrival_color)
    direction.y = FONT_OFFSET_Y + FONT_HEIGHT + 1
    direction.x = 12
    group.append(direction)
    
    # Bottom row: build time
    if arrival["isNextStop"]:
        delta = "NEXT"
    if "arrival" in arrival:
        delta_sec = arrival["arrival"] // 1000 - time.time()
        delta = str(delta_sec // 60)
    time_label = label.Label(FONT, text=str(delta), color=arrival_color)
    time_label.y = FONT_OFFSET_Y + FONT_HEIGHT + 1
    time_label.x = 20
    group.append(time_label)
    
    return group

def show_arrivals(arrivals):
    # Build arrival groups
    print(f"Displaying {len(arrivals)} arrivals")
    rows = map(build_arrival_row, arrivals)
    
    # Clear the screen
    clear_arrivals()
    clear_image()
    
    # Add each arrival group
    y_offset = 0
    for row in rows:
        row.y = y_offset
        arrivals_group.append(row)
        y_offset += ARRIVAL_ROW_HEIGHT



#
# CLOCK
#
def update_clock():
    t_struct = US_Eastern.localtime()
    hour = (t_struct.tm_hour % 12) or 12
    min = t_struct.tm_min
    
    clock_text.text = f"{hour:2}:{min:02}"
update_clock()

#
# MAIN
#
def update_display():
    update_clock()
    
    # Load display directive
    resp = requests.get(BASE_URL + "/directive")
    directive = resp.json()
    
    # Display image
    if "image" in directive:
        show_image(directive['image'])
    elif "arrivals" in directive:
        show_arrivals(directive['arrivals'])
    else:
        error_txt.hidden = False
    
    resp.close()


last_update = time.time()
while True:
    # Wait for next update
    while time.time() - last_update < 30:
        sleep(2)
        continue
    
    try:
        error_txt.hidden = True
        update_display()
    except Exception as e:
        traceback.print_exception(e)
        error_txt.hidden = False
    
    last_update = time.time()