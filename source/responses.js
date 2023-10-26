const questions = {
    thanks: {
        human: [
            "obrigado",
            "muito obrigado",
            "obrigado!",
            "obg",
            "thanks"
        ],
        assistant: [
            "Eu que agradeço! Estarei aqui sempre a sua disposição! 😉",
            "Tmj tripulante! Conte sempre comigo! 🤝",
            "Opa que isso! Eu estou aqui para isso mesmo! 🫡",
            "Conta comigo sempre! E lembre que o extraordinário, é você se manter disciplinado diáriamente todos os dias!",
            "Que isso mermão! Conte sempre comigo! 😉 Vamos papocar no like juntos!"
        ]
    },

    feedbacks: {
        human: [
            "okay",
            "ok",
            "blz",
            "vlw",
        ],
        assistant: [
            "Tmj!",
            "😉",
            "😘",
            "🫡",
            "✌️",
            "👊",
            "🤙"
        ]
    },
};

/** Retornar  */
const response = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

module.exports = {
    questions,
    response
}