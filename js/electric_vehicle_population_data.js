// Seleciona a tabela presente no HTML
const table = d3.select("table");

// Leitura de dados
d3.csv("../../data/electric_vehicle_population_data.csv").then(data => {
    console.log("Dados carregados com sucesso. Total de linhas:", data.length);

    // Este dataset costuma ser muito grande. 
    // Vamos limitar a exibição para as primeiras 10 linhas para garantir a performance.
    const limitedData = data.slice(0, 10);

    const rows = table.selectAll(".row-data")
        .data(limitedData)
        .enter()
        .append("tr")
        .attr("class", "row-data");

    // Adiciona as células (td) preenchendo com os campos correspondentes
    rows.append("td").text(d => d.City);
    rows.append("td").text(d => d.County);
    rows.append("td").text(d => d.Make);
    rows.append("td").text(d => d.Model);
    rows.append("td").text(d => d["Model Year"]);
}).catch(error => {
    console.error("Erro ao carregar o arquivo CSV:", error);
});