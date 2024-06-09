//import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from "react-router-dom";
import { router } from './router.tsx';
import { UserContextProvider } from './context/user.tsx';
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  //<React.StrictMode>
    <UserContextProvider>
        <RouterProvider router={router} />
    </UserContextProvider>
  //</React.StrictMode>,
)
