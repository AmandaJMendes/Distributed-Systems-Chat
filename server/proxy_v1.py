from threading import Thread, Lock
from time import sleep
from colorama import Fore
from time import sleep

from pyserver import start_server

SERVER_TIMEOUT = 20
DELAY_TO_LAUNCH = 1

# Currently logged users
signed_users = {} 
users_lock = Lock()
chats_lock = Lock()

def auto_starter():
    global signed_users

    server_thread_1 = Thread(target=start_server, args=(3000, signed_users, users_lock, chats_lock))
    server_thread_1.start()
    server_thread_2 = Thread(target=start_server, args=(4000, signed_users, users_lock, chats_lock))
    server_thread_2.start()

    while True:
        try:
            if not server_thread_1.is_alive():
                sleep(DELAY_TO_LAUNCH)
                print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Restarting server on localhost:3000 🔁\n * Main server is now on localhost:4000")
                server_thread_1 = Thread(target=start_server, args=(3000, signed_users, users_lock, chats_lock))
                server_thread_1.start()
        
            if not server_thread_2.is_alive():
                sleep(DELAY_TO_LAUNCH)
                print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Restarting server on localhost:4000 🔁\n * Main server is now on localhost:3000")
                server_thread_2 = Thread(target=start_server, args=(4000, signed_users, users_lock, chats_lock))
                server_thread_2.start()

            sleep(0.1)
        except KeyboardInterrupt:
            break


if __name__ == "__main__":
    t = Thread(target=auto_starter)
    t.start()
    t.join()
