<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Simulador de Perda de Peso</title>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: auto; padding: 20px; }
    label { display: block; margin-top: 10px; }
    input, select { width: 100%; padding: 5px; margin-top: 4px; }
    #grafico_peso, #grafico_dieta { margin-top: 30px; }
  </style>
</head>
<body>

<h2>Simulador de Perda de Peso</h2>
<form id="formulario">
  <label>Peso atual (kg): <input id="peso_atual" type="number" step="0.1" required></label>
  <label>Peso desejado (kg): <input id="peso_desejado" type="number" step="0.1" required></label>
  <label>Altura (cm): <input id="altura" type="number" required></label>
  <label>Idade: <input id="idade" type="number" required></label>
  <label>Sexo:
    <select id="sexo">
      <option value="masculino">Masculino</option>
      <option value="feminino">Feminino</option>
    </select>
  </label>
  <label>Nível de atividade:
    <select id="nivel_atividade">
      <option value="sedentario">Sedentário</option>
      <option value="levemente ativo">Levemente ativo</option>
      <option value="moderadamente ativo">Moderadamente ativo</option>
      <option value="muito ativo">Muito ativo</option>
      <option value="extremamente ativo">Extremamente ativo</option>
    </select>
  </label>
  <label>Dias de treino por semana: <input id="dias_treino" type="number" required></label>
  <label>Gasto calórico por treino (kcal): <input id="gasto_por_treino" type="number" required></label>
  <button type="submit">Simular</button>
</form>

<p id="resumo"></p>
<div id="grafico_peso"></div>
<div id="grafico_dieta"></div>

<script>
function calcularTMB(peso, altura, idade, sexo) {
  return sexo === 'masculino'
    ? 10 * peso + 6.25 * altura - 5 * idade + 5
    : 10 * peso + 6.25 * altura - 5 * idade - 161;
}

function fatorAtividade(nivel) {
  const fatores = {
    'sedentario': 1.2,
    'levemente ativo': 1.375,
    'moderadamente ativo': 1.55,
    'muito ativo': 1.725,
    'extremamente ativo': 1.9
  };
  return fatores[nivel.toLowerCase()] || 1.2;
}

function simularPerdaPeso(input) {
  let {
    pesoAtual, pesoDesejado, altura, idade, sexo,
    nivelAtividade, diasTreino, gastoTreino
  } = input;

  const dados = [];
  const pesoInicial = pesoAtual;
  let semanas = 0;
  const hoje = new Date();

  while (pesoAtual > pesoDesejado && semanas < 52) {
    semanas++;
    const tmb = calcularTMB(pesoAtual, altura, idade, sexo);
    const get = tmb * fatorAtividade(nivelAtividade);

    // Reduz o impacto do treino com a perda de peso
    const treinoKcal = diasTreino * gastoTreino * (1 - (pesoInicial - pesoAtual) / pesoInicial);

    const dieta = get * 0.8;
    const deficit = (get - dieta) + treinoKcal;

    let perdaKg = 2 * Math.exp(-0.1 * semanas);  // perda decrescente
    perdaKg *= (1 + Math.random() * 0.1 - 0.05); // flutuação ±5%
    perdaKg = Math.min(perdaKg, pesoAtual - pesoDesejado);
    pesoAtual -= perdaKg;

    dados.push({
      semana: semanas,
      data: new Date(hoje.getTime() + semanas * 7 * 86400000),
      peso: parseFloat(pesoAtual.toFixed(1)),
      get: Math.round(get),
      dieta: Math.round(dieta)
    });
  }

  return dados;
}

document.getElementById('formulario').addEventListener('submit', function (e) {
  e.preventDefault();

  const input = {
    pesoAtual: parseFloat(document.getElementById('peso_atual').value),
    pesoDesejado: parseFloat(document.getElementById('peso_desejado').value),
    altura: parseFloat(document.getElementById('altura').value),
    idade: parseInt(document.getElementById('idade').value),
    sexo: document.getElementById('sexo').value,
    nivelAtividade: document.getElementById('nivel_atividade').value,
    diasTreino: parseInt(document.getElementById('dias_treino').value),
    gastoTreino: parseInt(document.getElementById('gasto_por_treino').value)
  };

  // Validação extra
  for (const key in input) {
    if (isNaN(input[key]) && key !== 'sexo' && key !== 'nivelAtividade') {
      document.getElementById('resumo').textContent = `Campo inválido: ${key}`;
      return;
    }
  }

  const dados = simularPerdaPeso(input);

  if (dados.length === 0) {
    document.getElementById('resumo').textContent = 'Não foi possível simular. Verifique os dados.';
    return;
  }

  const fim = dados[dados.length - 1];
  document.getElementById('resumo').textContent =
    `Você atingirá o peso desejado em aproximadamente ${dados.length} semanas, até ${fim.data.toLocaleDateString()}.`;

  Plotly.newPlot('grafico_peso', [{
    x: dados.map(d => d.data),
    y: dados.map(d => d.peso),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Peso (kg)'
  }], {
    title: 'Evolução do Peso',
    xaxis: { title: 'Data' },
    yaxis: { title: 'Peso (kg)' },
    showlegend: true
  });

  Plotly.newPlot('grafico_dieta', [
    {
      x: dados.map(d => d.data),
      y: dados.map(d => d.dieta),
      name: 'Dieta (kcal)',
      type: 'scatter',
      mode: 'lines+markers'
    },
    {
      x: dados.map(d => d.data),
      y: dados.map(d => d.get),
      name: 'GET (kcal)',
      type: 'scatter',
      mode: 'lines+markers'
    }
  ], {
    title: 'Dieta x GET',
    xaxis: { title: 'Data' },
    yaxis: { title: 'kcal' },
    showlegend: true
  });
});
</script>

</body>
</html>

