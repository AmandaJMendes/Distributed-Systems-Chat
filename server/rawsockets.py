import struct

def receive_message(client_socket):
    data = client_socket.recv(2)
    
    if not data:
        return None
    length = data[1] & 127
    if length == 126:
        data = client_socket.recv(2)
        length = struct.unpack('>H', data)[0]
    elif length == 127:
        data = client_socket.recv(8)
        length = struct.unpack('>Q', data)[0]
    masks = client_socket.recv(4)
    message_bytes = bytearray()
    for byte in client_socket.recv(length):
        message_bytes.append(byte ^ masks[len(message_bytes) % 4])
    
    return message_bytes.decode('utf-8')

def send_message(client_socket, message):
    message_bytes = message.encode('utf-8')
    length = len(message_bytes)
    if length <= 125:
        client_socket.send(struct.pack('B', 129))
        client_socket.send(struct.pack('B', length))
    elif length >= 126 and length <= 65535:
        client_socket.send(struct.pack('B', 129))
        client_socket.send(struct.pack('B', 126))
        client_socket.send(struct.pack('>H', length))
    else:
        client_socket.send(struct.pack('B', 129))
        client_socket.send(struct.pack('B', 127))
        client_socket.send(struct.pack('>Q', length))
    client_socket.send(message_bytes)