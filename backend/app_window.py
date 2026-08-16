import webview
import threading
import uvicorn
import sys
import os

if getattr(sys, 'frozen', False):
    sys.path.append(sys._MEIPASS)

from main import app

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

if __name__ == '__main__':
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()

    webview.create_window(
        'PendriMP3', 
        'http://127.0.0.1:8000', 
        width=1100, 
        height=800,
        min_size=(900, 600)
    )
    webview.start()
