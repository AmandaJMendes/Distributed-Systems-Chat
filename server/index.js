const ws = require('ws')
const server = new ws.Server({port:'3000'})
//dicionário que associa nome ao id
//dicionario chave sendo id da sala que contém lista das mensagem e clientes que fazem parte da sala
// estrutura mensagem: keys = [id do usuário, id da sala, timestamp, mensagem, acao] - JSON
// enviar mensage, criar grupo, entrar no grupo e sair do grupo
const user_id = 1
const chat_id = 1

let users = {};

server.on('connection', socket => {
    console.log('oi')
    //clients.push(socket)
    socket.on('message', message => {
        const data = JSON.parse(message);
        console.log('Received JSON data:', data);
        
        //clients.forEach(client => {client.send(`${message}`)})
    })
})
