from threading import Thread
from time import sleep
from colorama import Fore
from time import sleep

from pyserver import start_server

SERVER_TIMEOUT = 20
DELAY_TO_LAUNCH = 5

# Currently logged users
signed_users = {} 

def auto_starter():
    global signed_users

    server_thread_1 = Thread(target=start_server, args=(3000, signed_users,))
    server_thread_1.start()
    sleep(10)
    server_thread_2 = Thread(target=start_server, args=(4000, signed_users,))
    server_thread_2.start()

    while True:
        try:
            if not server_thread_1.is_alive():
                print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Restarting server on localhost:3000 in 5 seconds 🔁\n * Main server is now on localhost:4000")
                sleep(10)
                server_thread_1 = Thread(target=start_server, args=(3000, signed_users,))
                server_thread_1.start()
        
            if not server_thread_2.is_alive():
                print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Restarting server on localhost:4000 in 5 seconds 🔁\n * Main server is now on localhost:3000")
                sleep(10)
                server_thread_2 = Thread(target=start_server, args=(4000, signed_users,))
                server_thread_2.start()

            sleep(0.1)
        except KeyboardInterrupt:
            break


if __name__ == "__main__":
    print("Hey there")
    t = Thread(target=auto_starter)
    t.start()
    t.join()
