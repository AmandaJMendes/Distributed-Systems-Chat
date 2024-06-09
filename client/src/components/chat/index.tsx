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
            chat_id: chatId,
            message
        }));
        setMessage("");
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString();
    }

    const getUserColor = (user_id: number) => {
        if (user_id === user.user_id) return "#ffffff";
        const index = user_id % 6;
        return colors[index];
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
        if (e.key === "Enter") send();
    }

    if (data.current_chat.length === 0) {
        return (
            <div>Erro ao carregar o chat</div>
        )
    }

    return (

        <main>
            <div className='header'>
                <img src="/user.png" alt="user placeholder" className='image' />
                <span>{data.current_chat[0].name}</span>
                <span className='display-time' onClick={_ => setShowTimestamp(!showTimestamp)}>Mostrar hora do envio</span>
            </div>
            <div className='chat' id='chat'>
                {data.current_chat[0].messages && data.current_chat[0].messages.map((message: any) => (
                    <div className={`message-container ${message.user_id === user.user_id && "own-user"}`} key={message.timestamp}>
                        <img src={message.user_url ?? "/user.png"} alt="user placeholder" className='image' />
                        <p className='text'>
                            <span className='user' style={{ color: getUserColor(message.user_id) }}>{message.user_name}</span>
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