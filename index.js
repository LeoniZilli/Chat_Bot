const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// Adicionar numeros que serão autorizados utilizar o Chat
const allowNumber = [''];

const client = new Client({
    puppeteer: {
        executablePath: '/usr/bin/google-chrome', // Caminho para o executável do Chrome para servidor Linux
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth()
});

client.on('qr', (qrCode) => {
    qrcode.generate(qrCode, { small: true });
});

client.on('ready', () => {
    console.log('Autenticado com sucesso!');
});

let conversationStates = {};
let userResponses = {};
let timeoutTimer;


// Perguntas que serão enviadas 
const questions = {
    'start': {
        question: 'Olá! Eu sou o bot de autoatendimento NOC Unicesumar 🤖.\nDe qual cidade você está falando?',
        options: {
            '1': { answer: ' Corumbá', nextState: 'serviceProblem' },
            '2': { answer: ' Curitiba', nextState: 'serviceProblem' },
            '3': { answer: ' Londrina', nextState: 'serviceProblem' },
            '4': { answer: ' Maringá', nextState: 'serviceProblem' },
            '5': { answer: ' Ponta Grossa', nextState: 'serviceProblem' },
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'serviceProblem': {
        question: 'Você esta enfrentando dificuldade em qual serviço ? ',
        options: {
            '1': { answer: ' Internet', nextState: 'internetProblem' },
            '2': { answer: ' Telefone', nextState: 'telephoneProblem' },
            '3': { answer: ' Ambos', nextState: 'bothProblem' },
        },
        invalidOption: ' Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'internetProblem': {
        question: 'Em qual tipo de conexão você está enfrentando problemas atualmente ? 🌐',
        options: {
            '1': { answer: ' Cabo', nextState: 'otherEquipament' },
            '2': { answer: ' Wi-fi', nextState: 'otherEquipament' },
            '3': { answer: ' Ambas', nextState: 'otherEquipament' }
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'otherEquipament': {
        question: 'Você consegue acessar a internet de outro equipamento (Computador, celular, ...)?',
        options: {
            '1': { answer: ' Sim', nextState: 'modemIndicatorLights' },
            '2': { answer: ' Não', nextState: 'modemIndicatorLights' },
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'modemIndicatorLights': {
        question: 'O seu modem possui alguma luz indicadora de problema ? ',
        options: {
            '1': { answer: ' Sim', nextState: 'validateMedia' },
            '2': { answer: ' Não', nextState: 'validateMedia' },
        }
    },
    'validateMedia': {
        question: 'Envie uma foto do aparelho, por gentileza ? 📸',
        nextState: 'operator',
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'operator': {
        question: 'Qual a operadora esta a falha ? ',
        options: {
            '1': { answer: ' Embratel', nextState: 'analystRouting' },
            '2': { answer: ' Fibercom', nextState: 'analystRouting' },
            '3': { answer: ' Ligga', nextState: 'analystRouting' },
            '4': { answer: ' Oi', nextState: 'analystRouting' },
            '5': { answer: ' Sim Telecom', nextState: 'analystRouting' },
            '6': { answer: ' Vivo', nextState: 'analystRouting' },
            '7': { answer: ' Não sei informar', nextState: 'analystRouting' },
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'analystRouting': {
        question: ' Obrigado pelas respostas! Estou encaminhando seu atendimento para um analista. Por favor, aguarde um pouco. ⏳',
        nextState: 'pauseChat',
    },
    'telephoneProblem': {
        question: 'Por favor, selecione o problema que você está enfrentando atualmente com as ligações ? 🤔',
        options: {
            '1': { answer: ' Realizar', nextState: 'telephoneProblem2' },
            '2': { answer: ' Receber', nextState: 'telephoneProblem2' },
            '3': { answer: ' Ambas', nextState: 'telephoneProblem2' }
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'telephoneProblem2': {
        question: 'Essa dificuldade ocorre com ligaçoes ? 📞',
        options: {
            '1': { answer: ' Internas', nextState: 'modemIndicatorLights' },
            '2': { answer: ' Externas', nextState: 'modemIndicatorLights' },
            '3': { answer: ' Ambas', nextState: 'modemIndicatorLights' }
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'bothProblem': {
        question: 'Por favor, selecione o problema que você está enfrentando atualmente com as ligações ? 🤔',
        options: {
            '1': { answer: ' Realizar', nextState: 'bothProblem2' },
            '2': { answer: ' Receber', nextState: 'bothProblem2' },
            '3': { answer: ' Ambas', nextState: 'bothProblem2' }
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'bothProblem2': {
        question: 'Essa dificuldade ocorre com Ligações ? 🤔',
        options: {
            '1': { answer: ' Internas', nextState: 'bothProblem3' },
            '2': { answer: ' Externas', nextState: 'bothProblem3' },
            '3': { answer: ' Ambas', nextState: 'bothProblem3' }
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
    'bothProblem3': {
        question: 'Em relação a internet, qual tipo de conexão você está enfrentando problemas atualmente ? 🤔',
        options: {
            '1': { answer: ' Cabo', nextState: 'otherEquipament' },
            '2': { answer: ' Wi-fi', nextState: 'otherEquipament' },
            '3': { answer: ' Ambas', nextState: 'otherEquipament' }
        },
        invalidOption: 'Opção não reconhecida. Por favor, escolha uma opção válida.',
    },
};

const initializeClient = () => {
    client.on('message', handleMessage);
    client.initialize();
};

const handleMessage = async msg => {
    const userKey = msg.from;

    if (allowNumber.includes(userKey) && msg.body !== null) {
        if (!conversationStates[userKey]) {
            conversationStates[userKey] = "start";
            userResponses[userKey] = [];
            const message = await createMessage(questions['start']);
            await sendMsgWithDelay(userKey, message);
        } else {
            await processMessage(userKey, msg);
            restartTimeout(userKey);
        }
    }
};

async function processMessage(userKey, msg) {
    const currentState = conversationStates[userKey];
    const currentQuestion = questions[currentState];
    // const msgBody = msg.body;
    // const msg = msg;

    // Verifica se o estado atual é 'pauseChat'
    if (currentState !== 'pauseChat') {
        const newNextState = await checkOption(userKey, msg, currentState);
        // Atualiza o estado atual para o novo estado retornado
        conversationStates[userKey] = newNextState;
    } else {
        processPauseChat(userKey, msg);
    }

    // Verifica novamente se o estado atual é 'pauseChat' antes de criar a mensagem
    if (conversationStates[userKey] !== 'pauseChat') {

        const nextQuestion = questions[conversationStates[userKey]];
        const nextMessage = await createMessage(nextQuestion);
        await sendMsgWithDelay(userKey, nextMessage);
    }
}

async function checkOption(userKey, msg, currentState) {
    const currentQuestion = questions[currentState];
    const msgBody = msg.body;

    // Verifica se a pergunta atual tem opções
    if (currentQuestion.options) {
        const keysAndAnswers = Object.entries(currentQuestion.options).map(([key, value]) => ({
            key: normalizeString(key),
            answer: normalizeString(value.answer),
            nextState: value.nextState
        }));
        const normalizedMsgBody = normalizeString(msgBody);
        const match = keysAndAnswers.find(item =>
            item.key === normalizedMsgBody || item.answer === normalizedMsgBody
        );

        if (match && match.nextState) {
            // Correspondência encontrada: atualiza o estado e retorna o próximo estado
            console.log(`Correspondência encontrada: ${match.key} - ${match.answer}`);
            console.log(`Novo estado: ${match.nextState}`);
            return match.nextState;
        } else {
            // Nenhuma correspondência encontrada ou não há próximo estado
            const errorMessage = currentQuestion.invalidOption;
            console.log('Nenhuma correspondência encontrada ou não há próximo estado.');
            console.log(errorMessage);
            await replyWithDelay(msg, errorMessage);
            return currentState;
        }
    } else {
        // Se não houver opções, apenas imprime a pergunta e muda para o próximo estado
        console.log('Pergunta:', currentQuestion.question);
        const next = currentQuestion.nextState;
        console.log('Novo estado:', next);

        if (currentState === 'validateMedia') {
            if (msg.hasMedia) {
                console.log('Mídia recebida. Prosseguindo para o próximo estado.');
                return next;
            } else {
                // Se não tiver mídia, emite uma mensagem de erro
                console.log('Nenhuma mídia recebida. Emitindo mensagem de erro.');
                const errorMessage = 'Envie uma mídia para prosseguir.';
                await replyWithDelay(msg, errorMessage);
                return currentState;
            }
        } else {
            return next;
        }
    }
}

async function createMessage(question) {
    const options = question.options || {};
    const message = Object.entries(options).reduce((msg, [key, option]) => {
        return `${msg}${key}. ${option.answer}\n`;
    }, question.question + '\n\n');
    return message.trim();
}

function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s\-]/g, "");
}

async function processPauseChat(userKey, msg) {
    const notes = ['0', '1', '2', '3', '4', '5'];
    if (notes.includes(msg.body)) {
        await sendMsgWithDelay(msg.from, '🌟 Obrigado pela nota! Estamos aqui para ajudar no que for necessário. Não hesite em entrar em contato se precisar de mais assistência. 🤝');
        conversationStates[userKey] = '';
    }
}

async function sendMsgWithDelay(to, message) {
    return new Promise(resolve => {
        setTimeout(() => {
            client.sendMessage(to, message);
            resolve();
        }, 1000);
    });
}

async function replyWithDelay(msg, text) {
    return new Promise((resolve) => {
        setTimeout(async () => {
            await msg.reply(text);
            resolve();
        }, 1000);
    });
}

async function restartTimeout(userKey) {
    clearTimeout(timeoutTimer);
    const timeoutDuration = conversationStates[userKey] === "pausarConversa" ? 30000 : 60000;
    timeoutTimer = setTimeout(() => {
        client.sendMessage(userKey, '⏰ Desculpe pelo inconveniente! Devido à inatividade, estamos encerrando o contato. 😔 Por favor, sinta-se à vontade para reiniciar a conversa se desejar continuar com o atendimento. Estamos aqui para ajudar! 🔄');
        conversationStates[userKey] = '';
    }, timeoutDuration); // 1 minuto em milissegundos
}

initializeClient();
