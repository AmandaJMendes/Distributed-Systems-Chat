const ws = require('ws')
const server = new ws.Server({port:'3000'})
//dicionário que associa nome ao id
//dicionario chave sendo id da sala que contém lista das mensagem e clientes que fazem parte da sala
// estrutura mensagem: keys = [id do usuário, id da sala, timestamp, mensagem, acao] - JSON
// enviar mensage, criar grupo, entrar no grupo e sair do grupo
let seq_id = 1

let users = {}; // keys: user id | values: username
let chats = {}; // keys: chat id | values: {"messages": [(user_id, timestamp, text)], "users": [(user_id)]}
// {name, id,    user/group/msg}
server.on('connection', socket => {
    //clients.push(socket)
    socket.on('message', message => {
        const data = JSON.parse(message);
        //console.log('Received JSON data:', data);
        switch(data["action"]) {
            case "login":  // Log in to the application
                users[seq_id] = {"name": data["name"], "connection": socket}
                seq_id+=1
                break
            case "logout": // Log out of the application
                delete users[data["user_id"]]
                for (let c_id in chats) {
                    chats[c_id]["users"] = chats[c_id]["users"].filter(uid => uid !== data["user_id"])
                }
                break
            case "create": // Create new group
                chats[seq_id] = {"name": data["name"], "messages": [], "users": [data["user_id"]]}
                seq_id+=1
                break
            case "join":   // Join group
                chats[data["chat_id"]]["users"].push(data["user_id"])
                break
            case "leave":  // Leave group
                chats[data["chat_id"]]["users"] = chats[data["chat_id"]]["users"].filter(uid => uid !== data["user_id"]);
                // Delete chat when it's empty?
                break
            case "send":  // Send message
                let msg = {"user_id"   : data["user_id"],
                           "timestamp" : Date.now(),
                           "text"      : data["msg"]}
                let c_id = data["chat_id"]

                if (!chats[data["chat_id"]] && users[data["chat_id"]]){
                    chats[seq_id] = {"name": "", "messages": [msg], "users": [data["user_id"], data["chat_id"]]}
                    msg["chat_id"] = seq_id
                    c_id = seq_id
                    seq_id+=1
                }
                chats[c_id]["users"].forEach(usr_id => {
                    const client    = users[usr_id]["connection"]
                    const send_data = JSON.stringify(msg);
                    client.send(send_data)
                })
                
            default:
                break;
        }
        })
})
