# Plan de Documentación del Microservicio Spring Boot

## Requisitos

### 1. Ubicación de la documentación- Toda la documentación generada debe guardarse en la carpeta `documentación`. 

### 2. Documentación general
- Incluye una descripción del funcionamiento del proceso general del microservicio en un fichero dentro de `documentacion/README.md`.
- Crea diagramas Mermaid que representen el flujo de llamadas de la aplicación y otros diagramas relevantes.
- Añade cualquier otra información útil para entender el proceso. 

### 3. Documentación de clases
- Documenta todas las clases Java ubicadas en la carpeta `src`.
- Para cada archivo `.java`, crea un archivo `.md` en `docs` dentro de la misma carpeta donde esté el archivo `.java` con el mismo nombre (ejemplo: `MiClase.java` → `docs/MiClase.md`).
- En cada archivo `.md`, incluye:  
  - Una descripción de lo que hace la clase.  
  - Un diagrama que represente la estructura o funcionalidad de la clase (diagramas UML o similares).  
  - Lista de métodos principales con una breve descripción. 

### 4. Plan de documentación y seguimiento
- Crea un archivo `plan_documentacion.md` en `documentación`.
- Este plan debe listar todas las tareas necesarias para completar la documentación (ejemplo: "Documentar clase X", "Crear diagrama de flujo").
- Incluye un sistema de check (como casillas o columnas) que puedas marcar o actualizar al completar cada tarea, para controlar el avance. 
--- 
## Inicio
Por favor, genera esta estructura inicial, comenzando con:
- La planificación general
- La descripción del funcionamiento del microservicio
- Los diagramas Mermaid del flujo principal Luego, continúa con la documentación de las clases.