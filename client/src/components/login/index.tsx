import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/user";
import { FormEvent, useEffect, useState } from "react";

import "./styles.scss";

export function Login() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [url, setUrl] = useState("");
    const { user, client } = useUser();

    const navigate = useNavigate();

    useEffect(() => {
        if (user.user_id) {
            navigate("/chats")
        }
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!client || (client && client.readyState !== client.OPEN)) return

        client.send(JSON.stringify({
            action: "login",
            name,
            email,
            url
        }));
    }

    return (
        <main className="login-container">
            <h3 className="title">Bem vindo ao seu chat 📱</h3>
            <form onSubmit={handleSubmit} className="form">
                <input className="input" type="text" placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} />
                <input className="input" type="text" placeholder="Digite seu email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="input" type="text" placeholder="Digite a url do seu avatar" value={url} onChange={e => setUrl(e.target.value)} />
                <button className="button" type="submit">Entrar</button>
            </form>
        </main>
    )
}