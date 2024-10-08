 document.getElementById("upload").addEventListener("change", handleFile, false);

      function handleFile(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (event) {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processData(jsonData);
        };

        reader.readAsArrayBuffer(file);
      }

      function processData(data) {
        data.sort((a, b) => b.shared_freqn - a.shared_freqn);

        const kinCategories = [...new Set(data.map((item) => item.kin))];
        const siteCategories = [...new Set(data.map((item) => item.site_id))];

        let heatmapData = [];
        let customData = [];

        kinCategories.forEach((kin) => {
          let row = [];
          let customRow = [];
          siteCategories.forEach((site) => {
            const item = data.find((d) => d.kin === kin && d.site_id === site);
            row.push(item ? item.shared_freqn : 0);
            customRow.push(
              item
                ? [item.shared_freqn, item.kin, item.site_id, item.pmid]
                : ["-", "-", "-", "-"]
            );
          });
          heatmapData.push(row);
          customData.push(customRow);
        });

        const colorscale = [
          [0, "rgb(255, 245, 240)"],
          [0.5, "rgb(252, 146, 114)"],
          [1, "rgb(145, 0, 4)"],
        ];

        const trace = {
          z: heatmapData,
          x: siteCategories,
          y: kinCategories,
          type: "heatmap",
          colorscale: colorscale,
          customdata: customData,
          hovertemplate:
            "<b>Shared Frequency</b>: %{customdata[0]}<br>" +
            "<b>Site1</b>: %{customdata[1]}<br>" +
            "<b>Site2</b>: %{customdata[2]}<br>" +
            "<b>PubMed</b>: %{customdata[3]}<br>" +
            "<extra></extra>",
          showscale: true,
        };

        const layout = {
          width: 800,
          height: 1000,
          xaxis: {
            title: "CSK",
            tickvals: siteCategories,
            showgrid: false,
          },
          yaxis: {
            title: "PAK1",
            tickvals: kinCategories,
            showgrid: false,
          },
        };

        Plotly.newPlot("heatmap", [trace], layout);

        const phosphositePlusURL = "https://www.phosphosite.org/proteinAction.action?id=630&showAllSites=true";
        const phosphositePlusURLx = "https://www.phosphosite.org/proteinAction.action?id=1240&showAllSites=true";     

        Plotly.relayout("heatmap", {
          "yaxis.ticktext": kinCategories.map(
            (label) => `<a href="${phosphositePlusURL}">${label}</a>`
          ),
          "yaxis.tickvals": kinCategories,
          "xaxis.ticktext": siteCategories.map(
            (label) => `<a href="${phosphositePlusURLx}">${label}</a>`
          ),
          "xaxis.tickvals": siteCategories,
        });

        document.getElementById("heatmap").on("plotly_click", function (event) {
          const pmidData = event.points[0].customdata[3];
          if (pmidData) {
            const pmids = pmidData.split(";").join("%3B");
            const searchURL = `https://pubmed.ncbi.nlm.nih.gov/?term=${pmids}&sort=date`;
            window.open(searchURL, "_blank");
          }
        });
      }
