const fs = require('fs');
const path = require('path');
const { SEARCHABLE_EXTENSIONS } = require('../config/env');

function searchInProject(projectPath, query) {
    const searchTerm = query.toLowerCase();
    const matchingFiles = [];

    function searchDirectory(dirPath, relativePath = '') {
        let entries = [];
        try {
            entries = fs.readdirSync(dirPath);
        } catch (error) {
            return;
        }

        entries.forEach((entry) => {
            const fullPath = path.join(dirPath, entry);
            const relPath = relativePath ? `${relativePath}/${entry}` : entry;

            let stats;
            try {
                stats = fs.statSync(fullPath);
            } catch (error) {
                return;
            }

            if (stats.isDirectory()) {
                searchDirectory(fullPath, relPath);
                return;
            }

            if (!stats.isFile()) {
                return;
            }

            const ext = path.extname(entry).toLowerCase();
            if (!SEARCHABLE_EXTENSIONS.includes(ext)) {
                return;
            }

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.toLowerCase().includes(searchTerm)) {
                    matchingFiles.push(relPath);
                }
            } catch (error) {
                // Ignorar archivos ilegibles
            }
        });
    }

    searchDirectory(projectPath);

    return {
        searchTerm: query,
        matchingFiles,
        count: matchingFiles.length
    };
}

module.exports = {
    searchInProject
};
