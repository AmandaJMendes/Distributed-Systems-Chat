import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '../../context/user';
import { FiSend } from "react-icons/fi";

import './styles.scss'

const colors = ["#7DF9FF", "#39FF14", "#FF00FF", "#BF00FF", "#FF6E4A", "#FF0000"]

export function Chat() {
    const { chatId } = useParams();
    const { user, data, client } = useUser();
    const [message, setMessage] = useState("");
    const [showTimestamp, setShowTimestamp] = useState(false);

    useEffect(() => {
        const joinChat = async () => {
            if (!client || (client && client.readyState !== client.OPEN)) return

            client.send(JSON.stringify({
                action: "join",
                chat_id: chatId,
                user_id: user.user_id
            }));
        }

        joinChat();
    }, [chatId, client])

    const send = async () => {
        if (message.trim() === "") return;
        if (!client || (client && client.readyState !== client.OPEN)) return;

        client.send(JSON.stringify({
            action: "send",
            user_id: user.user_id,
            user_name: user.user_name,
            user_url: user.user_url,
            chat_id: chatId,
            message
        }));
        setMessage("");
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString();
    }

    const getUserColor = (user_name: string) => {
        if (user_name === user.user_name) return "#ffffff";
        const index = user_name.length % 6;
        return colors[index];
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
        if (e.key === "Enter") send();
    }

    const getChatName = () => {
        if (!Object.keys(data.current_chat ?? []).length) return;
        if (data.current_chat.group){
            return data.current_chat.name;
        }
        
        const index = data.current_chat.users.indexOf(user.user_id);
        return data.current_chat.name.split("|")[1-index];
    }

    const getChatImage = (chat: any) => {
        if (!Object.keys(data.current_chat).length) return;
        if (chat.group){
            return chat.image[0] ? chat.image[0] : "/user.png";
        }

        const index = chat.users.indexOf(user.user_id);
        return chat.image[1-index] ? chat.image[1-index] : "/user.png";
    }

    const handleLeaveGroup = () => {
        client.send(JSON.stringify({
            action: "leave",
            user_id: user.user_id,
            chat_id: data.current_chat.id
        }));
    }

    const userInGroup = () => {
        return data.current_chat.group && data.current_chat.users.includes(user.user_id);
    }

    if (!Object.keys(data.current_chat).length) {
        return (
            <div>Erro ao carregar o chat</div>
        )
    }

    return (

        <main>
            <div className='header'>
                <img src={getChatImage(data.current_chat)} alt="user placeholder" className='image' />
                <span>{getChatName()}</span>
                <div className='actions'>
                    { userInGroup() && <span className='leave-group' onClick={ _ => handleLeaveGroup() }>Sair do grupo</span> }
                    <span className='display-time' onClick={ _ => setShowTimestamp(!showTimestamp)}>Mostrar hora do envio</span>
                </div>
            </div>
            <div className='chat' id='chat'>
                { data.current_chat.messages.map((message: any) => (
                    <div className={`message-container ${message.user_id === user.user_id && "own-user"}`} key={message.timestamp}>
                        <img src={message.user_url ? message.user_url  : "/user.png"} alt="user placeholder" className='image' />
                        <p className='text'>
                            <span className='user' style={{ color: getUserColor(message.user_name) }}>{message.user_name}</span>
                            <span>{message.text}</span>
                            {showTimestamp && <span className='timestamp'>{formatDate(message.timestamp)}</span>}
                        </p>
                    </div>
                ))}
            </div>
            <div className='footer'>
                <input className='input' type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => handleKeyDown(e as unknown as KeyboardEvent)} />
                <div className='send-button'>
                    <FiSend onClick={_ => send()} />
                </div>
            </div>
        </main>
    )
}