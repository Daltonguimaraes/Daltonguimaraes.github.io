// Dados de exemplo
const dados = [
    { nome: "João", valor: 35 },
    { nome: "Maria", valor: 50 },
    { nome: "Pedro", valor: 25 },
    { nome: "Ana", valor: 40 },
    { nome: "Carlos", valor: 60 }
  ];
  
  // Dimensões do SVG
  const largura = 600;
  const altura = 400;
  const margem = { top: 20, right: 30, bottom: 40, left: 50 };
  
  // Seleciona o SVG
  const svg = d3.select("svg");
  
  // Escalas
  const x = d3.scaleBand()
    .domain(dados.map(d => d.nome))
    .range([margem.left, largura - margem.right])
    .padding(0.1);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.valor)])
    .nice()
    .range([altura - margem.bottom, margem.top]);
  
  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${altura - margem.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("class", "axis-label");
  
  svg.append("g")
    .attr("transform", `translate(${margem.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll("text")
    .attr("class", "axis-label");
  
  // Barras
  svg.selectAll(".bar")
    .data(dados)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.nome))
    .attr("y", d => y(d.valor))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.valor));
  