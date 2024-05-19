const socket = new WebSocket('ws://localhost:3000')

function sendMessage(e){
    e.preventDefault()

    const form = document.getElementById('myForm');
    const formData = {};
    for (let element of form.elements) {
        if (element.name) {
            formData[element.name] = element.value;
        }
    }
    
    if (formData["action"]){
        console.log(213123)
        const jsonData = JSON.stringify(formData);
        socket.send(jsonData)
    }
    //input.focus()
}

document.querySelector('form').addEventListener('submit', sendMessage)

socket.addEventListener('message', ({ data }) => {
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
})
