
export const getClient = () => new Promise<WebSocket>((res, rej) => {
    let webSocketClient: WebSocket = new WebSocket(`ws://chat.joaomellof.com:4000`);
    let counter = 0;
    let port = 4000;

    const thread = setInterval(() => {
        if (counter % 25 === 0) {
            webSocketClient.close()
            webSocketClient = new WebSocket(`ws://chat.joaomellof.com:3000`);
            port = 3000;
        }

        if (webSocketClient.readyState === webSocketClient.OPEN) {
            console.log(`client is connected on ws://chat.joaomellof.com:${port}!`)

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
    }, 75)
})