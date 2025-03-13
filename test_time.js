import fetch from 'node-fetch';

fetch("https://worldtimeapi.org/api/timezone/America/Sao_Paulo")
  .then(response => response.json())
  .then(data => {
    console.log('Data completa:', data);
    console.log('Apenas datetime:', data.datetime);
  })
  .catch(error => console.error("Erro ao buscar a data:", error)); 