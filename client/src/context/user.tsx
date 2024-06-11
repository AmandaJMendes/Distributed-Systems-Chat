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
        client.send(JSON.stringify({ user_id }))
        localStorage.removeItem("@chat_user");
        setUser({} as User);
    }

    useEffect(() => {
        let threadClient: WebSocket;
        const connect = async () => {
            console.log("Attempting to connect to server")
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
                        const chat = parsedResponse.payload;
                        if (chat.id !== data.current_chat.id) return;
                        
                        setData(data => ({ ...data, current_chat: parsedResponse.payload[0] }));
                        const chat_element = (document.getElementById("chat"));
                        if (!chat_element) return;
                        chat_element.scrollTop = chat_element.scrollHeight;
                        break;
                    default:
                        setData(data => ({ ...data, [parsedResponse.action]: parsedResponse.payload }));
                }

                if (parsedResponse.action === "current_chat") {
                    
                }
            }
            threadClient = client;
            setClient(client);
        }

        const checkClient = setInterval(() => {
            if (!threadClient || (threadClient && threadClient.readyState !== threadClient.OPEN)) {
                setClient(null as unknown as WebSocket);
                connect();
            }
        }, 2000);

        return () => clearInterval(checkClient);
    }, []);


    return (
        <UserContext.Provider value={{ logout, user, data, client }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext);