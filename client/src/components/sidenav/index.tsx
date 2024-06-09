import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FiLogOut, FiRss } from "react-icons/fi";
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
            }));
        }

        getChats();
    }, [client]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    }

    if (data.chats.length === 0) {
        return (
            <div>Não foi possível listar os chats</div>
        )
    }

    return (
        <div className="container">
            <nav>
                {client && client.readyState === client.OPEN &&
                    <div className="status">
                        <span className="connected">
                            Conectado
                        </span>
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
                            <img src="/user.png" alt="user placeholder" className="image" />
                            {chat.name}
                        </Link>
                    ))
                }
            </nav>
            <Outlet />
        </div>
    )
}