from pathlib import Path
import random, struct, zlib

out = Path(r"C:\Users\sampl\Downloads\saia-3d-demo\assets\meetings")
out.mkdir(parents=True, exist_ok=True)
colors = [(62, 76, 92), (128, 74, 61), (76, 103, 82), (116, 92, 137), (184, 126, 55)]
width, height = 1200, 760

def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)

def solid_png(path, rgb):
    raw = b''.join(b'\x00' + bytes(rgb) * width for _ in range(height))
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)

for number, color in zip(range(5, 0, -1), colors):
    path = out / f'{number:03d}.png'
    if not path.exists():
        solid_png(path, color)
        print(f'created {path.name}: #{color[0]:02x}{color[1]:02x}{color[2]:02x}')
