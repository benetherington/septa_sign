import os
import board
import displayio
import rgbmatrix
import framebufferio
import terminalio
from adafruit_display_text import label


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


#
# Main
#

main_group = displayio.Group()
display.show(main_group)

# text = "Hello world"
# text_area = label.Label(terminalio.FONT, text=text)
# text_area.x = 0
# text_area.y = 0

ampel_bmp = displayio.OnDiskBitmap("/ampelmannchen.bmp")
ampel_grid = displayio.TileGrid(ampel_bmp, pixel_shader=ampel_bmp.pixel_shader)
main_group.append(ampel_grid)


while True:
    pass