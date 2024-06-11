import socket
import threading
import json
import time
import uuid

from rawsockets import receive_message, send_message
from websockets import parse_headers, websocket_handshake
from messages import format_chats

from disk.helpers import update_users, get_users, update_chats, get_chats

# chats -> keys: chat id | values: {"messages": [(user_id, timestamp, text)], "users": [(user_id)]}
server_users = {} # keys: user id | values: username


def parse_message(message, websocket):
    data = json.loads(message)
    action = data.get("action")

    if action == "login":
        user_id = None

        # Look for user on disk (sign in action)
        for server_user_id in get_users().keys():
            if get_users().get(server_user_id).get("email") == data.get("email"):
                user_id = server_user_id
                print(f"\nFound user {user_id}\n")

        user = {
            "user_id": user_id,
            "name": data.get("name"),
            "email": data.get("email"),
            "url": data.get("url"),
        }
        
        # Create user and send his DM to others (sign up action)
        if not user_id:
            user_id = str(uuid.uuid4())
            user["user_id"] = user_id

            chats = get_chats()
            for signed_user_id in get_users().keys():
                signed_user = get_users().get(signed_user_id)
                chats[str(uuid.uuid4())] = {
                    "name": f"{data.get("name")}|{signed_user.get("name")}",
                    "group": False,
                    "messages": [],
                    "users": [user_id, server_user_id],
                    "image": [data.get("url"), signed_user.get("url")]
                }
                
                server_user_conn = server_users.get(signed_user_id, {}).get("connection")
                if server_user_conn:
                    send_message(server_user_conn, format_chats(chats, "chats", server_user_id))
            
            update_chats(chats)
        
        # Sign in, sign up or refresh connection
        send_message(
            websocket,
            json.dumps(
                {
                    "payload": user,
                    "action": "login",
                }
            ),
        )
        
        # Persist user and update connection
        user["connection"] = websocket
        user.pop("user_id")
        server_users[user_id] = user
        update_users(user_id, user)

    elif action == "list_chats":
        send_message(websocket, format_chats(get_chats(), "chats", data.get("user_id")))
        
    elif action == "logout":
        if data.get("user_id", None) in server_users:
            del server_users[user_id]
        
    elif action == "join":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        chats = get_chats()

        # This if will be used to add user to groups
        if chat_id in chats and user_id not in chats.get(chat_id).get("users"):
            chats[chat_id]["users"].append(user_id)
            update_chats(chats)
        
        send_message(
            websocket,
            format_chats(
                chats, "current_chat", send_messages=True, chat_id=chat_id
            ),
        )

    #elif action == "leave":
    #    chat_id = data.get("chat_id")
    #    user_id = data.get("user_id")
    #    if chat_id in chats:
    #        chats[chat_id]["users"] = [
    #            uid for uid in chats[chat_id]["users"] if uid != user_id
    #        ]

    elif action == "send":
        user_id = data.get("user_id")
        chat_id = data.get("chat_id")
        chats = get_chats()
        
        msg = {
            "user_id": user_id,
            "user_name": data.get("user_name"),
            "user_url": data.get("user_url"),
            "timestamp": int(time.time() * 1000),
            "text": data.get("message"),
        }
            
        chats.get(chat_id).get("messages").append(msg)
        update_chats(chats)

        for usr_id in chats.get(chat_id, {}).get("users", []):
            client = server_users.get(usr_id, {}).get("connection")

            if client:
                send_message(
                    client,
                    format_chats(
                        chats, "current_chat", send_messages=True, chat_id=chat_id
                    ),
                )
        
def handle_client(client_socket):
    print("New client connected")
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
