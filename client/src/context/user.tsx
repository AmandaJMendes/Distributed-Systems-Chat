import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getClient } from "../utils/api";

type User = {
    user_id: number
    user_name: string
    user_email: string
}

interface UserContext {
    logout: () => void
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
        current_chat: []
    });
    const [client, setClient] = useState<WebSocket>(null as unknown as WebSocket);

    const login = (user: User) => {
        localStorage.setItem("@chat_user", JSON.stringify(user));
        setUser(user);
    }
    const logout = () => {
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
                setData(data => ({ ...data, [parsedResponse.action]: parsedResponse.payload }));

                if (parsedResponse.action === "login") {
                    const { user_id, name, email } = parsedResponse.payload;
                    login({ user_name: name, user_id, user_email: email });
                }

                if (parsedResponse.action === "current_chat") {
                    const chat = (document.getElementById("chat"));
                    if (!chat) return;
                    chat.scrollTop = chat.scrollHeight;
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