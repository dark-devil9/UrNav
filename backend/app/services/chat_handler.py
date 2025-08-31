from typing import Dict, List, Optional, Tuple
from ..services.mistral_service import MistralService
from ..services.foursquare_service import FoursquareService
import json
import re
from datetime import datetime, timedelta

class ChatHandler:
    def __init__(self):
        self.mistral = MistralService()
        self.foursquare = FoursquareService()
        
        # In-memory storage for demo (in production, use Redis/PostgreSQL)
        self.conversations: Dict[str, Dict] = {}
        
    def _get_conversation(self, user_id: str) -> Dict:
        """Get or create conversation for user"""
        if user_id not in self.conversations:
            self.conversations[user_id] = {
                "messages": [],
                "user_info": {
                    "name": None,
                    "location": None,
                    "preferences": []
                },
                "last_updated": datetime.now()
            }
        return self.conversations[user_id]
    
    def _cleanup_old_conversations(self):
        """Remove conversations older than 24 hours"""
        cutoff = datetime.now() - timedelta(hours=24)
        expired = [uid for uid, conv in self.conversations.items() 
                  if conv["last_updated"] < cutoff]
        for uid in expired:
            del self.conversations[uid]
    
    def _detect_query_type(self, query: str) -> Tuple[str, float, Dict]:
        """
        Detect if query is travel/location related or small talk
        Returns: (query_type, confidence, extracted_info)
        """
        query_lower = query.lower()
        
        # Travel/location patterns - Enhanced detection
        travel_patterns = [
            r'\b(places?|attractions?|restaurants?|hotels?|cafes?|parks?|museums?|shops?)\b',
            r'\b(visit|go|travel|explore|roam|wander|see|find)\b',
            r'\b(near|around|in|at|to)\s+\w+',
            r'\b(best|top|popular|famous|recommended)\s+\w+',
            r'\b(where|what)\s+(places?|to\s+do|to\s+visit)',
            r'\b(manali|jaipur|delhi|mumbai|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|udaipur|jodhpur|jaisalmer|mount\s+abu|pushkar|germany|france|italy|spain|uk|usa|canada|australia|japan|china|thailand|singapore|dubai)\b',
            r'\b(coffee|food|eat|drink|shopping|entertainment)\b',
            r'\b(travel|trip|vacation|holiday|journey)\b',
            r'\b(want\s+to\s+go|planning\s+to\s+visit|thinking\s+of\s+going)\b'
        ]
        
        # Personal/small talk patterns
        personal_patterns = [
            r'\b(hi|hello|hey|good\s+(morning|afternoon|evening))\b',
            r'\b(how\s+are\s+you|how\s+you\s+doing)\b',
            r'\b(what\s+is\s+your\s+name|who\s+are\s+you)\b',
            r'\b(my\s+name\s+is|i\s+am\s+called|call\s+me)\b',
            r'\b(thank\s+you|thanks|bye|goodbye)\b',
            r'\b(weather|time|date|day)\b',
            r'\b(joke|funny|entertain|tell\s+me)\b'
        ]
        
        travel_score = 0
        personal_score = 0
        extracted_info = {}
        
        # Check travel patterns with higher weights
        for pattern in travel_patterns:
            matches = re.findall(pattern, query_lower)
            if matches:
                travel_score += len(matches) * 0.4  # Increased weight
                
        # Check personal patterns
        for pattern in personal_patterns:
            matches = re.findall(pattern, query_lower)
            if matches:
                personal_score += len(matches) * 0.3
        
        # Extract location names (cities/countries) with higher weight
        city_pattern = r'\b(manali|jaipur|delhi|mumbai|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|udaipur|jodhpur|jaisalmer|mount\s+abu|pushkar|germany|france|italy|spain|uk|usa|canada|australia|japan|china|thailand|singapore|dubai)\b'
        city_matches = re.findall(city_pattern, query_lower)
        if city_matches:
            extracted_info["city"] = city_matches[0]
            travel_score += 0.8  # Much higher weight for city mentions
        
        # Extract activity types
        activity_pattern = r'\b(coffee|cafe|restaurant|food|park|museum|shopping|hotel|attraction|place)\b'
        activity_matches = re.findall(activity_pattern, query_lower)
        if activity_matches:
            extracted_info["activity"] = activity_matches[0]
            travel_score += 0.4
        
        # Special handling for travel intent words
        if any(word in query_lower for word in ["travel", "trip", "vacation", "holiday", "journey"]):
            travel_score += 0.6
        
        if any(phrase in query_lower for phrase in ["want to go", "planning to visit", "thinking of going"]):
            travel_score += 0.7
        
        # Determine query type with lower threshold for travel
        if travel_score > personal_score and travel_score > 0.2:  # Lowered threshold
            result = "travel"
        elif personal_score > 0.3:
            result = "personal"
        else:
            result = "general"
        
        return result, travel_score if result == "travel" else personal_score, extracted_info
    
    def _format_conversation_history(self, messages: List[Dict]) -> str:
        """Format conversation history for Mistral context"""
        if not messages:
            return "No previous conversation."
        
        # Get last 10 messages for context
        recent_messages = messages[-10:]
        formatted_history = []
        
        for msg in recent_messages:
            role = "User" if msg["role"] == "user" else "URNAV"
            content = msg["content"]
            formatted_history.append(f"{role}: {content}")
        
        return "\n".join(formatted_history)
    
    async def _handle_travel_query(self, query: str, user_location: Dict, extracted_info: Dict, conversation: Dict) -> str:
        """Handle travel/location related queries with full context"""
        try:
            # Check conversation history for previous travel destinations
            conversation_history = self._format_conversation_history(conversation["messages"])
            
            # Look for previous travel destinations in conversation history
            previous_destination = None
            for msg in conversation["messages"]:
                if msg["role"] == "user":
                    # Check if this message mentioned a travel destination
                    city_pattern = r'\b(manali|jaipur|delhi|mumbai|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|udaipur|jodhpur|jaisalmer|mount\s+abu|pushkar|germany|france|italy|spain|uk|usa|canada|australia|japan|china|thailand|singapore|dubai)\b'
                    city_matches = re.findall(city_pattern, msg["content"].lower())
                    if city_matches:
                        previous_destination = city_matches[0]
                        break
            
            # Determine search location
            search_lat = user_location["lat"]
            search_lon = user_location["lon"]
            search_radius = 5000  # 5km default
            
            # If specific city mentioned in current query, use it
            if "city" in extracted_info:
                city_name = extracted_info["city"].lower()
                destination_type = "current_query"
            # If no city in current query but found in conversation history, use that
            elif previous_destination:
                city_name = previous_destination
                destination_type = "conversation_history"
            else:
                city_name = None
                destination_type = "local"
            
            # Enhanced city coordinates with more destinations
            city_coords = {
                "manali": {"lat": 32.2432, "lon": 77.1892, "type": "domestic"},
                "jaipur": {"lat": 26.9124, "lon": 75.7873, "type": "domestic"},
                "delhi": {"lat": 28.7041, "lon": 77.1025, "type": "domestic"},
                "mumbai": {"lat": 19.0760, "lon": 72.8777, "type": "domestic"},
                "udaipur": {"lat": 24.5854, "lon": 73.7125, "type": "domestic"},
                "germany": {"lat": 51.1657, "lon": 10.4515, "type": "international"},
                "france": {"lat": 46.2276, "lon": 2.2137, "type": "international"},
                "italy": {"lat": 41.8719, "lon": 12.5674, "type": "international"},
                "spain": {"lat": 40.4637, "lon": -3.7492, "type": "international"},
                "uk": {"lat": 55.3781, "lon": -3.4360, "type": "international"},
                "usa": {"lat": 37.0902, "lon": -95.7129, "type": "international"},
                "japan": {"lat": 36.2048, "lon": 138.2529, "type": "international"},
                "thailand": {"lat": 15.8700, "lon": 100.9925, "type": "international"},
                "singapore": {"lat": 1.3521, "lon": 103.8198, "type": "international"},
                "dubai": {"lat": 25.2048, "lon": 55.2708, "type": "international"}
            }
            
            if city_name and city_name in city_coords:
                search_lat = city_coords[city_name]["lat"]
                search_lon = city_coords[city_name]["lon"]
                search_radius = 10000  # 10km for city searches
                destination_type = city_coords[city_name]["type"]
            
            # Build search query
            search_query = ""
            if "activity" in extracted_info:
                search_query = extracted_info["activity"]
            
            # For international destinations, provide travel advice instead of local search
            if destination_type == "international":
                # Generate travel advice for international destinations
                prompt = f"""
                You are URNAV, a helpful and context-aware travel assistant. 

                CONVERSATION HISTORY:
                {conversation_history}

                USER'S CURRENT QUERY: "{query}"
                USER'S NAME: {conversation["user_info"]["name"] or 'Not provided'}
                USER'S CURRENT LOCATION: {user_location.get('name', 'your location')}
                DESTINATION: {city_name.title()}

                INSTRUCTIONS:
                1. The user wants to travel to {city_name.title()}, which is an international destination
                2. Provide helpful travel advice for {city_name.title()}
                3. Include popular attractions, best time to visit, travel tips
                4. Reference the conversation history for context
                5. Keep responses conversational, warm, and 3-4 sentences maximum
                6. Don't search for local places - focus on travel advice for the destination
                7. If this is a follow-up question, acknowledge the previous conversation about {city_name.title()}

                RESPONSE:"""
                
                response = await self.mistral.generate_reply(prompt, {
                    "query": query,
                    "destination": city_name,
                    "conversation_history": conversation_history,
                    "user_name": conversation["user_info"]["name"]
                })
                return response
            
            # For domestic/local destinations, search Foursquare
            places_data = await self.foursquare.search(search_lat, search_lon, query=search_query, radius=search_radius)
            places = places_data.get("results", [])
            
            # Format places for Mistral
            places_summary = []
            if places:
                for i, place in enumerate(places[:5]):  # Top 5 results
                    name = place.get("name", "Unknown")
                    category = place.get("categories", [{}])[0].get("name", "Place") if place.get("categories") else "Place"
                    distance = place.get("distance", 0)
                    rating = place.get("rating", 0)
                    
                    places_summary.append({
                        "name": name,
                        "category": category,
                        "distance": f"{distance}m away" if distance else "nearby",
                        "rating": f"⭐ {rating}/10" if rating else ""
                    })
            
            # Create comprehensive context for Mistral
            context = {
                "query": query,
                "user_location": user_location,
                "places_found": places_summary,
                "search_area": f"around {user_location.get('name', 'your location')}" if not city_name else f"in {city_name.title()}",
                "conversation_history": conversation_history,
                "user_name": conversation["user_info"]["name"],
                "destination_type": destination_type,
                "previous_destination": city_name
            }
            
            # Generate natural language response using Mistral with full context
            prompt = f"""
            You are URNAV, a helpful and context-aware travel assistant. 

            CONVERSATION HISTORY:
            {conversation_history}

            USER'S CURRENT QUERY: "{query}"
            USER'S NAME: {context['user_name'] or 'Not provided'}
            USER'S LOCATION: {context['search_area']}
            DESTINATION TYPE: {destination_type}
            PREVIOUS DESTINATION: {city_name or 'None'}

            PLACES FOUND: {json.dumps(places_summary, indent=2) if places_summary else "No specific places found"}

            INSTRUCTIONS:
            1. Use the conversation history to understand context and provide follow-up responses
            2. If this is a follow-up question, reference the previous conversation naturally
            3. If places were found, mention them in a helpful way
            4. If no places found, suggest alternatives or ask for clarification
            5. Keep responses conversational, warm, and 2-4 sentences maximum
            6. Always maintain context awareness - don't repeat information unnecessarily
            7. For domestic destinations, focus on local places found
            8. For international destinations, provide travel advice
            9. If user is asking about a previous destination, reference that conversation

            RESPONSE:"""
            
            response = await self.mistral.generate_reply(prompt, context)
            return response
            
        except Exception as e:
            print(f"Error handling travel query: {e}")
            # Even on error, try to get a contextual response from Mistral
            conversation_history = self._format_conversation_history(conversation["messages"])
            fallback_prompt = f"""
            You are URNAV, a travel assistant. The user asked: "{query}"
            
            CONVERSATION HISTORY:
            {conversation_history}
            
            I'm having trouble finding places right now. Please provide a helpful, contextual response that acknowledges their request and suggests they try again later. Keep it warm and conversational.
            """
            
            try:
                fallback_response = await self.mistral.generate_reply(fallback_prompt, {"query": query})
                return fallback_response
            except:
                return "I'm having trouble finding places right now. Please try again in a moment!"
    
    async def _handle_personal_query(self, query: str, conversation: Dict) -> str:
        """Handle personal/small talk queries with full context"""
        try:
            # Get conversation history for context
            conversation_history = self._format_conversation_history(conversation["messages"])
            
            # Check if user is telling us their name
            name_pattern = r'\b(?:my\s+name\s+is|i\s+am\s+called|call\s+me)\s+(\w+)'
            name_match = re.search(name_pattern, query.lower())
            if name_match:
                name = name_match.group(1).title()
                conversation["user_info"]["name"] = name
                
                # Use Mistral to generate a personalized response
                prompt = f"""
                You are URNAV, a friendly AI travel assistant. 

                CONVERSATION HISTORY:
                {conversation_history}

                USER JUST TOLD YOU THEIR NAME: {name}
                
                Generate a warm, personalized response welcoming them by name and asking how you can help them explore today. 
                Reference the conversation history if relevant. Keep it 1-2 sentences and enthusiastic.
                """
                
                response = await self.mistral.generate_reply(prompt, {"name": name, "conversation_history": conversation_history})
                return response
            
            # Check if asking about their name
            if "what is my name" in query.lower() or "do you know my name" in query.lower():
                if conversation["user_info"]["name"]:
                    prompt = f"""
                    You are URNAV. The user asked: "{query}"
                    
                    CONVERSATION HISTORY:
                    {conversation_history}
                    
                    USER'S NAME: {conversation["user_info"]["name"]}
                    
                    Generate a friendly response confirming their name and asking how you can help. Use the conversation history for context.
                    """
                    
                    response = await self.mistral.generate_reply(prompt, {"name": conversation["user_info"]["name"], "conversation_history": conversation_history})
                    return response
                else:
                    prompt = f"""
                    You are URNAV. The user asked: "{query}"
                    
                    CONVERSATION HISTORY:
                    {conversation_history}
                    
                    You don't know their name yet. Generate a friendly response explaining this and suggesting they tell you their name.
                    """
                    
                    response = await self.mistral.generate_reply(prompt, {"conversation_history": conversation_history})
                    return response
            
            # Check if asking about bot's name
            if "what is your name" in query.lower() or "who are you" in query.lower():
                prompt = f"""
                You are URNAV, an AI travel companion. The user asked: "{query}"
                
                CONVERSATION HISTORY:
                {conversation_history}
                
                Generate a friendly response introducing yourself as URNAV and explaining how you can help with travel and exploration. 
                Reference the conversation history if relevant. Keep it warm and 1-2 sentences.
                """
                
                response = await self.mistral.generate_reply(prompt, {"conversation_history": conversation_history})
                return response
            
            # General personal queries - use Mistral with full context
            context = {
                "user_name": conversation["user_info"]["name"],
                "user_location": conversation["user_info"]["location"],
                "conversation_history": conversation_history,
                "query": query
            }
            
            prompt = f"""
            You are URNAV, a friendly AI travel assistant. 

            CONVERSATION HISTORY:
            {conversation_history}

            USER'S CURRENT QUERY: "{query}"
            USER'S NAME: {context['user_name'] or 'Not provided'}
            USER'S LOCATION: {context['user_location'] or 'Not provided'}

            INSTRUCTIONS:
            1. Use the conversation history to understand context and provide follow-up responses
            2. If this is a follow-up question, reference the previous conversation naturally
            3. If they're asking about travel, gently guide them toward asking about places to visit
            4. Keep responses conversational, warm, and 1-2 sentences maximum
            5. Always maintain context awareness - don't repeat information unnecessarily
            6. Be helpful and encouraging

            RESPONSE:"""
            
            response = await self.mistral.generate_reply(prompt, context)
            return response
            
        except Exception as e:
            print(f"Error handling personal query: {e}")
            # Even on error, try to get a contextual response
            conversation_history = self._format_conversation_history(conversation["messages"])
            fallback_prompt = f"""
            You are URNAV. The user said: "{query}"
            
            CONVERSATION HISTORY:
            {conversation_history}
            
            I'm having trouble processing this right now. Please provide a helpful, contextual response that acknowledges their message and suggests they try again later. Keep it warm and conversational.
            """
            
            try:
                fallback_response = await self.mistral.generate_reply(fallback_prompt, {"query": query})
                return fallback_response
            except:
                return "I'm here to help! What would you like to explore today?"
    
    async def process_message(self, user_id: str, message: str, user_location: Dict) -> str:
        """Main method to process user messages with full context awareness"""
        try:
            # Cleanup old conversations
            self._cleanup_old_conversations()
            
            # Get conversation
            conversation = self._get_conversation(user_id)
            
            # Update user location if provided
            if user_location:
                conversation["user_info"]["location"] = user_location
                conversation["last_updated"] = datetime.now()
            
            # Add user message to history
            conversation["messages"].append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Detect query type
            query_type, confidence, extracted_info = self._detect_query_type(message)
            
            # Handle based on query type with full conversation context
            if query_type == "travel":
                response = await self._handle_travel_query(message, user_location, extracted_info, conversation)
            elif query_type == "personal":
                response = await self._handle_personal_query(message, conversation)
            else:
                # General query - try to determine intent
                if any(word in message.lower() for word in ["place", "visit", "go", "see", "find"]):
                    response = await self._handle_travel_query(message, user_location, extracted_info, conversation)
                else:
                    response = await self._handle_personal_query(message, conversation)
            
            # Add assistant response to history
            conversation["messages"].append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only last 10 messages for context
            if len(conversation["messages"]) > 10:
                conversation["messages"] = conversation["messages"][-10:]
            
            return response
            
        except Exception as e:
            print(f"Error processing message: {e}")
            # Even on critical error, try to get a contextual response
            try:
                conversation = self._get_conversation(user_id)
                conversation_history = self._format_conversation_history(conversation["messages"])
                
                error_prompt = f"""
                You are URNAV. The user said: "{message}"
                
                CONVERSATION HISTORY:
                {conversation_history}
                
                I'm having technical difficulties. Please provide a helpful, contextual response that acknowledges their message and suggests they try again later. Keep it warm and conversational.
                """
                
                error_response = await self.mistral.generate_reply(error_prompt, {"query": message})
                return error_response
            except:
                return "I'm having trouble processing your message right now. Please try again!"
    
    def get_user_info(self, user_id: str) -> Dict:
        """Get user information from conversation"""
        conversation = self._get_conversation(user_id)
        return conversation["user_info"]
    
    def clear_conversation(self, user_id: str):
        """Clear conversation history for user"""
        if user_id in self.conversations:
            del self.conversations[user_id]
