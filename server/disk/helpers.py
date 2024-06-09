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
