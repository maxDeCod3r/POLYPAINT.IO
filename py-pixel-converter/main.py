from PIL import Image
img = Image.open('test.png')
size = img.size
size_x = size[0]
size_y = size[1]
pix = img.load()
x_start = 496
y_start = 496
hexArr = []
pixArr = []
for y in range(0, size_x):
    for x in range(0, size_y):
        # rgb = [pix[i,j][0], pix[i,j][1], pix[i,j][2]]
        hex = '0x%02x%02x%02x' % (pix[x,y][0], pix[x,y][1], pix[x,y][2])
        hexArr.append(f'{hex}')
        pixArr.append((x_start+x)+((y_start+y)*1000))

print(f'{hexArr[0]}', end='')
for i in range(1, len(hexArr)):
    print(f',{hexArr[i]}', end='')
print()
print(pixArr)
