from json import load, dumps


def update_users(_id, original_user):
    with open("disk/disk.json", "r+") as file:
        users = load(file)
        user = {
            "name": original_user.get("name"),
            "email": original_user.get("email"),
            "url": original_user.get("url"),
        }
        
        users[_id] = user
        
        file.seek(0)
        file.write(dumps(users))

def get_users():
    with open("disk/disk.json") as file:
        return load(file)
    
def update_chats(chats):
    with open("disk/chats.json", "r+") as file:
        file.seek(0)
        file.write(dumps(chats))

def get_chats():
    with open("disk/chats.json") as file:
        return load(file)
        