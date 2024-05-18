import socket
import threading
import json
import time

from rawsockets import receive_message, send_message
from websockets import parse_headers, websocket_handshake


seq_id = 1

users = {}  # keys: user id | values: username
chats = {}  # keys: chat id | values: {"messages": [(user_id, timestamp, text)], "users": [(user_id)]}

def parse_message(message, websocket):
    global seq_id
    data = json.loads(message)
    action = data.get("action")
    if action == "login":
        users[str(seq_id)] = {"name": data["name"], "connection": websocket}
        seq_id += 1 # we should use a lock for that, in my opinion
    elif action == "logout":
        user_id = data.get("user_id")
        if user_id in users:
            del users[user_id]
            for chat_id in chats:
                chats[chat_id]["users"] = [uid for uid in chats[chat_id]["users"] if uid != user_id]
    elif action == "create":
        chats[str(seq_id)] = {"name": data["name"], "messages": [], "users": [data["user_id"]]}
        seq_id += 1
    elif action == "join":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        if chat_id in chats:
            chats[chat_id]["users"].append(user_id)
    elif action == "leave":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        if chat_id in chats:
            chats[chat_id]["users"] = [uid for uid in chats[chat_id]["users"] if uid != user_id]
    elif action == "send":
        user_id = data.get("user_id")
        chat_id = data.get("chat_id")
        msg = {
            "user_id": user_id,
            "timestamp": int(time.time() * 1000),
            "text": data.get("msg")
        }
        if chat_id not in chats and user_id in users:
            chats[str(seq_id)] = {"name": "", "messages": [msg], "users": [user_id, chat_id]}
            msg["chat_id"] = str(seq_id)
            chat_id = str(seq_id)
            seq_id += 1
        for usr_id in chats.get(chat_id, {}).get("users", []):
            client = users.get(usr_id, {}).get("connection")
            if client:
                send_message(client, json.dumps(msg))

def handle_client(client_socket):
    request = client_socket.recv(1024).decode('utf-8')
    headers = parse_headers(request)
    websocket_handshake(client_socket, headers)
    while True:
        try:
            message = receive_message(client_socket)
            if message:
                parse_message(message, client_socket)
            else:
                break
        except Exception as e:
            print(f"Error: {e}")
            break
    client_socket.close()

def start_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 3000))
    server_socket.listen(5)
    print("Server started on ws://localhost:3000")
    while True:
        client_socket, _ = server_socket.accept()
        client_thread = threading.Thread(target=handle_client, args=(client_socket,))
        client_thread.start()

if __name__ == "__main__":
    start_server()
