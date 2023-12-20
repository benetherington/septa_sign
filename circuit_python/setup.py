import board
import displayio
import framebufferio
import mdns
import microcontroller
from msgpack import pack, unpack
import nvm_helper
import rgbmatrix
import socketpool
import supervisor
import wifi

from adafruit_bitmap_font import bitmap_font
from adafruit_display_text import label, scrolling_label
from adafruit_httpserver import (
    Server, Request,
    Response, FileResponse, JSONResponse,
    OK_200, BAD_REQUEST_400 
)

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

LEMON = bitmap_font.load_font("fonts/lemon.bdf")
TEXT_OFFSET = 2
LINE_HEIGHT = 6

# Setup instructions
offset = TEXT_OFFSET
animate = []

def add_line(text, scrolling=False):
    global offset, animate
    if scrolling:
        txt = scrolling_label.ScrollingLabel(
            LEMON,
            text=text,
            max_characters=6,
            color=(131, 203, 237)
        )
        animate.append(txt)
    else:
        txt = label.Label(LEMON, text=text)
    txt.y = offset
    offset += LINE_HEIGHT + 2
    main_group.append(txt)
def clear():
    global main_group
    while len(main_group):
        main_group.pop()


add_line("Hello!")
add_line("Set Me")
add_line("up...")
offset += 4
add_line("Wifi: septa_sign   ", scrolling=True)
add_line("Password: weloveyou", scrolling=True)
offset += 4
add_line("Go to:")
add_line("septasign.local", scrolling=True)





#
# SETUP SERVER
#

# Create access point
ap_ssid = "septa_sign"
ap_password = "weloveyou"
wifi.radio.start_ap(ssid=ap_ssid, password=ap_password)

# Create MDNS server
mdns_server = mdns.Server(wifi.radio)
mdns_server.hostname="septasign"
mdns_server.advertise_service(service_type="_http", protocol="_tcp", port=80)

# Create HTTP server
pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, "/static", debug=True)

#
# NVM ACCESSORS
#
def store_wifi_credentials(ssid, password):
    if not ssid or not password:
        raise ValueError
    
    nvm_helper.save_data({"ssid":ssid, "password":password}, test_run=False)
    if supervisor.runtime.usb_connected:
        print("Okay! Please reboot me.")
    else:
        microcontroller.reset()

def get_wifi_credentials():
    return nvm_helper.read_data()

#
# ROUTES
#
@server.route("/")
def base(request: Request):
    return FileResponse(request, "index.html", "/www")

@server.route("/credentials")
def base(request: Request):
    return JSONResponse(request, data=get_wifi_credentials())

@server.route("/", "POST")
def base(request: Request):
    try:
        jsn = request.json()
        store_wifi_credentials(jsn["ssid"], jsn["password"])
        return Response(request, status=OK_200)
    except:
        return Response(request, status=BAD_REQUEST_400)
    

# Start server
server.start(str(wifi.radio.ipv4_address_ap))

#
# MAIN
#

while True:
    try:
        for txt in animate:
            txt.update()
        server.poll()
    except Exception as e:
        print(e)
