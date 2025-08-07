const largura = 800;
const altura = 400;
const margem = { top: 40, right: 150, bottom: 40, left: 60 };

const svg = d3.select("#grafico")
                .attr("width", largura)
                .attr("height", altura);

// Leitura do CSV
d3.csv("../../data/dados.csv").then(data => {
    // Conversão dos valores para numérico
    data.forEach(d => {
    d.inflacao = +d.inflacao;
    d.desemprego = +d.desemprego;
    d.ano = d3.timeParse("%Y")(d.ano); // converte string "2015" em Date
    });

    // Escalas
    const x = d3.scaleTime()
                .domain(d3.extent(data, d => d.ano))
                .range([margem.left, largura - margem.right]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.inflacao, d.desemprego))])
                .nice()
                .range([altura - margem.bottom, margem.top]);

    // Eixos
    svg.append("g")
    .attr("transform", `translate(0, ${altura - margem.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%Y")));

    svg.append("g")
    .attr("transform", `translate(${margem.left}, 0)`)
    .call(d3.axisLeft(y));

    // Linhas
    const linhaInflacao = d3.line()
    .x(d => x(d.ano))
    .y(d => y(d.inflacao))
    .curve(d3.curveMonotoneX);

    const linhaDesemprego = d3.line()
    .x(d => x(d.ano))
    .y(d => y(d.desemprego))
    .curve(d3.curveMonotoneX);

    // Linha inflação
    svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", linhaInflacao);

    // Linha desemprego
    svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "tomato")
    .attr("stroke-width", 2)
    .attr("d", linhaDesemprego);

    // Legenda
    svg.append("text")
    .attr("x", largura - margem.right + 10)
    .attr("y", y(data[data.length - 1].inflacao))
    .attr("fill", "steelblue")
    .text("Inflação (%)");

    svg.append("text")
    .attr("x", largura - margem.right + 10)
    .attr("y", y(data[data.length - 1].desemprego))
    .attr("fill", "tomato")
    .text("Desemprego (%)");
});