from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
import json
from datetime import datetime
import random
from rotan_routes import router as rotan_router

app = FastAPI(title="MIRRORNODE Osiris", version="1.0")
app.include_router(rotan_router)


class Verdict(BaseModel):
    node: str
    timestamp: str
    audit: dict
    mirror: dict

connected_clients = []

@app.websocket("/ws/ptah/verdicts")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            verdict = Verdict(
                node=random.choice(["OSIRIS", "PTAH", "LUCIAN", "THOTH"]),
                timestamp=datetime.now().isoformat(),
                audit={
                    "canon_integrity": random.choice(["pass", "neutral", "warn", "fail"]),
                    "dependencies_healthy": random.choice(["pass", "warn"])
                },
                mirror={"result": "pass", "verified": True}
            )
            for client in connected_clients:
                await client.send_json(verdict.dict())
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

@app.get("/")
async def root():
    return {"status": "PTAH verdicts live"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.1", port=7701, reload=True)
