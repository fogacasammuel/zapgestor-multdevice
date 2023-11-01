import express from "express";
import venom from "venom-bot";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import { dirname } from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/**
 * CONTROLE DE SESSÕES DO SISTEMA
 * -------------------------------------------------------------------------->
 */
let sessions = [];
const SESSIONS_FILE = "./whatsapp-sessions.json";

const createSessionsFile = () => {
    if (!fs.existsSync(SESSIONS_FILE)) {
        try {
            fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
        } catch (error) {
            console.log(error);
        }
    }
}

const setSessionsFile = (sessions) => {
    fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), (error) => {
        if (error) console.log(error);
    });
}

const getSessionsFile = () => {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const getSessionIndex = (savedSessions, session) => {
    let index = -1;
    savedSessions.find((item, i) => { if (item.session === session) index = i; });
    return index;
}

createSessionsFile();

/** --------------------------------------------------------------------------> */


/**
 * INICIALIZA O APP
 * -------------------------------------------------------------------------->
 */
const createSession = async (session, multdevide, company) => {
    const client = await venom.create({
        session: session,
        multdevide: multdevide,
        puppeteerOptions: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
        ],
        catchQR: (base64Qr) => {
            io.emit("qrcode", {
                session: session,
                source: base64Qr
            });
        },
        logQR: false,
        statusFind: (statusSession) => {
            io.emit("message", statusSession);
        }
    });

    sessions.push({ session: session, company: company, client: client });
    const savedSessions = getSessionsFile();
    let index = getSessionIndex(savedSessions, session);
    if (index == -1) {
        savedSessions.push({ session: session, ready: false });
        setSessionsFile(savedSessions);
    }

    client.onStateChange((state) => {
        io.emit("message", state);

        if (state === "CONNECTED") {
            const savedSessions = getSessionsFile();
            let index = getSessionIndex(savedSessions, session);
            savedSessions[index].ready = true;
            setSessionsFile(savedSessions);
        }
    });

    const clientLogged = sessions.find(session => session.session == "testando")?.client;
    clientLogged.onMessage((message) => {
        console.log(message.from);
    });
};

const initialize = (socket) => {
    const savedSessions = getSessionsFile();

    if (savedSessions.length > 0) {
        if (socket) {
            savedSessions.forEach((value, index, data) => {
                data[index].ready = false;
            });

            socket.emit("initialize", savedSessions);
        } else {
            savedSessions.forEach(session => {
                createSession(session.session, false);
            });
        }
    }
};

initialize();

/** ---------------------------------------------------------------------------------> */

io.on("connection", async (socket) => {
    initialize(socket);

    socket.on("create-session", (data) => {
        createSession(data.session, data.multdevide);
    });

    socket.on("logout-session", async (data) => {
        const client = sessions.find(session => session.session == data.sender)?.client;
        await client.logout();

        const savedSessions = getSessionsFile();
        let index = getSessionIndex(savedSessions, data.sender);
        savedSessions.splice(index, 1);
        setSessionsFile(savedSessions);

        socket.emit("message", "DICONNECTED");
    });
});

//users
app.post("/text", async (req, res) => {
    const body = req.body;

    const client = sessions.find(session => session.session == body.sender)?.client;
    if (!client) {
        return res
            .status(400)
            .json({ error: 400, message: `The sender: ${body.sender} is not found!` });
    }

    client.sendText(body.number, body.content).catch((erro) => {
        return res
            .status(500)
            .json({ error: 500, message: "Error when sending", erro: erro });
    });

    return res.status(200).json();
});

app.post("/buttons", async (req, res) => {
    const body = req.body;
    const buttons = JSON.parse(body.buttons);

    const client = sessions.find(session => session.session == body.sender)?.client;
    if (!client) {
        return res
            .status(400)
            .json({ error: 400, message: `The sender: ${body.sender} is not found!` });
    }

    client.sendButtons(body.number, body.title, buttons, body.content).catch((erro) => {
        return res
            .status(500)
            .json({ error: 500, message: "Error when sending", erro: erro });
    });

    return res.status(200).json();
});

//Função responsavel por pegar informaçoes do grupo pesquisado
async function findGroupByName(client, groupName) {
    const group = await client.getAllChats().then((chats) => {
        return chats.find((chat) => {
            if (chat.isGroup && chat.name === groupName) {
                return chat;
            }
        });
    });

    return group;
}

server.listen(3000, () => console.log("Server rodando em :3000"));
