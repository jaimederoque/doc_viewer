const fs = require('fs');
const path = require('path');
const { buildFileTree } = require('./fileTreeService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/httpErrors');

const MIME_TYPES = {
    '.drawio': 'application/xml',
    '.xml': 'application/xml',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
};

function resolveProjectPath(projectPath, relativePath) {
    if (!relativePath) {
        throw new BadRequestError('Ruta requerida');
    }
    const normalizedProjectPath = path.normalize(projectPath);
    const targetPath = path.join(normalizedProjectPath, relativePath);
    if (!targetPath.startsWith(normalizedProjectPath)) {
        throw new ForbiddenError('Acceso denegado');
    }
    return targetPath;
}

function ensureExists(targetPath) {
    if (!fs.existsSync(targetPath)) {
        throw new NotFoundError('El recurso solicitado no existe');
    }
}

function deriveFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.java') return 'java';
    if (ext === '.js') return 'javascript';
    if (ext === '.ts') return 'typescript';
    if (ext === '.yml' || ext === '.yaml') return 'swagger';
    if (ext === '.drawio') return 'drawio';
    return 'markdown';
}

function getProjectTree(projectPath) {
    return buildFileTree(projectPath);
}

function getFileContent(projectPath, relativePath) {
    const targetPath = resolveProjectPath(projectPath, relativePath);
    ensureExists(targetPath);

    try {
        const content = fs.readFileSync(targetPath, 'utf-8');
        return {
            content,
            fileType: deriveFileType(relativePath),
            fileName: path.basename(relativePath)
        };
    } catch (error) {
        throw new Error('Error al leer el archivo');
    }
}

function getDocumentation(projectPath, sourcePath) {
    if (!sourcePath) {
        throw new BadRequestError('Ruta de archivo de código requerida');
    }

    const sourceDir = path.dirname(sourcePath);
    const ext = path.extname(sourcePath);
    const sourceName = path.basename(sourcePath, ext);
    const mdRelativePath = path.join(sourceDir, 'docs', `${sourceName}.md`);
    const mdFullPath = resolveProjectPath(projectPath, mdRelativePath);

    ensureExists(mdFullPath);

    const content = fs.readFileSync(mdFullPath, 'utf-8');
    return {
        content,
        path: mdRelativePath.split(path.sep).join('/'),
        fileName: `${sourceName}.md`
    };
}

function getRawFile(projectPath, relativePath) {
    const targetPath = resolveProjectPath(projectPath, relativePath);
    ensureExists(targetPath);

    const ext = path.extname(relativePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/plain';

    return {
        fullPath: targetPath,
        contentType
    };
}

function deleteFileOrFolder(projectPath, relativePath) {
    const targetPath = resolveProjectPath(projectPath, relativePath);
    ensureExists(targetPath);

    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        return {
            success: true,
            deleted: relativePath,
            type: 'folder'
        };
    }

    fs.unlinkSync(targetPath);
    return {
        success: true,
        deleted: relativePath,
        type: 'file'
    };
}

function uploadFiles(projectPath, folderPath, files) {
    if (!files || files.length === 0) {
        throw new BadRequestError('No se han enviado archivos');
    }

    const targetDir = resolveProjectPath(projectPath, folderPath);
    ensureExists(targetDir);

    const uploadedFiles = [];
    const errors = [];

    files.forEach((file) => {
        const destination = path.join(targetDir, file.originalname);
        try {
            fs.writeFileSync(destination, file.buffer);
            uploadedFiles.push(file.originalname);
        } catch (error) {
            errors.push(file.originalname);
        }
    });

    if (uploadedFiles.length === 0) {
        throw new Error('No se pudo subir ningún archivo');
    }

    return {
        success: true,
        uploadedFiles,
        errors,
        count: uploadedFiles.length
    };
}

module.exports = {
    getProjectTree,
    getFileContent,
    getDocumentation,
    getRawFile,
    deleteFileOrFolder,
    uploadFiles
};
