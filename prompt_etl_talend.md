# Plan de Documentación de Proceso Talend

## Requisitos

### 1. Ubicación de la documentación- Toda la documentación generada debe guardarse en la carpeta `documentación`. 

### 2. Documentación JOB principal
- Incluye una descripción del funcionamiento del JOB Talend principal `documentacion/README.md`.
- Crea diagramas Mermaid que representen el flujo del proceso y llamadas a subprocesos.
- Añade cualquier otra información útil para entender el proceso. 

### 3. Documentación de subjobs
- Documenta todas los subjobs del proceso Talend.
- Para cada subjob, crea un archivo `.md` en `docs` dentro de la misma carpeta donde esté el archivo `.item`/`.properties` con el mismo nombre (ejemplo: `mi_job.item` → `docs/mi_job.md`).
- En cada archivo `.md`, incluye:  
  - Una descripción de lo que hace el subjob.  
  - Uno o varios diagramas mermaid que representen la funcionalidad del subjob
  - Cualquier cosa relevante dentro del subjob

### 4. Plan de documentación y seguimiento
- Crea un archivo `plan_documentacion.md` en `documentación`.
- Este plan debe listar todas las tareas necesarias para completar la documentación (ejemplo: "Documentar subjob X", "Crear diagrama de flujo", ...).
- Incluye un sistema de check (como casillas o columnas) que puedas marcar o actualizar al completar cada tarea, para controlar el avance y asegurar que ningun job/subjob queda sin documentar

--- 

## Inicio
Por favor, genera esta estructura inicial, comenzando con:
- La planificación general
- La descripción del funcionamiento del proceso Talend
- Los diagramas Mermaid del flujo principal Luego, continúa con la documentación de los subjobs