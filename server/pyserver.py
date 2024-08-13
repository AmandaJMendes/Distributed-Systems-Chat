import socket
import threading
import json
import time
import uuid
from colorama import Fore

from rawsockets import receive_message, send_message
from customwebsockets import parse_headers, websocket_handshake
from messages import format_chats

from disk.helpers import update_users, get_users, update_chats, get_chats


def parse_message(message, websocket, signed_users):
    data = json.loads(message)
    action = data.get("action")
    
    if action == "ping":
        pass
    elif action == "login":
        user_id = None

        # Look for user on disk (sign in action)
        for server_user_id in get_users().keys():
            if get_users().get(server_user_id).get("email") == data.get("email"):
                user_id = server_user_id

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
                    "users": [user_id, signed_user_id],
                    "image": [data.get("url"), signed_user.get("url")]
                }
                
                server_user_conn = signed_users.get(signed_user_id, {}).get("connection")
                
                if server_user_conn:
                    try:
                        send_message(server_user_conn, format_chats(chats, "chats", signed_users, user_id=signed_user_id))
                    except: pass
            
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

        # Tell online clients that current user is now online
        for signed_user_id in signed_users.keys():
            if signed_user_id == user_id: continue
            try:
                send_message(
                    signed_users.get(signed_user_id).get("connection"),
                    json.dumps(
                        {
                            "payload": {
                                "server_user_id": user_id,
                                "connected": True
                            },
                            "action": "update_active_users",
                        }
                    ),
                )
            except: pass
  
        # Persist user and update connection
        user["connection"] = websocket
        user.pop("user_id")
        signed_users[user_id] = user
        update_users(user_id, user)

    elif action == "list_chats":
        send_message(websocket, format_chats(get_chats(), "chats", signed_users, user_id=data.get("user_id")))

    elif action == "logout":
        user_id = data.get("user_id")
        if user_id in signed_users.keys():
            del signed_users[user_id]
        
            for signed_user in signed_users.values():
                if not signed_user.get("connection"): continue
                try:
                    send_message(
                        signed_user.get("connection"),
                        json.dumps(
                            {
                                "payload": {
                                    "server_user_id": user_id,
                                    "connected": False
                                },
                                "action": "update_active_users",
                            }
                        ),
                    )
                except: pass
        
    elif action == "join":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        
        send_message(
            websocket,
            format_chats(
                get_chats(), "current_chat", signed_users, user_id=user_id ,send_messages=True, chat_id=chat_id
            ),
        )

    elif action == "create_group":
        chats = get_chats()
        chats[str(uuid.uuid4())] = {
            "name": data.get("name"),
            "group": True,
            "messages": [],
            "users": [data.get("user_id")],
            "image": [data.get("url")]
        }

        update_chats(chats)

        # Tell other users about the created group
        for server_user_id in signed_users.keys():
            conn = signed_users.get(server_user_id).get("connection")
            if conn:
                try:
                    send_message(conn, format_chats(get_chats(), "chats", signed_users, user_id=server_user_id))
                except: pass

    elif action == "leave":
        chat_id = data.get("chat_id")
        user_id = data.get("user_id")
        chats = get_chats()
    
        if chats.get(chat_id):
            chats.get(chat_id)["users"] = [
                uid for uid in chats.get(chat_id)["users"] if uid != user_id
            ]
            
            # Retrieve updated group to current_user (could be done in frontend)
            send_message(
                websocket,
                format_chats(
                    chats, "current_chat", signed_users, user_id=user_id, send_messages=True, chat_id=chat_id
                ),
            )
               
            update_chats(chats)

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
        if chats.get(chat_id).get("group") and user_id not in chats.get(chat_id).get("users"):
            chats.get(chat_id).get("users").append(user_id)

        update_chats(chats)

        # Notify every user in the group about the message
        for usr_id in chats.get(chat_id, {}).get("users", []):
            client = signed_users.get(usr_id, {}).get("connection")

            if client:
                try:
                    send_message(
                        client,
                        format_chats(
                            chats, "current_chat", signed_users, user_id=usr_id, send_messages=True, chat_id=chat_id
                        ),
                    )
                except: pass
        
def handle_client(client_socket, users, kill_threads, users_lock, chats_lock, signed_users_lock):
    request = client_socket.recv(1024).decode("utf-8")
    headers = parse_headers(request)
    websocket_handshake(client_socket, headers)
    
    while True:
        try:
            if kill_threads[0]: break
            message = receive_message(client_socket)
            if message:
                users_lock.acquire()
                chats_lock.acquire()
                signed_users_lock.acquire()
                parse_message(message, client_socket, users)
                signed_users_lock.release()
                users_lock.release()
                chats_lock.release()
        except Exception as e:
            if "'utf-8' codec can't decode" not in str(e):
                print(f"\n{Fore.LIGHTYELLOW_EX + "End server process\n" + Fore.WHITE + " * "}Closing connection with client case decode error ocurred: {e}")
                break
    if signed_users_lock.locked():
        signed_users_lock.release()
    if users_lock.locked():
        users_lock.release()
    if chats_lock.locked():
        chats_lock.release()

    client_socket.close()

def start_server(port, users, users_lock, chats_lock, signed_users_lock):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    server_socket.bind(("0.0.0.0", int(port)))
    server_socket.listen(5)
    server_socket.settimeout(20)
    kill_threads = [False]
    print(f"\n{Fore.LIGHTYELLOW_EX + "End server process\n" + Fore.WHITE + " * "}Server started on ws://localhost:{port} 🚀")

    try:
        while True:
            client_socket, _ = server_socket.accept()
            client_thread = threading.Thread(target=handle_client, args=(client_socket, users, kill_threads, users_lock, chats_lock, signed_users_lock))
            client_thread.start()
    except TimeoutError as te:
        pass

    server_socket.close()
    kill_threads[0] = True
    print(f"\n{Fore.LIGHTYELLOW_EX + "End server process\n" + Fore.WHITE + " * "}Server on ws://localhost:{port} is down ⛔")