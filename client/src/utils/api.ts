
export const getClient = (origin = "unknown") => new Promise<WebSocket>((res, rej) => {
    const webSocketClient = new WebSocket('ws://localhost:3000');
    let counter = 0;
    const thread = setInterval(() => {
        if (webSocketClient.readyState === webSocketClient.OPEN) {
            console.log(`client from ${origin} is connected!`, webSocketClient)

            const maybeUser = localStorage.getItem("@chat_user");
            if (maybeUser) {
                const { user_id, user_name, user_email } = JSON.parse(maybeUser);
                webSocketClient.send(JSON.stringify({
                    action: "login",
                    user_id,
                    user_name,
                    user_email
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
    }, 10)
})