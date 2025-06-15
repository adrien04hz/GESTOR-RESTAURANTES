# main.py
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

MONGO_URL = os.getenv("MONGO_URL")  
client = AsyncIOMotorClient(MONGO_URL)
db = client["sample_mflix"]  # nombre de tu base

@app.get("/")
async def root():
    return {"message": "Mongo conectado"}

@app.get("/listar")
async def listar():
    documentos = []
    cursor = db["movies"].find().limit(10)  # Limitar a 10 documentos para evitar sobrecarga
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        documentos.append(doc)
    return documentos


'''
MONGO_URL="mongodb+srv://adrienahs:4dr13nM0N0G0@gestorrestaurantes.t3vx5ir.mongodb.net/?retryWrites=true&w=majority&appName=GestorRestaurantes"
'''


'''
mongodb+srv://<db_username>:<db_password>@gestorrestaurantes.t3vx5ir.mongodb.net/?retryWrites=true&w=majority&appName=GestorRestaurantes
'''