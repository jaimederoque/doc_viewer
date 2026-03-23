const express = require('express');
const cors = require('cors');
const path = require('path');
const projectsRouter = require('./routes/projectsRouter');
const { ROOT_DIR, DATA_PATH } = require('./config/env');
const { initializeStore, getAllProjects } = require('./store/projectStore');

function createApp() {
    initializeStore();

    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(ROOT_DIR, 'public')));

    app.use('/api/projects', projectsRouter);

    app.get('/', (req, res) => {
        res.sendFile(path.join(ROOT_DIR, 'public', 'index.html'));
    });

    app.use((err, req, res, next) => {
        if (err.statusCode) {
            res.status(err.statusCode).json({ error: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor' });
    });

    return app;
}

function logStartup(port) {
    const projects = getAllProjects();
    console.log(`\n🚀 Servidor de documentación iniciado en http://localhost:${port}`);
    console.log(`📁 Datos persistentes en: ${DATA_PATH}`);
    console.log(`\n📂 Proyectos registrados: ${projects.length}`);
    projects.forEach((project) => console.log(`   - ${project.name}: ${project.path}`));
    console.log('\n');
}

module.exports = { createApp, logStartup };
