const largura = 800;
const altura = 400;
const margem = { top: 40, right: 150, bottom: 40, left: 60 };

const svg = d3.select("#grafico")
                .attr("width", largura)
                .attr("height", altura);

// Leitura do CSV
Promise.all([
    d3.csv("../../data/ipca.csv"),
    d3.csv("../../data/desemprego.csv")
]).then(files => {
    const [ipcaData, desempregoData] = files;

// Convert values to numeric and parse dates
ipcaData.forEach(d => {
    d.ipca = +d.ipca;
    d.ano = d3.timeParse("%Y")(d.ano);
    if (!d.ano) {
        console.log("Invalid year in ipcaData:", d);
    }
});

desempregoData.forEach(d => {
    d.desemprego = +d.desemprego;
    d.ano = d3.timeParse("%Y")(d.ano);
    if (!d.ano) {
        console.log("Invalid year in desempregoData:", d);
    }
});

// Merge data based on the year
const mergedData = ipcaData.map(ipcaItem => {
    const desempregoItem = desempregoData.find(desempregoItem => desempregoItem.ano.getFullYear() === ipcaItem.ano.getFullYear());
    return { 
        ano: ipcaItem.ano,
        ipca: ipcaItem.ipca,
        desemprego: desempregoItem ? desempregoItem.desemprego : null
    };
});

// Log merged data for debugging
console.log("Merged Data:", mergedData);

    // Escalas
    const x = d3.scaleTime()
                .domain(d3.extent(mergedData, d => d.ano))
                .range([margem.left, largura - margem.right]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(mergedData, d => Math.max(d.ipca, d.desemprego || 0))])
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
    const linhaIPCA = d3.line()
                      .x(d => x(d.ano))
                      .y(d => y(d.ipca))
                      .curve(d3.curveMonotoneX);

    const linhaDesemprego = d3.line()
                            .x(d => x(d.ano))
                            .y(d => y(d.desemprego || 0))
                            .curve(d3.curveMonotoneX);

    // Linha IPCA
    svg.append("path")
       .datum(mergedData)
       .attr("fill", "none")
       .attr("stroke", "steelblue")
       .attr("stroke-width", 2)
       .attr("d", linhaIPCA);

    // Linha desemprego
    svg.append("path")
       .datum(mergedData)
       .attr("fill", "none")
       .attr("stroke", "tomato")
       .attr("stroke-width", 2)
       .attr("d", linhaDesemprego);

    // Legenda
    svg.append("text")
       .attr("x", largura - margem.right + 10)
       .attr("y", y(mergedData[mergedData.length - 1].ipca))
       .attr("fill", "steelblue")
       .text("IPCA (%)");

    svg.append("text")
       .attr("x", largura - margem.right + 10)
       .attr("y", y(mergedData[mergedData.length - 1].desemprego || 0))
       .attr("fill", "tomato")
       .text("Desemprego (%)");
});