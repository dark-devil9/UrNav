from typing import Any, Dict
import httpx
from ..config import settings

class MistralService:
    async def parse_query(self, text: str) -> Dict[str, Any]:
        t = text.lower()
        category = "cafe" if any(k in t for k in ["cafe", "coffee"]) else None
        radius = 1500
        filters: Dict[str, Any] = {}
        for f in ["wifi", "quiet", "vegetarian"]:
            if f in t:
                filters[f] = True
        return {"category": category, "radius": radius, "filters": filters}

    async def parse_plan(self, text: str) -> Dict[str, Any]:
        # Very simple heuristic parser to extract tasks from free text.
        # In production, plug in a real LLM call here using settings.MISTRAL_API_KEY.
        t = text.strip()
        lowered = t.lower()
        tasks: list[str] = []
        # Split by common separators
        for chunk in [c.strip(" .") for c in lowered.replace(" and then ", ";").replace(" then ", ";").replace(" and ", ";").split(";")]:
            if not chunk:
                continue
            if any(k in chunk for k in ["bouquet", "flowers", "flower"]):
                tasks.append("Buy bouquets")
            elif any(k in chunk for k in ["coffee", "cafe", "breakfast"]):
                tasks.append("Get coffee")
            elif any(k in chunk for k in ["grocer", "store", "shopping"]):
                tasks.append("Buy groceries")
            elif any(k in chunk for k in ["post", "courier", "parcel"]):
                tasks.append("Visit post office")
            elif any(k in chunk for k in ["meet", "friend"]):
                tasks.append("Meet friend")
            else:
                # Fallback: keep the chunk as a task sentence-case
                tasks.append(chunk.capitalize())

        if not tasks:
            tasks = ["Get coffee", "Buy bouquets"]

        return {"tasks": tasks}

    async def generate_reply(self, text: str, context: Dict[str, Any] | None = None) -> str:
        # If a Mistral API key is configured, attempt to call it for a richer response
        api_key = settings.MISTRAL_API_KEY
        system_prompt = "You are URNAV, a helpful navigation assistant. Use provided context only when relevant. Be concise."
        user_message = text
        if context:
            # Provide soft context to the model
            meta = []
            if context.get("lang"):
                meta.append(f"lang={context['lang']}")
            if context.get("pincode"):
                meta.append(f"pincode={context['pincode']}")
            if context.get("coords"):
                coords = context["coords"]
                meta.append(f"coords=({coords.get('lat')},{coords.get('lon')})")
            if meta:
                user_message = f"Context: {'; '.join(meta)}\nQuestion: {text}"

        if api_key:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        "https://api.mistral.ai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "mistral-small-latest",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_message},
                            ],
                            "temperature": 0.5,
                        },
                    )
                    data = resp.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content")
                    if isinstance(content, str) and content.strip():
                        return content.strip()
            except Exception:
                # fall back to heuristic below
                pass

        # Heuristic fallback reply
        if any(k in text.lower() for k in ["nearby", "around me", "close by", "near me"]):
            return "Looking for nearby options... I’ll list a few suggestions for you."
        return "Got it. Let me think about that and gather relevant options."