# Java Documentation Viewer

Aplicación web para visualizar documentación de proyectos Java con estructura de carpetas `docs`.

## 🚀 Características

- **Gestión de múltiples proyectos**: Añade tantas rutas de proyectos como necesites
- **Explorador de archivos**: Navega por la estructura de carpetas de cada proyecto
- **Syntax Highlighting**: Código Java con coloreado de sintaxis
- **Visor de Markdown**: Renderizado de archivos `.md` con soporte para tablas, código, etc.
- **Vista dividida**: Visualiza código y documentación lado a lado
- **Enlace automático**: Detecta automáticamente la documentación asociada a cada archivo Java

## 📋 Requisitos

- Node.js 14 o superior
- npm

## 🔧 Instalación

1. **Navega a la carpeta del proyecto**:
   ```bash
   cd doc-viewer
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Inicia el servidor**:
   ```bash
   npm start
   ```

4. **Abre tu navegador** en: http://localhost:3000

## 📁 Estructura esperada del proyecto

La aplicación espera que los proyectos tengan una estructura similar a esta:

```
mi-proyecto/
├── carpeta1/
│   ├── MiClase.java
│   ├── OtraClase.java
│   └── docs/
│       ├── MiClase.md
│       └── OtraClase.md
├── carpeta2/
│   ├── Servicio.java
│   └── docs/
│       └── Servicio.md
└── README.md
```

- Cada carpeta puede contener archivos `.java`
- La documentación se busca en una subcarpeta `docs/` con el mismo nombre pero extensión `.md`

## 🎯 Uso

### Añadir un proyecto

1. Haz clic en **"+ Añadir Proyecto"**
2. Introduce un nombre descriptivo
3. Introduce la ruta absoluta al proyecto (ej: `C:\Users\...\mi-proyecto`)
4. Haz clic en **"Guardar"**

### Navegar archivos

- Haz clic en un proyecto para expandir su estructura
- Haz clic en las carpetas para ver su contenido
- Los archivos Java se muestran con icono ☕
- Los archivos con documentación asociada tienen una etiqueta "DOC"

### Vistas disponibles

- **Código Java**: Muestra el código fuente con syntax highlighting
- **Documentación**: Muestra el archivo Markdown renderizado
- **Vista Dividida**: Muestra ambos paneles lado a lado

### Navegar entre código y documentación

- Usa los botones "Ver Doc" y "Ver Código" para saltar entre vistas
- O usa los tabs en la parte superior para cambiar de vista

## ⚙️ Configuración

Los proyectos se guardan automáticamente en `projects.json` para persistencia entre reinicios.

### Cambiar el puerto

Puedes cambiar el puerto modificando la variable de entorno:

```bash
PORT=8080 npm start
```

O en Windows PowerShell:
```powershell
$env:PORT=8080; npm start
```

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript
- **Syntax Highlighting**: Highlight.js
- **Markdown Rendering**: Marked.js

## 📝 Notas

- La aplicación solo muestra archivos `.java` y `.md`
- Se ignoran automáticamente las carpetas: `node_modules`, `.git`, `target`, `.idea`, `build`
- Los proyectos registrados persisten entre reinicios del servidor
