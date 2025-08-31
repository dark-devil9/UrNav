from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routes import auth, users, places, modes, routes_api, chat_routes

app = FastAPI(title="URNAV Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    # Temporarily disabled for deployment without database
    # await init_db()
    pass

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(places.router, prefix="/places", tags=["places"])
app.include_router(modes.router, prefix="/modes", tags=["modes"])
app.include_router(routes_api.router, prefix="/routes", tags=["routes"])
app.include_router(chat_routes.router, tags=["chat"])

