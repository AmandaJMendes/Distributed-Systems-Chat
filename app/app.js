const socket = new WebSocket('ws://localhost:3000')

function sendMessage(e){
    e.preventDefault()
    const input = document.querySelector('#msg')
    const name  = document.querySelector('#username')
    if (input.value){
        socket.send(name.value + ": " + input.value)
        input.value = ""
    }
    input.focus()
}

document.querySelector('form').addEventListener('submit', sendMessage)

socket.addEventListener('message', ({ data }) => {
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
})
