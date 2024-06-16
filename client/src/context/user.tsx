import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getClient } from "../utils/api";

type User = {
    user_id: string
    user_name: string
    user_email: string
    user_url: string
}

interface UserContext {
    logout: (user_id: string) => void
    unnotify: (chat_id: string) => void;
    user: User
    data: any
    client: WebSocket
}

interface UserContextProviderProps {
    children: ReactNode
}

const UserContext = createContext<UserContext>({} as UserContext);

export function UserContextProvider({ children }: UserContextProviderProps) {
    const [user, setUser] = useState<User>(() => {
        const maybeUser = localStorage.getItem("@chat_user");
        if (maybeUser) {
            return JSON.parse(maybeUser) as User;
        }
        return {} as User;
    });

    const [data, setData] = useState({
        chats: [],
        current_chat: {} as any
    });
    const [client, setClient] = useState<WebSocket>(null as unknown as WebSocket);

    const login = (user: User) => {
        localStorage.setItem("@chat_user", JSON.stringify(user));
        setUser(user);
    }
    const logout = (user_id: string) => {
        client.send(JSON.stringify({ action: "logout", user_id }))
        localStorage.removeItem("@chat_user");
        setUser({} as User);
    }

    const unnotify = (chat_id: string) => {
        setData(data => {
            const updatedChats = [...data.chats];
            
            const updated_chat: any = updatedChats.find((_chat: any) => _chat.id === chat_id);
            if (updated_chat) {
                updated_chat.unreads = 0;
            }

            return { ...data, chats: updatedChats };
        });
    }

    useEffect(() => {
        let threadClient: WebSocket;
        const connect = async () => {
            //console.log("Attempting to connect to server")
            const client = await getClient("context");
            client.onmessage = (response) => {
                const parsedResponse = JSON.parse(response.data);
                console.log(parsedResponse.action, parsedResponse.payload);
                
                switch(parsedResponse.action){
                    case "login":
                        const { user_id, name, email, url } = parsedResponse.payload;
                        setData(data => ({ ...data, login: parsedResponse.payload }));
                        login({ user_name: name, user_id, user_email: email, user_url: url });
                        break;

                    case "current_chat":
                        const chat = parsedResponse.payload[0];
                        
                        if (chat.id !== data.current_chat.id) {
                            setData(data => {
                                const updatedChats = [...data.chats];
                                
                                const updated_chat: any = updatedChats.find((_chat: any) => _chat.id === chat.id);
                                if (updated_chat && !window.location.href.endsWith(updated_chat.id)) {
                                    updated_chat.unreads = updated_chat.unreads ? updated_chat.unreads + 1 : 1;
                                }
    
                                return { ...data, chats: updatedChats };
                            });
                        }

                        if (window.location.href.endsWith("chats")) return;
                        
                        setData(data => {
                            const updatedChats = [...data.chats];
                            const current_chat = window.location.href.includes(chat.id) ? chat : data.current_chat;
                            
                            const updated_chat: any = updatedChats.find((_chat: any) => _chat.id === chat.id);
                            if (updated_chat && window.location.href.endsWith(updated_chat.id)) {
                                updated_chat.unreads = 0;
                            }

                            return { ...data, chats: updatedChats, current_chat };
                        });
                        
                        const chat_element = (document.getElementById("chat"));
                        if (!chat_element) return;
                        chat_element.scrollTop = chat_element.scrollHeight;
                        break;
                    
                    case "update_active_users":
                        setData(data => {
                            const updatedChats = [...data.chats];
                            const { server_user_id, connected } = parsedResponse.payload;
                            
                            const dm: any = updatedChats.find((dm: any) => !dm.group && dm.users.includes(server_user_id));
                            if (dm) {
                                dm.is_dm_user_connected = connected;
                            }
                            
                            let current_chat = data.current_chat;
                            if (Object.keys(data.current_chat).length && !data.current_chat.group && data.current_chat.users.includes(server_user_id)) {
                                current_chat.is_dm_user_connected = connected;
                            }

                            return { ...data, chats: updatedChats };
                        });
                        break;
                    default:
                        setData(data => ({ ...data, [parsedResponse.action]: parsedResponse.payload }));
                }
            }
            threadClient = client;
            setClient(client);
        }

        const checkClient = setInterval(() => {
            //if (threadClient) threadClient.send(JSON.stringify({ action: "ping" }));
            if (!threadClient || (threadClient && threadClient.readyState !== threadClient.OPEN)) {
                setClient(null as unknown as WebSocket);
                connect();
            }
        }, 5000);

        return () => clearInterval(checkClient);
    }, []);


    return (
        <UserContext.Provider value={{ logout, user, data, client, unnotify }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext);