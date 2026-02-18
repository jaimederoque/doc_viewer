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
  
### 4. Documentación de scripts

Si un Job o Subjob tiene `componentName="tSystem"`, significa que ejecuta un script:
- `elementParameter`: si `field="MEMO_JAVA"` y `name="COMMAND"`, al final de `value` se encuentra el nombre de la variable de contexto del script.
  - Ejemplo: `value="context.con_mongo_client_bin+/mongo +context.con_mongo_client_server+ --authenticationDatabase admin -u +context.con_mongo_user+ -p +context.con_mongo_password+ --ssl --sslAllowInvalidHostnames +context.con_s3_dir_scripts+context.con_script_alineamiento"`
- La variable de contexto es la última de la línea: con_script_alineamiento
- Todos los scripts se encuentran en la carpeta `scripts`.
- Para saber qué script ejecuta cada tSystem:
    - Debes buscar en la carpeta `jobs.properties` el nombre original del Job seguido de "." + la variable de contexto que haya en el tSystem.
    - Ejemplo: JOB_ODH_PIRCOM_S3.con_script_alineamiento;/otros/sc_PirCom_alineamientoJerarquia.js
        - La variable de contexto se llama con_script_alineamiento
        - El nombre del script es sc_PirCom_alineamientoJerarquia.js. Este es el script que debes buscar en la carpeta `scripts`.
- Una vez localices el script en la carpeta `scripts`, copialo a la carpeta del código en una carpeta `scripts` (si no existe, creala)
- Documenta este script también creando su propio archivo .md con las mismas lógica, describiendo qué hace el script y creando uno o varios diagramas mermaid que representen gráficamente la funcionalidad del script.

### 5. Plan de documentación y seguimiento
- Crea un archivo `plan_documentacion.md` en `documentación`.
- Este plan debe listar todas las tareas necesarias para completar la documentación (ejemplo: "Documentar subjob X", "Crear diagrama de flujo", ...).
- Incluye un sistema de check (como casillas o columnas) que puedas marcar o actualizar al completar cada tarea, para controlar el avance y asegurar que ningun job/subjob queda sin documentar

--- 

## Inicio
Por favor, genera esta estructura inicial, comenzando con:
- La planificación general
- La descripción del funcionamiento del proceso Talend
- Los diagramas Mermaid del flujo principal Luego, continúa con la documentación de los subjobs