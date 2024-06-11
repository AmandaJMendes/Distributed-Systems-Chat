import json

def format_chats(chats: dict, action, user_id=None, send_messages = False, chat_id=None):
    payload = []
    for key in chats.keys():
        # Filter specific chat. Used for retrieving the active chat
        if chat_id is not None and chat_id != key: continue
        
        # Filter DMs. We only want to send DMs that envolve user_id.
        # For groups, we ignore this filter: we will send every group to the user, regardless if he belogns to it 
        if user_id is not None and not chats.get(key).get("group") and user_id not in chats.get(key).get("users"): continue

        if send_messages:
            payload.append(
                {
                    "id": key,
                    "name": chats[key]["name"],
                    "users": chats[key]["users"],
                    "messages": chats[key]["messages"],
                    "group": chats[key]["group"],
                    "image": chats[key]["image"]
                }
            )
            continue

        payload.append(
            {
                "id": key,
                "name": chats[key]["name"],
                "users": chats[key]["users"],
                "group": chats[key]["group"],
                "image": chats[key]["image"]
            }
        )
    
    return json.dumps({ "action": action, "payload": payload})
    