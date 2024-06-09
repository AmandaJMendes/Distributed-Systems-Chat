import socket
import threading
import json
import time
import uuid

from rawsockets import receive_message, send_message
from websockets import parse_headers, websocket_handshake
from messages import format_chats
from mocks import chats as mocked_chat

from disk.helpers import update_users

users = {}  # keys: user id | values: username
chats = mocked_chat


def parse_message(message, websocket):
    data = json.loads(message)
    action = data.get("action")

    if action == "login":
        user_id = data.get("user_id",  str(uuid.uuid4()))
        users[user_id] = {
            "name": data.get("name"),
            "email": data.get("email"),
            "url": data.get("url"),
            "connection": websocket,
        }
        if not data.get("user_id"):
            send_message(
                websocket,
                json.dumps(
                    {
                        "payload": {"user_id": user_id, "name": data.get("name"), "email": data.get("email")},
                        "action": "login",
                    }
                ),
            )
        
        update_users(user_id, users[user_id])
        print("\n\n")

    elif action == "list_chats":
        send_message(websocket, format_chats(chats, "chats"))
        
    elif action == "logout":
        user_id = data.get("user_id")
        if user_id in users:
            del users[user_id]
            for chat_id in chats:
                chats[chat_id]["users"] = [
                    uid for uid in chats[chat_id]["users"] if uid != user_id
                ]
    elif action == "create":
        chats[str(uuid.uuid4())] = {
            "name": data["name"],
            "messages": [],
            "users": [data["user_id"]],
        }
        
    elif action == "join":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        if chat_id in chats:
            chats[chat_id]["users"].append(user_id)
            # send_message(websocket, json.dumps(chats[chat_id]))

        send_message(
            websocket,
            format_chats(
                chats, "current_chat", send_messages=True, chat_id=int(chat_id)
            ),
        )

    elif action == "leave":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        if chat_id in chats:
            chats[chat_id]["users"] = [
                uid for uid in chats[chat_id]["users"] if uid != user_id
            ]
    elif action == "send":
        user_id = data.get("user_id")
        chat_id = data.get("chat_id")
        msg = {
            "user_id": user_id,
            "user_name": data.get("user_name"),
            "user_url": data.get("user_url"),
            "timestamp": int(time.time() * 1000),
            "text": data.get("message"),
        }
        if chat_id not in chats and user_id in users:
            _id = str(uuid.uuid4())
            chats[_id] = {
                "name": "",
                "messages": [msg],
                "users": [user_id, chat_id],
            }
            msg["chat_id"] = _id
            chat_id = _id
            
        else:
            chats.get(chat_id).get("messages").append(msg)

        for usr_id in chats.get(chat_id, {}).get("users", []):
            client = users.get(usr_id, {}).get("connection")

            if client:
                send_message(
                    client,
                    format_chats(
                        chats, "current_chat", send_messages=True, chat_id=int(chat_id)
                    ),
                )


def handle_client(client_socket):
    print("Client")
    request = client_socket.recv(1024).decode("utf-8")
    headers = parse_headers(request)
    websocket_handshake(client_socket, headers)
    while True:
        try:
            message = receive_message(client_socket)
            if message:
                print(message)
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
    server_socket.bind(("localhost", 3000))
    server_socket.listen(5)
    print("Server started on ws://localhost:3000")
    while True:
        client_socket, _ = server_socket.accept()
        client_thread = threading.Thread(target=handle_client, args=(client_socket,))
        client_thread.start()


if __name__ == "__main__":
    start_server()
