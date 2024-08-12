import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiLogOut, FiRss, FiPlusCircle, FiX } from "react-icons/fi";
import { useUser } from "../../context/user";
import Modal from 'react-modal';

import "./styles.scss"

export function SideNav() {
    const { user, logout, data, client } = useUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (!user.user_id) {
            navigate("/login");
            return;
        }

        const getChats = async () => {
            if (!client || (client && client.readyState !== client.OPEN)) return

            client.send(JSON.stringify({
                action: "list_chats",
                user_id: user.user_id
            }));
        }

        getChats();
    }, [client]);

    const handleLogout = () => {
        logout(user.user_id);
        navigate("/login");
    }

    const handleCreateGroup = () => {
        client.send(JSON.stringify({
            action: "create_group",
            name,
            url,
            user_id: user.user_id
        }));
        setName("");
        setUrl("");
        setOpen(false);
    }

    const getChatName = (chat: any) => {
        if (chat.group){
            return chat.name;
        }

        const index = chat.users.indexOf(user.user_id);
        return chat.name.split("|")[1-index];
    }

    const getChatImage = (chat: any) => {
        if (chat.group){
            return chat.image[0] ? chat.image[0] : "/user.png";
        }

        const index = chat.users.indexOf(user.user_id);
        return chat.image[1-index] ? chat.image[1-index] : "/user.png";
    }

    const displayUnreads = (chat: any) => {
        return chat.unreads && chat.unreads > 0;
    }

    return (
        <div className="container">
            <nav className="nav">
                {client && client.readyState === client.OPEN &&
                    <div className="status">
                        <span className="connected">
                            Conectado - {user.user_name}
                        </span>
                        <FiPlusCircle className="icon" onClick={ _ => setOpen(true) } />
                        <FiLogOut className="icon" onClick={handleLogout} />
                    </div>
                }
                {!client &&
                    <div className="status">
                        <span className="connecting">
                            Conectando
                            <FiRss />
                        </span>
                        <FiLogOut className="icon" onClick={handleLogout} />
                    </div>
                }
                {
                    data.chats.map((chat: any) => (
                        <Link className="link" key={chat.id} to={`/chats/${chat.id}`}>
                            <img src={getChatImage(chat)} alt="user placeholder" className="image" />
                            {getChatName(chat)} 
                            { chat.is_dm_user_connected && <span className="connected">🟢</span> }
                            { displayUnreads(chat) > 0 && <span className="unreads">{chat.unreads}</span> }
                        </Link>
                    ))
                }
            </nav>
            <Outlet />
            <Modal
                isOpen={open}
                onAfterOpen={_ => {}}
                onRequestClose={ _ => setOpen(false) }
                className="modal"
                overlayClassName="overlay"
                contentLabel="Example Modal"
            >
                <FiX className="close" onClick={ _ => setOpen(false) }/>
                <div className="form-container">
                    <h3 className="form-title">Criar grupo</h3>
                    <form onSubmit={handleCreateGroup} className="form">
                        <input className="input" type="text" placeholder="Digite o nome do grupo" value={name} onChange={e => setName(e.target.value)} />
                        <input className="input" type="text" placeholder="Digite a url da imagem do grupo" value={url} onChange={e => setUrl(e.target.value)} />
                        <button className="button" type="submit">Criar</button>
                    </form>
                </div>
            </Modal>
        </div>
    )
}