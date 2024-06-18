import asyncio
import websockets

from threading import Thread
from time import sleep
from subprocess import run
from colorama import Fore
from time import sleep

SERVER_TIMEOUT = 20
current_server = "ws://localhost:3005"

async def handle_client(client_websocket, path):
    global current_server  
    while True:
        print(f"\n{Fore.CYAN + "Proxy thread\n" + Fore.WHITE + " * "} Forwarding to {current_server}")
        async with websockets.connect(current_server) as server_websocket:
            try:
                async def forward_messages(websocket_from, websocket_to):
                    async for message in websocket_from:
                        await websocket_to.send(message)

                # Run message forwarding
                await asyncio.gather(
                    forward_messages(client_websocket, server_websocket),
                    forward_messages(server_websocket, client_websocket),
                )
            except Exception as e:
                pass
                #print("\n\nERROR on proxy server")
                #print(current_server)
                #print("END ERROR on proxy server\n\n")

def auto_starter():
    global current_server
    def start_backend(port):
        run(["python", "pyserver.py", str(port), str(SERVER_TIMEOUT)])
        print(1)

    server_thread_3000 = Thread(target=start_backend, args=(3005,))
    server_thread_3000.start()
    sleep(SERVER_TIMEOUT / 2)
    server_thread_3001 = Thread(target=start_backend, args=(3006,))
    server_thread_3001.start()

    while True:
        try:
            if not server_thread_3000.is_alive():
                print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Restarting server on localhost:3005 \n * Main server is now on localhost:3006")
                server_thread_3000 = Thread(target=start_backend, args=(3005,))
                server_thread_3000.start()
                sleep(5)
                current_server = "ws://localhost:3006"
        
            if not server_thread_3001.is_alive():
                print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Restarting server on localhost:3006 \n * Main server is now on localhost:3005")
                sleep(5)
                server_thread_3001 = Thread(target=start_backend, args=(3006,))
                server_thread_3001.start()
                current_server = "ws://localhost:3005"
            #print(f"\n{Fore.LIGHTMAGENTA_EX + "Auto scaler thread\n" + Fore.WHITE + " * "}Current active server {current_server}")
            sleep(1)
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    Thread(target=auto_starter).start()
    start_server = websockets.serve(handle_client, 'localhost', 8765)

    print(f"\n{Fore.CYAN + "Proxy thread\n" + Fore.WHITE + " * "}WebSocket proxy server started on ws://localhost:8765")
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
    