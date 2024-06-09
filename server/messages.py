import json

def format_chats(chats: dict, action, send_messages = False, chat_id=None):
    payload = []
    for key in chats.keys():
        if chat_id is not None and chat_id != key: continue
        if send_messages:
            payload.append(
                {
                    "id": key,
                    "name": chats[key]["name"],
                    "messages": chats[key]["messages"]
                }
            )
            continue

        payload.append(
            {
                "id": key,
                "name": chats[key]["name"]
            }
        )

    return json.dumps({ "action": action, "payload": payload})
    