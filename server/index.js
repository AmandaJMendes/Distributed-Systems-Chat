const ws = require('ws')
const server = new ws.Server({port:'3000'})

clients = []

server.on('connection', socket => {
    console.log('oi')
    clients.push(socket)
    socket.on('message', message => {
        console.log(message)
        clients.forEach(client => {client.send(`${message}`)})
    })
})
