from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI está funcionando correctamente"}

@app.get("/hola")
def nada():
    return {"message": "Rama de Angel"}