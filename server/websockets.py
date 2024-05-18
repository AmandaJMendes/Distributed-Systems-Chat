import base64
import hashlib

def parse_headers(request):
    headers = {}
    lines = request.split("\r\n")
    for line in lines:
        if ": " in line:
            key, value = line.split(": ", 1)
            headers[key] = value
    return headers

def websocket_handshake(client_socket, headers):
    websocket_key = headers['Sec-WebSocket-Key']
    accept_key = base64.b64encode(hashlib.sha1((websocket_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode('utf-8')
    response = (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {accept_key}\r\n"
        "\r\n"
    )
    client_socket.send(response.encode('utf-8'))