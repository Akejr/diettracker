import fetch from 'node-fetch';

const fetchTime = async () => {
  try {
    const response = await fetch("https://worldtimeapi.org/api/timezone/America/Sao_Paulo");
    const data = await response.json();
    const date = new Date(data.datetime);
    
    // Diferentes formas de obter apenas o dia
    const diaMetodo1 = date.getDate(); // Retorna apenas o dia (1-31)
    const diaMetodo2 = date.toLocaleString("pt-BR", { 
      timeZone: "America/Sao_Paulo",
      day: "numeric"
    }); // Retorna o dia formatado
    const diaMetodo3 = date.toLocaleDateString("pt-BR", { 
      timeZone: "America/Sao_Paulo"
    }).split('/')[0]; // Retorna o dia da data completa formatada
    
    // Formato ISO (YYYY-MM-DD)
    const diaMetodo4 = date.toISOString().split('T')[0].split('-')[2];

    console.log("Dia (método 1 - getDate):", diaMetodo1);
    console.log("Dia (método 2 - toLocaleString):", diaMetodo2);
    console.log("Dia (método 3 - toLocaleDateString):", diaMetodo3);
    console.log("Dia (método 4 - ISO):", diaMetodo4);

    return date;
  } catch (error) {
    console.error("Erro ao buscar a data:", error);
    return new Date();
  }
};

// Executar o teste
fetchTime()
  .then(date => {
    // Exemplo de uso prático - apenas o dia
    const dia = date.getDate();
    console.log("\nExemplo prático - Dia atual:", dia);
  }); 