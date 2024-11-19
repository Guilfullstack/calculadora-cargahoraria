function processFiles() {
    const input = document.getElementById('csvFiles');
    const files = input.files;
    const progressBar = document.getElementById('progressBar');
    const membersMap = new Map();
    let totalHoursAllFiles = 0;

    progressBar.value = 0; // Reseta a barra de progresso
    progressBar.max = files.length; // Define o máximo como o número de arquivos

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function (event) {
            const lines = event.target.result.split('\n');
            const header = csvSplit(lines[0] || '');
            const memberIndex = header.findIndex(col => col.trim() === "Membros");
            const hoursIndex = header.findIndex(col => col.trim() === "Carga horaria");

            if (memberIndex === -1 || hoursIndex === -1) {
                console.error("Colunas 'Membros' ou 'Carga horaria' não encontradas.");
                return;
            }

            for (const line of lines.slice(1)) {
                if (!line.trim()) continue; // Ignora linhas vazias
                const columns = csvSplit(line);

                if (columns.length <= Math.max(memberIndex, hoursIndex)) continue;

                const memberColumn = columns[memberIndex]?.trim();
                const hourValue = parseFloat(columns[hoursIndex]) || 0;

                if (!memberColumn) continue;

                totalHoursAllFiles += hourValue;

                const members = processMultipleMembers(memberColumn);
                members.forEach(member => {
                    const currentHours = membersMap.get(member) || 0;
                    membersMap.set(member, currentHours + hourValue);
                });
            }

            displayResults(Array.from(membersMap), totalHoursAllFiles);

            // Incrementa a barra de progresso a cada arquivo processado
            progressBar.value = i + 1;
        };
        reader.readAsText(file);
    }
}

function displayResults(membersArray, totalHours) {
    membersArray.sort(([a], [b]) => a.localeCompare(b));

    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';

    membersArray.forEach(([member, totalHours]) => {
        const row = document.createElement('tr');
        const memberCell = document.createElement('td');
        const hoursCell = document.createElement('td');

        memberCell.textContent = member;
        hoursCell.textContent = totalHours;

        row.appendChild(memberCell);
        row.appendChild(hoursCell);
        tbody.appendChild(row);
    });

    document.getElementById('totalHours').textContent = `Carga Horária Total de Todos os Arquivos: ${totalHours}`;
}

// Função aprimorada para dividir a linha CSV, preservando vírgulas entre aspas
function csvSplit(line) {
    const regex = /(?:,|^)(?:"([^"]*)"|([^",]*))/g;
    const columns = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
        columns.push(match[1] ? match[1] : match[2] || '');
    }
    return columns;
}

// Função para processar múltiplos membros
function processMultipleMembers(memberColumn) {
    const cleanedColumn = memberColumn.replace(/"/g, '');
    const members = cleanedColumn.match(/([^,()]+(?:\s*\(.*?\))?)/g)
        .map(member => member.replace(/\s*\(.*?\)/g, '').trim())
        .filter(Boolean);
    return members;
}
