import os
import wx
from PIL import Image
class PhotoCtrl(wx.App):
    def __init__(self, redirect=False, filename=None):
        wx.App.__init__(self, redirect, filename)
        self.frame = wx.Frame(None, title='Photo Control')

        self.panel = wx.Panel(self.frame)
        self.PhotoMaxSize = 240

        self.createWidgets()
        self.frame.Show()
        self.image_path = None

    def createWidgets(self):
        instructions = 'Select an image'
        img = wx.EmptyImage(240,240)
        self.imageCtrl = wx.StaticBitmap(self.panel, wx.ID_ANY,
                                         wx.BitmapFromImage(img))

        instructLbl = wx.StaticText(self.panel, label=instructions)
        self.idTxt = wx.TextCtrl(self.panel, size=(500,-1))
        self.hexTxt = wx.TextCtrl(self.panel, size=(500,-1))
        browseBtn = wx.Button(self.panel, label='Browse')
        convertBtn = wx.Button(self.panel, label='Convert')
        browseBtn.Bind(wx.EVT_BUTTON, self.onBrowse)
        convertBtn.Bind(wx.EVT_BUTTON, self.onConvert)

        self.mainSizer = wx.BoxSizer(wx.VERTICAL)
        self.sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.sizer2 = wx.BoxSizer(wx.HORIZONTAL)
        self.sizer3 = wx.BoxSizer(wx.HORIZONTAL)

        self.mainSizer.Add(wx.StaticLine(self.panel, wx.ID_ANY),
                           0, wx.ALL|wx.EXPAND, 5)
        self.mainSizer.Add(instructLbl, 0, wx.ALL, 5)
        self.mainSizer.Add(self.imageCtrl, 0, wx.ALL, 5)
        self.sizer2.Add(self.idTxt, 0, wx.ALL, 5)
        self.sizer3.Add(self.hexTxt, 0, wx.ALL, 5)
        self.sizer.Add(browseBtn, 0, wx.ALL, 5)
        self.sizer.Add(convertBtn, 0, wx.ALL, 5)
        self.mainSizer.Add(self.sizer, 0, wx.ALL, 5)
        self.mainSizer.Add(self.sizer2, 0, wx.ALL, 5)
        self.mainSizer.Add(self.sizer3, 0, wx.ALL, 5)

        self.panel.SetSizer(self.mainSizer)
        self.mainSizer.Fit(self.frame)
        self.panel.Layout()

    def onBrowse(self, event):
        """
        Browse for file
        """
        wildcard = "PNG files (*.png)|*.png"
        dialog = wx.FileDialog(None, "Choose a file",
                               wildcard=wildcard,
                               style=wx.FD_OPEN)
        if dialog.ShowModal() == wx.ID_OK:
            self.image_path = dialog.GetPath()
        dialog.Destroy()
        if self.image_path:
            self.onView()

    def onConvert(self, event):
        print('here')
        if self.image_path:
            self.convert(self.image_path)
        else:
            wx.MessageBox('No image selected', 'Error', wx.OK | wx.ICON_ERROR)

    def convert(self, img_path):
        img = Image.open(img_path)
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
        self.idTxt.SetValue(f"{', '.join(pixArr)}")
        self.hexTxt.SetValue(f"{', '.join(hexArr)}")
        # wx.MessageBox(f"{hexArr}", 'Hex array', wx.OK | wx.ICON_INFORMATION)
        # wx.MessageBox(f"{pixArr}", 'Pixel ID array', wx.OK | wx.ICON_INFORMATION)
        # print(f'{hexArr[0]}', end='')
        # for i in range(1, len(hexArr)):
        #     print(f',{hexArr[i]}', end='')
        # print()
        # print(pixArr)

    def onView(self):
        if not self.image_path:
            return
        filepath = self.image_path
        img = wx.Image(filepath, wx.BITMAP_TYPE_ANY)
        # scale the image, preserving the aspect ratio
        W = img.GetWidth()
        H = img.GetHeight()
        if W > H:
            NewW = self.PhotoMaxSize
            NewH = self.PhotoMaxSize * H / W
        else:
            NewH = self.PhotoMaxSize
            NewW = self.PhotoMaxSize * W / H
        img = img.Scale(NewW,NewH)
        self.imageCtrl.SetBitmap(wx.BitmapFromImage(img))
        self.panel.Refresh()

if __name__ == '__main__':
    app = PhotoCtrl()
    app.MainLoop()
