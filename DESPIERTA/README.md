# INSTRUCCIONES PARA LEVANTAR SERVICIOS EN AUTOMATICO

Posicionarse en la carpeta `/Gestor-restaurantes`, ahi se puede ver el archivo `levantad.sh`, realizar el siguiente proceso estando en la carpeta antes mencionada.

Este es un archivo bash para ejecutar comandos con un solo comando, es una manera de automatizar las cosas.

Nos ayuda para no estar levantando servicios uno por uno, entonces lo unico que se debe de hacer es esto.

1. Cambiar el modo a ejecutable del archivo, solo se ejecuta la primera vez que se vaya a utilizar:

    ```bash
    $ chmod +x levantad.sh 
    ```

2. Levantar los servicios ejecutando el archivito con:

    ```bash
    $ source levantad.sh
    ```

con eso se deberia de ver algunas shells levantandose.