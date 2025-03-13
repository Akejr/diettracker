import { useState, useEffect } from "react";

const fetchTime = async () => {
  try {
    const response = await fetch("https://worldtimeapi.org/api/timezone/America/Sao_Paulo");
    const data = await response.json();
    console.log("Dados completos da API:", data); // Log para debug
    console.log("Data e hora retornada:", data.datetime); // Log específico do datetime
    return new Date(data.datetime); // Converte para objeto Date
  } catch (error) {
    console.error("Erro ao buscar a data:", error);
    return new Date(); // Usa o relógio local caso a API falhe
  }
};

const TestTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Buscar a hora certa da API ao carregar
    fetchTime().then(setCurrentTime);

    // Atualizar o relógio local a cada segundo
    const interval = setInterval(() => {
      setCurrentTime((prevTime) => new Date(prevTime.getTime() + 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Data e Hora em São Paulo</h1>
      <p>{currentTime.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
    </div>
  );
};

export default TestTime; 