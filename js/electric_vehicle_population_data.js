// Seleciona a tabela presente no HTML
const table = d3.select("table");
const margin = { top: 20, right: 30, bottom: 100, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#grafico")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xAxisGroup = svg.append("g").attr("transform", `translate(0, ${height})`);
const yAxisGroup = svg.append("g");

// Inicialização do Mapa Leaflet
const map = L.map('mapa').setView([47.3, -120.5], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markerGroup = L.layerGroup().addTo(map);

console.log("Iniciando o carregamento dos arquivos...");

// Leitura de dados
d3.csv("../../data/electric_vehicle_population_data.csv").then(rawData => {
    if (!rawData) {
        console.error("Falha crítica: Dados do CSV não encontrados.");
        return;
    }
    console.log("CSV carregado. Total de linhas brutas:", rawData.length);

    // Limpeza de dados: remove espaços em branco extras que podem vir no CSV
    const data = rawData.map(d => {
        const cleaned = {};
        Object.keys(d).forEach(key => {
            cleaned[key.trim()] = d[key] ? d[key].trim() : "";
        });
        return cleaned;
    });

    if (data.length > 0) {
        console.log("Cabeçalhos limpos:", Object.keys(data[0]));
        console.log("Exemplo de dado processado:", data[0]);
    } else {
        console.error("O arquivo CSV foi lido, mas está vazio ou não pôde ser parseado.");
    }

    let filteredData = data;

    // Função auxiliar para preencher os filtros
    const populateFilter = (containerId, column, radioName) => {
        const uniqueValues = Array.from(new Set(data.map(d => d[column])))
            .filter(d => d) // Remove valores nulos ou vazios
            .sort(d3.ascending);

        const options = [{name: 'Todos', value: '', checked: true}, ...uniqueValues.map(v => ({name: v, value: v, checked: false}))];
        const container = d3.select(containerId);
        const current = container.select(".select-box__current");
        const list = container.select(".select-box__list");

        current.html(""); // Limpa o container antes de popular

        const values = current.selectAll(".select-box__value")
            .data(options)
            .enter()
            .append("div")
            .attr("class", "select-box__value");

        values.append("input")
            .attr("class", "select-box__input")
            .attr("type", "radio")
            .attr("id", (d, i) => `${radioName}-${i}`)
            .attr("value", d => d.value)
            .attr("name", radioName)
            .property("checked", d => d.checked)
            .on("change", updateVisualization);

        values.append("p")
            .attr("class", "select-box__input-text")
            .text(d => d.name);

        current.append("img")
            .attr("class", "select-box__icon")
            .attr("src", "https://cdn-icons-png.flaticon.com/512/271/271203.png") // Ícone de seta mais limpo
            .attr("alt", "Arrow Icon")
            .attr("aria-hidden", "true");

        list.selectAll("li")
            .data(options)
            .enter()
            .append("li")
            .append("label")
            .attr("class", "select-box__option")
            .attr("for", (d, i) => `${radioName}-${i}`)
            .attr("aria-hidden", "true")
            .text(d => d.name);
    };

    // Preenche cada um dos filtros
    populateFilter("#filter-year-box", "Model Year", "year");
    populateFilter("#filter-make-box", "Make", "make");
    populateFilter("#filter-model-box", "Model", "model");
    populateFilter("#filter-city-box", "City", "city");

    function updateVisualization() {
        const selectedYear = d3.select('input[name="year"]:checked').node()?.value || "";
        const selectedMake = d3.select('input[name="make"]:checked').node()?.value || "";
        const selectedModel = d3.select('input[name="model"]:checked').node()?.value || "";
        const selectedCity = d3.select('input[name="city"]:checked').node()?.value || "";

        filteredData = data.filter(d => {
            return (selectedYear === "" || d["Model Year"] === selectedYear) &&
                   (selectedMake === "" || d.Make === selectedMake) &&
                   (selectedModel === "" || d.Model === selectedModel) &&
                   (selectedCity === "" || d.City === selectedCity);
        });

        renderTable(filteredData.slice(0, 10));
        renderChart(filteredData);
        renderMap(filteredData);
        renderKPIs(filteredData);
        renderTops(filteredData);
    }

    function renderTable(limitedData) {
        table.selectAll(".row-data").remove();
        
        const rows = table.selectAll(".row-data")
            .data(limitedData)
            .enter()
            .append("tr")
            .attr("class", "row-data");

        rows.append("td").text(d => d.City);
        rows.append("td").text(d => d.County);
        rows.append("td").text(d => d.Make);
        rows.append("td").text(d => d.Model);
        rows.append("td").text(d => d["Model Year"]);
    }

    function renderChart(dataForChart) {
        // Agrupa por Marca e conta
        const counts = d3.rollup(dataForChart, v => v.length, d => d.Make);
        const chartData = Array.from(counts, ([key, value]) => ({ key, value }))
            .sort((a, b) => d3.descending(a.value, b.value))
            .slice(0, 10); // Top 10 marcas

        const x = d3.scaleBand()
            .domain(chartData.map(d => d.key))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.value) || 0])
            .range([height, 0]);

        xAxisGroup.transition().duration(500).call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        yAxisGroup.transition().duration(500).call(d3.axisLeft(y));

        const bars = svg.selectAll(".bar").data(chartData, d => d.key);

        bars.exit().remove();

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition().duration(500)
            .attr("x", d => x(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.value));
    }

    function renderKPIs(dataForKPIs) {
        if (dataForKPIs.length === 0) {
            d3.select("#kpi-total").text("-");
            d3.select("#kpi-city").text("-");
            d3.select("#kpi-model").text("-");
            d3.select("#kpi-range").text("-");
            d3.select("#kpi-year").text("-");
            d3.select("#kpi-makes").text("-");
            return;
        }

        const cityCounts = d3.rollup(dataForKPIs, v => v.length, d => d.City);
        const topCity = d3.greatest(cityCounts, d => d[1])?.[0] || "-";

        const modelCounts = d3.rollup(dataForKPIs, v => v.length, d => d.Model);
        const topModel = d3.greatest(modelCounts, d => d[1])?.[0] || "-";

        const maxRange = d3.max(dataForKPIs, d => +d["Electric Range"]) || 0;

        const yearCounts = d3.rollup(dataForKPIs, v => v.length, d => d["Model Year"]);
        const topYear = d3.greatest(yearCounts, d => d[1])?.[0] || "-";

        const totalMakes = new Set(dataForKPIs.map(d => d.Make)).size;

        d3.select("#kpi-total").text(dataForKPIs.length.toLocaleString('pt-BR'));
        d3.select("#kpi-city").text(topCity);
        d3.select("#kpi-model").text(topModel);
        d3.select("#kpi-range").text(maxRange + " mi");
        d3.select("#kpi-year").text(topYear);
        d3.select("#kpi-makes").text(totalMakes);
    }

    function renderTops(dataForTops) {
        const chartWidth = 450;
        const chartHeight = 220;

        // Função Helper para Barras Horizontais (Cidades e Range)
        const drawBarChart = (selector, dataMap, limit, color, isRange = false) => {
            const sorted = Array.from(dataMap, ([name, value]) => ({ name, value }))
                .sort((a, b) => d3.descending(a.value, b.value)).slice(0, limit);
            
            const container = d3.select(selector).html("");
            const svgTop = container.append("svg").attr("width", "100%").attr("height", chartHeight);
            const x = d3.scaleLinear().domain([0, d3.max(sorted, d => d.value)]).range([0, 300]);
            const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, chartHeight]).padding(0.3);

            const g = svgTop.append("g").attr("transform", "translate(70, 0)");
            
            g.selectAll("rect").data(sorted).enter().append("rect")
                .attr("y", d => y(d.name)).attr("width", d => x(d.value)).attr("height", y.bandwidth())
                .attr("fill", color).attr("rx", 4);

            g.selectAll(".label-name").data(sorted).enter().append("text")
                .attr("x", -5).attr("y", d => y(d.name) + y.bandwidth()/2).attr("text-anchor", "end")
                .attr("alignment-baseline", "middle").style("font-size", "10px").text(d => d.name.substring(0, 10));

            g.selectAll(".label-val").data(sorted).enter().append("text")
                .attr("x", d => x(d.value) + 5).attr("y", d => y(d.name) + y.bandwidth()/2)
                .attr("alignment-baseline", "middle").style("font-size", "10px").style("font-weight", "bold")
                .text(d => d.value + (isRange ? " mi" : ""));
        };

        // 1. Top 5 Cidades - Barras Horizontais
        const cityCounts = d3.rollup(dataForTops, v => v.length, d => d.City);
        drawBarChart("#chart-cities", cityCounts, 5, "#007bff");

        // 2. Top 3 Fabricantes - Donut Chart
        const makeCounts = d3.rollup(dataForTops, v => v.length, d => d.Make);
        const topMakes = Array.from(makeCounts, ([name, value]) => ({ name, value }))
            .sort((a, b) => d3.descending(a.value, b.value)).slice(0, 3);
        
        const donutContainer = d3.select("#chart-makes").html("");
        const radius = Math.min(chartWidth, chartHeight) / 2;
        const svgDonut = donutContainer.append("svg").attr("width", "100%").attr("height", chartHeight)
            .append("g").attr("transform", `translate(${chartWidth/2}, ${chartHeight/2})`);
        
        const color = d3.scaleOrdinal().range(["#007bff", "#66b0ff", "#b3d7ff"]);
        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 0.8);

        svgDonut.selectAll("path").data(pie(topMakes)).enter().append("path")
            .attr("d", arc).attr("fill", d => color(d.data.name));

        // Legendas do Donut
        const legend = donutContainer.append("div").style("font-size", "10px");
        topMakes.forEach(m => {
            legend.append("div").html(`<span style="color:${color(m.name)}">●</span> ${m.name}: <b>${m.value}</b>`);
        });

        // 3. Top 10 Modelos - Lollipop Chart
        const modelCounts = d3.rollup(dataForTops, v => v.length, d => d.Model);
        const topModels = Array.from(modelCounts, ([name, value]) => ({ name, value }))
            .sort((a, b) => d3.descending(a.value, b.value)).slice(0, 10);

        const lolliContainer = d3.select("#chart-models").html("");
        const svgLolli = lolliContainer.append("svg").attr("width", "100%").attr("height", chartHeight);
        const xLolli = d3.scaleLinear().domain([0, d3.max(topModels, d => d.value)]).range([0, 280]);
        const yLolli = d3.scaleBand().domain(topModels.map(d => d.name)).range([0, chartHeight]).padding(1);

        const gLolli = svgLolli.append("g").attr("transform", "translate(75, 5)");

        gLolli.selectAll("line").data(topModels).enter().append("line")
            .attr("x1", 0).attr("x2", d => xLolli(d.value))
            .attr("y1", d => yLolli(d.name)).attr("y2", d => yLolli(d.name))
            .attr("stroke", "#cbd5e0");

        gLolli.selectAll("circle").data(topModels).enter().append("circle")
            .attr("cx", d => xLolli(d.value)).attr("cy", d => yLolli(d.name)).attr("r", 4).attr("fill", "#007bff");
        
        gLolli.selectAll("text").data(topModels).enter().append("text")
            .attr("x", -5).attr("y", d => yLolli(d.name)).attr("text-anchor", "end")
            .attr("alignment-baseline", "middle").style("font-size", "9px").text(d => d.name.substring(0, 12));

        // 4. Top 7 Autonomia - Barras Horizontais (Verde para energia)
        const rangeByModel = d3.rollup(dataForTops, 
            v => d3.max(v, d => +d["Electric Range"]), 
            d => `${d.Model}`
        );
        drawBarChart("#chart-ranges", rangeByModel, 7, "#28a745", true);
    }

    function renderMap(dataForMap) {
        markerGroup.clearLayers();

        // Limitamos a 500 marcadores para manter a performance do navegador
        const displayLimit = 500;
        const limitedData = dataForMap.slice(0, displayLimit);

        limitedData.forEach(d => {
            const locationStr = d["Vehicle Location"];
            if (locationStr) {
                // Extrai coordenadas do formato POINT (-122.30 47.60)
                const match = locationStr.match(/POINT \((.+) (.+)\)/);
                if (match) {
                    const lng = +match[1];
                    const lat = +match[2];
                    
                    L.marker([lat, lng])
                        .bindPopup(`
                            <strong>${d.Make} ${d.Model}</strong><br>
                            Cidade: ${d.City}<br>
                            Ano: ${d["Model Year"]}
                        `)
                        .addTo(markerGroup);
                }
            }
        });

        if (dataForMap.length > displayLimit) {
            console.warn(`Exibindo apenas ${displayLimit} de ${dataForMap.length} marcadores para performance.`);
        }
    }

    // Listeners e Render inicial
    updateVisualization();

}).catch(error => {
    console.error("Erro durante a execução do script:", error);
});