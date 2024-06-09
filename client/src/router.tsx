import {
  createBrowserRouter,
  Navigate
} from "react-router-dom";

import { SideNav } from "./components/sidenav";
import { Chat } from "./components/chat";
import { Login } from "./components/login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" />
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/chats",
    element: <SideNav />,
    children: [
      {
        path: ":chatId",
        element: <Chat />
      }
    ],
  },
])

