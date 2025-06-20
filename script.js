document.addEventListener('DOMContentLoaded', function () {
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
    return fatores[(nivel || '').toLowerCase()] || 1.2;
  }

  function simularPerdaPeso(input) {
    let {
      pesoAtual, pesoDesejado, altura, idade, sexo,
      nivelAtividade, diasTreino
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
      const treinoKcal = diasTreino * 350 * (1 - (pesoInicial - pesoAtual) / pesoInicial);

      const dieta = get * 0.8;

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
    const resumoElem = document.getElementById('resumo');
    resumoElem.textContent = '';
    resumoElem.className = '';

    const input = {
      pesoAtual: parseFloat(document.getElementById('peso_atual').value),
      pesoDesejado: parseFloat(document.getElementById('peso_desejado').value),
      altura: parseFloat(document.getElementById('altura').value),
      idade: parseInt(document.getElementById('idade').value),
      sexo: document.getElementById('sexo').value,
      nivelAtividade: document.getElementById('nivel_atividade').value,
      diasTreino: parseInt(document.getElementById('dias_treino').value)
    };

    // Validação extra
    for (const key in input) {
      if ((key !== 'sexo' && key !== 'nivelAtividade') && (isNaN(input[key]) || input[key] === null)) {
        resumoElem.textContent = `Campo inválido: ${key}`;
        resumoElem.className = '';
        return;
      }
    }

    const dados = simularPerdaPeso(input);

    if (!dados || dados.length === 0) {
      resumoElem.textContent = 'Não foi possível simular. Verifique os dados.';
      resumoElem.className = '';
      return;
    }

    const fim = dados[dados.length - 1];
    resumoElem.textContent =
      `Você atingirá o peso desejado em aproximadamente ${dados.length} semanas, até ${fim.data.toLocaleDateString()}.`;
    resumoElem.className = 'resumo-destaque';

    // Limpar gráficos antigos
    document.getElementById('grafico_peso').innerHTML = '';
    document.getElementById('grafico_dieta').innerHTML = '';

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
      showlegend: false
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
      showlegend: false
    });
  });
});
