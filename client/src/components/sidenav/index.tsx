import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FiLogOut, FiRss, FiPlusCircle } from "react-icons/fi";
import { useUser } from "../../context/user";

import "./styles.scss"

export function SideNav() {
    const { user, logout, data, client } = useUser();
    const navigate = useNavigate();

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

    return (
        <div className="container">
            <nav>
                {client && client.readyState === client.OPEN &&
                    <div className="status">
                        <span className="connected">
                            Conectado
                        </span>
                        <FiPlusCircle className="icon" onClick={handleLogout} />
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
                        <Link key={chat.id} to={`/chats/${chat.id}`}>
                            <img src={getChatImage(chat)} alt="user placeholder" className="image" />
                            {getChatName(chat)}
                        </Link>
                    ))
                }
            </nav>
            <Outlet />
        </div>
    )
}