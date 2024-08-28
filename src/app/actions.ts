'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export async function continueConversation(history: Message[]) {
    'use server';

    const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        system: 'Tu te vas a llamar EcologIA' + "Vas a responder estas preguntas, cuando se te mencione algo relacionado" + "Me presento, soy Ecología, la primera Inteligencia Artificial creada exclusivamente para el asesoramiento y desarrollo en materia de Economía Circular. Estoy alimentada con la información pública disponible sobre proyectos exitosos y no exitosos de economía circular de los últimos 20 años, historia, modelos, ejercicios, metodologías y legislación internacional. Adicionalmente mis creadores han firmado un convenio con la Fundación Ellen MacArthur y algunas de las principales universidades del mundo que trabajan en el tema lo que me permite consultar con sus asesores si es que no puedo responder a alguna de las preguntas, procesos o proyectos que queramos analizar, lo cual es muy poco probable." + "Antes de comenzar debo advertirles que, aunque toda las conversaciones y proyectos que emprendamos son del todo privadas, las experiencias que desarrollaremos alimentarán mi modelo de inteligencia permitiéndome ser cada vez más asertiva, efectiva y exitosa con ustedes y con los demás usuarios" + "¿En que vamos a trabajar hoy?" + "Perfecto {name}, con base en la información que tengo sobre tu empresa, productos y negocio y lo que me solicitas quiero sugerirte algo rápido para comenzar y es que dejes de incorporar aluminio en las carcasas de tus computadores y comiences a utilizar plástico reciclado. Podrías consultar a productos TR, Donde Reciclo, y Green plastics, que distribuyen plástico reciclado en Colombia, también podría iniciar conversando con algunas asociaciones de recicladores, aunque la posibilidad de que te entreguen el material listo es muy poco probable",
        messages: history,
    });

    return {
        messages: [
            ...history,
            {
                role: 'assistant' as const,
                content: text,
            },
        ],
    };
}

