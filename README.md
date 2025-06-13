# PROYECTO FINAL SW

Este es el repositorio para el proyecto final de SW. Algunos recordatorios para trabajar con git y github.

1. Clonar este repositorio

    ```bash
    git clone https://github.com/adrien04hz/GESTOR-RESTAURANTES.git
    ```


# Para poder subir sus actualizaciones.

1. Añadir el destino del repositorio

    ```bash
    git remote add origin https://github.com/adrien04hz/GESTOR-RESTAURANTES.git
    ```

2. Crear su rama para trabajar y cambiarse a su rama

    ```bash
    git checkout -b <nombre_de_su_rama>
    ```

3. Revisar el estado de su git

    ```bash
    git status
    ```

4. Si tienen cambios o archivos nuevos o cualquier cosita, realizar los siguientes comando:

    ```bash
    git add .
    ```

    Para preparar los cambios, y posteriormente realizar:

    ```bash
    git commit -m <mensaje_commit>
    ```

    Para confirmar los cambios.


5. Subir sus cambios de su rama a github

    ```bash
    git push origin <nombre_de_su_rama>
    ```

6. En github revisar y realizar un pull request para posteriormente realizar el merge.


#  Actualizar lo remoto a su maquina local

1. Si se encuentran en su rama, cambiarse a la rama main

    ```bash
    git checkout main
    ```

2. Traer lo que hay en el repositorio a su maquina local

    ```bash
    git pull origin main
    ```


3. Regresar a su rama

    ```bash
    git checkout <nombre_de_su_rama>
    ```

4. Mezclar la rama principal con su rama

    ```bash
    git merge main
    ```


Antes de subir cualquier cambio de su rama, recuerden realizar 

```bash
git add .
```
y

```bash
git commit -m <su_mensaje>
```

para que puedan subir bien sus cambios.

Posiblemente en algun punto ocurran conflictos para mezclar, cualquier modo, acudan al equipo para checarlo, si lo necesitan.


# Revisar la carpeta DESPIERTA una vez tengan instalado todo manualmente