
export const getClient = (origin = "unknown") => new Promise<WebSocket>((res, rej) => {
    let webSocketClient: WebSocket = new WebSocket(`ws://54.147.21.35:4000`);
    let counter = 0;
    
    let port = 3000;
    let oldPort = 4000;

    const thread = setInterval(() => {
        if(oldPort !== port){
            webSocketClient.close()
            webSocketClient = new WebSocket(`ws://54.147.21.35:${port}`);
            oldPort = port;
        }

        if (webSocketClient.readyState === webSocketClient.OPEN) {
            console.log(`client from ${origin} is connected on ws://54.147.21.35:${port}!`)

            const maybeUser = localStorage.getItem("@chat_user");
            if (maybeUser) {
                const { user_id, user_name, user_email, user_url } = JSON.parse(maybeUser);
                webSocketClient.send(JSON.stringify({
                    action: "login",
                    user_id,
                    name: user_name,
                    email: user_email,
                    url: user_url,
                }));
            }

            res(webSocketClient);
            clearInterval(thread);
        } else if (counter === 50) {
            rej("Failed to connect to server")
            clearInterval(thread);
        } else {
            counter++;
        }

        if (counter % 10 === 0) {
            port = port === 3000 ? 4000 : 3000;
        }
    }, 100)
})