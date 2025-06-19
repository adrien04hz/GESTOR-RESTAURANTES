# CARPETA PARA LOS ENDPOINTS CON PYTHON, FASTAPI Y UVICORN

Este es la carpeta para los endpoints que se crearan con FASTAPI.

Los siguientes pasos son:

1. Crear entorno virtual, dentro de la carpeta `ENDPOINTS`, para python, ejecutarlo tal cual, ya que el .gitignore ya esta configurado para que no tome en cuenta el nombre del entorno virtual.

    ```bash
    python3 -m venv venv
    ```

2. Dentro de `ENDPOINTS`, activar el entorno con:

    ```bash
    source venv/bin/activate
    ```

3. Una vez activado, instalar `FastApi` y `Uvicorn` con:

    ```bash
    pip install fastapi uvicorn
    ```

4. Finalmente:

    ```bash
    uvicorn app:app --reload
    ```
5. Para poder usar los JWT se instala esto en el entorno virtual:
   ```basg
   pip install "python-jose[cryptography]" "passlib[bcrypt]"
   ```
