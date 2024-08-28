'use client';

import { useState, useEffect } from 'react';
import { Message, continueConversation } from './actions';
import { FaMicrophone, FaMicrophoneAltSlash } from "react-icons/fa";
import Image from "next/image";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}
interface SpeechRecognitionErrorEvent extends Error {
  error: string;
}

export default function Home() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognition | null>(null);

  // Cargar voces y seleccionar una voz femenina
  useEffect(() => {
    const loadVoices = () => {
      const synthVoices = window.speechSynthesis.getVoices();
      setVoices(synthVoices);
      const selectedVoice = synthVoices.find(voice => voice.name.includes('Female'));
      setFemaleVoice(selectedVoice || synthVoices[0]); // Si no encuentra una voz femenina, usa la primera disponible
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  // Función para leer en voz alta y detener TTS si es necesario
  const speakMessage = (text: string) => {
    if (femaleVoice) {
      // Cancelar cualquier reproducción TTS activa antes de empezar
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = femaleVoice;
      utterance.pitch = 1;  // Ajusta el tono de voz
      utterance.rate = 1;   // Ajusta la velocidad
      utterance.volume = 1; // Ajusta el volumen
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('No se ha encontrado una voz femenina.');
    }
  };

  // Función de reconocimiento de voz (Speech-to-Text) continua
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; // Ajusta el idioma
      recognition.continuous = true; // Permite escucha continua
      recognition.interimResults = false; // Desactiva los resultados interinos (solo los finales)

      recognition.onstart = () => {
        setIsListening(true);
        console.log("Escuchando de forma continua...");
      };

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          setInput(transcript); // Asigna el texto reconocido al input

          // Detener cualquier voz activa y luego enviar el mensaje
          window.speechSynthesis.cancel();

          // Envía el mensaje cuando se completa una frase
          const { messages } = await continueConversation([
            ...conversation,
            { role: 'user', content: transcript },
          ]);

          setConversation(messages);
          setInput(''); // Limpiar el input después de enviar
        }
      };

      recognition.onerror = (event: Error) => {
        console.error('Speech recognition error:', event.message);
        setIsListening(false);
      };
      recognition.onend = () => {
        if (isListening) {
          recognition.start(); // Reanudar la escucha si no se ha detenido
        }
      };

      recognition.start();
      setRecognitionInstance(recognition); // Guardar la instancia del reconocimiento
    } else {
      console.warn('Speech Recognition API no es compatible con este navegador.');
    }
  };

  // Función para detener Speech-to-Text y Text-to-Speech
  const stopSpeech = () => {
    // Detener el reconocimiento de voz
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
    }

    // Detener cualquier voz activa de Text-to-Speech
    window.speechSynthesis.cancel();
  };

  // Efecto para leer el último mensaje generado
  useEffect(() => {
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.role !== 'user') { // Evitar que lea los mensajes del usuario
        speakMessage(lastMessage.content);
      }
    }
  }, [conversation, femaleVoice]);

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-4">
      <div className="backdrop-blur bg-black/20 p-6 rounded-lg shadow-lg w-full max-w-2xl h-[600px]">
        <h1 className="text-2xl font-bold text-center mb-4 text-white">EcoIA</h1>
        <div className="space-y-4 overflow-y-auto rounded-lg p-4 bg-white-50/30 mb-4 h-[460px]">
          {conversation.length === 0 && (
            <div className='text-center'>
              <Image alt="EcoIA" src="/ecologIAnoBg.webp" width={300} height={300} className="mx-auto rounded">

              </Image>
              <div className="text-center text-white font-extrabold text-5xl mb-4 leading-tight">
                <span className="block animate-pulse">Comienza a hablar con</span>
                <span className="text-green-400 text-6xl">EcoIA</span>
              </div>


            </div>
          )}

          {conversation.map((message, index) => (
            <div key={index} className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}>
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  <img
                    alt="Chat Avatar"
                    src={message.role === 'user' ? 'https://img.icons8.com/fluency/96/user-male-circle--v1.png' : '/ecologIAnoBg.webp'}
                  />
                </div>
              </div>
              <div className="chat-header text-white">
                {message.role === 'user' ? 'Tú' : 'EcoIA'}
              </div>
              <div className={`chat-bubble backdrop-blur ${message.role === 'user' ? 'bg-green-950/50 text-white' : 'bg-green-500/50 text-white'}`}>
                {message.content}
              </div>
            </div>
          ))}

        </div>

        <input
          type="text"
          value={input}
          onChange={event => setInput(event.target.value)}
          className="w-full p-2 border rounded-lg mb-4 hidden"
          placeholder="Escribe un mensaje..."
        />

        <div className="flex space-x-4 items-center justify-center">
          {/* Botón de iniciar o detener el reconocimiento de voz */}
          {!isListening ? (
            <button
              onClick={startListening}
              className="relative px-6 py-6 rounded-full text-white bg-green-500 hover:bg-green-600 focus:outline-none shadow-lg transition-transform transform hover:scale-105 active:scale-95"
            >
              <FaMicrophone className="w-8 h-8" />
            </button>

          ) : (
            <button
              onClick={stopSpeech}
              className="relative px-6 py-6 rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none shadow-lg transition-transform transform hover:scale-105 active:scale-95"
            >
              <FaMicrophoneAltSlash className="w-8 h-8" />
            </button>

          )}
        </div>

      </div>
    </div >
  );
}
