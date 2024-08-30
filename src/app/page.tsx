'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, continueConversation } from './actions';
import { FaMicrophone, FaMicrophoneAltSlash } from "react-icons/fa";
import Image from "next/image";
import Speech from 'react-text-to-speech';

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognition | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null); // Ref para el botón de reproducción

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

          // Envía el mensaje cuando se completa una frase
          const { messages } = await continueConversation([
            ...conversation,
            { role: 'user', content: transcript },
          ]);

          setConversation(messages);
          setInput(''); // Limpiar el input después de enviar
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
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

  // Función para detener Speech-to-Text
  const stopSpeech = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
    }
  };

  // Efecto para manejar la lectura del último mensaje generado
  useEffect(() => {
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.role !== 'user') {
        setIsSpeaking(true);
        // Hacer clic en el botón de reproducción automáticamente
        setTimeout(() => {
          playButtonRef.current?.click();
        }, 2000);
      }
    }
  }, [conversation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="backdrop-blur bg-black/20 p-6 rounded-lg shadow-lg w-full max-w-2xl h-[600px]">
        <h1 className="text-2xl font-bold text-center mb-4 text-white">EcoIA</h1>
        <div className="image-container relative flex justify-center items-center w-52 h-52 mx-auto">
          {/* Mostrar la imagen solo cuando no esté hablando */}
          <Image
            alt="EcoIA"
            src="/ecologIAnoBg.webp"
            width={200}
            height={200}
            className={`absolute transition-opacity duration-500 ease-in-out ${isSpeaking ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Mostrar la animación solo cuando esté hablando */}
          <div
            className={`wave-animation absolute transition-opacity duration-500 ease-in-out flex justify-center items-center ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto rounded-lg p-4 bg-white-50/30 mb-4 h-[260px]">
          {conversation.length === 0 && (
            <div className='text-center'>
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

              {/* TTS para el mensaje del bot */}
              {message.role !== 'user' && (
                <Speech
                  text={message.content.replace(/\*/g, '')}  // Eliminar los asteriscos del texto
                  lang="es-ES"
                  onStart={() => setIsSpeaking(true)}
                  onStop={() => setIsSpeaking(false)}
                  startBtn={
                    <button
                      ref={playButtonRef} // Ref al botón para hacer clic automáticamente
                      className="absolute top-0 right-0 p-2 text-white bg-green-500 hover:bg-green-600 focus:outline-none shadow-lg transition-transform transform hover:scale-105 active:scale-95"
                    >
                      Reproducir
                    </button>
                  }
                />
              )}
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
    </div>
  );
}
