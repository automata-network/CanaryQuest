const appRouter = [
    {
        name: "wrapper",
        path: "/",
        redirect: "/index",
        component: () => import("@/views/wrapper"),
        children: [
            {
                name: "login",
                path: "/login",
                meta: {title: "Canary Quests"},
                component: () => import("@/views/login")
            },
            {
                name: "index",
                path: "/index",
                meta: {title: "Canary Quests"},
                component: () => import("@/views/quests")
            }
        ]
    },
    {
        name: "404",
        path: "/*",
        redirect: "/"
    }
];

export const routes: Array<any> = [
    ...appRouter
];
