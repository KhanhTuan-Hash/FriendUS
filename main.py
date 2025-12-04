from enum import Enum
import requests
import json
from datetime import datetime, timedelta
from sentence_transformers import SentenceTransformer, util
import torch
import math
from typing import List, Dict, Any
import hashlib

# VIETMAP API CONFIGURATION
VIETMAP_API_KEY = "YOUR_VIETMAP_API_KEY"  # Replace with your actual key
VIETMAP_BASE_URL = "https://maps.vietmap.vn/api"


class ConstraintType(Enum):
    PRICE = 1
    LOCATION = 2
    TIME = 3
    INTEREST = 4
    DURATION = 5


_activity_list = None
_constraint_list = {}


def get_activity_list():
    global _activity_list
    if _activity_list is None:
        _activity_list = ActivityList()
    return _activity_list


def get_constraint_list(userID: int):
    global _constraint_list
    if _constraint_list.get(userID) is None:
        _constraint_list[userID] = ConstraintList(userID)
    return _constraint_list[userID]


class Time:
    def __init__(self, start_time: datetime = None, end_time: datetime = None, duration_minutes: int = 120):
        self.start_time = start_time
        self.end_time = end_time
        self.duration_minutes = duration_minutes
        self.time_slot = None  # 'morning', 'afternoon', 'evening', 'flexible'


class Location:
    def __init__(self, name: str = "", address: str = "", latitude: float = 0, longitude: float = 0):
        self.name = name
        self.address = address
        self.latitude = latitude
        self.longitude = longitude


class Activity:
    def __init__(self, id: int, name: str, time: Time, location: Location, price: int):
        self.id = id
        self.name = name
        self.time = time
        self.location = location
        self.price = price
        self.ratings = {}
        self.rating_count = 0
        self.average_ratings = 0
        self.recommendation_score = 0
        self.types = []
        self.vietmap_rating = 0
        self.travel_time_to_next = 0
        self.place_id = ""


class VietmapService:
    def __init__(self, api_key: str = VIETMAP_API_KEY):
        self.api_key = api_key
        self.base_url = VIETMAP_BASE_URL
        self.headers = {
            "User-Agent": "HCMC-Activity-Recommender/1.0",
            "Content-Type": "application/json"
        }

    def search_places(self, query: str, lat: float = 10.8231, lon: float = 106.6297, radius: int = 5000):
        """Search for places using Vietmap API"""
        try:
            # First, try geocoding to verify API works
            test_url = f"{self.base_url}/geocode"
            test_params = {
                "apikey": self.api_key,
                "text": "Ho Chi Minh City",
                "limit": 1
            }

            test_response = requests.get(test_url, params=test_params, headers=self.headers, timeout=10)

            if test_response.status_code != 200:
                print("Vietmap API authentication failed")
                return []

            # Search for places using reverse geocoding (closest to Vietmap's Places API)
            search_url = f"{self.base_url}/reverse"
            params = {
                "apikey": self.api_key,
                "lat": lat,
                "lon": lon,
                "radius": radius,
                "limit": 10,
                "addressdetails": 1,
                "zoom": 18
            }

            response = requests.get(search_url, params=params, headers=self.headers, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return self._parse_vietmap_response(data, query)
            else:
                print(f"Vietmap search failed: {response.status_code}")
                return []

        except requests.exceptions.RequestException as e:
            print(f"Vietmap API error: {e}")
            return []
        except Exception as e:
            print(f"Error processing Vietmap data: {e}")
            return []

    def _parse_vietmap_response(self, data: Dict, query: str):
        """Parse Vietmap response to extract places"""
        places = []

        if not isinstance(data, dict):
            return places

        # Vietmap reverse geocoding returns address data
        # We'll extract relevant information
        address = data.get("address", {})

        # Create a simple place from the address data
        if address:
            place = {
                "name": address.get("name", ""),
                "display_name": data.get("display_name", ""),
                "lat": data.get("lat", 0),
                "lon": data.get("lon", 0),
                "address": address,
                "type": "location"
            }
            places.append(place)

        # Note: Vietmap doesn't have a traditional "places" API like Google
        # This is a simplified approach - for actual places search,
        # you might need to use their search endpoint differently

        return places

    def get_place_details(self, lat: float, lon: float):
        """Get details for a specific location"""
        try:
            url = f"{self.base_url}/reverse"
            params = {
                "apikey": self.api_key,
                "lat": lat,
                "lon": lon,
                "addressdetails": 1,
                "zoom": 18
            }

            response = requests.get(url, params=params, headers=self.headers, timeout=10)

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get place details: {response.status_code}")
                return {}

        except Exception as e:
            print(f"Error getting place details: {e}")
            return {}

    def calculate_route(self, origin_lat: float, origin_lon: float,
                        dest_lat: float, dest_lon: float, mode: str = "car"):
        """Calculate route between two points"""
        try:
            url = f"{self.base_url}/route"
            params = {
                "apikey": self.api_key,
                "point": f"{origin_lat},{origin_lon}",
                "point": f"{dest_lat},{dest_lon}",
                "vehicle": mode,
                "instructions": "false",
                "points_encoded": "false"
            }

            response = requests.get(url, params=params, headers=self.headers, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if data.get("paths") and len(data["paths"]) > 0:
                    return data["paths"][0].get("time", 0) / 1000 / 60  # Convert to minutes
            return 15  # Default fallback travel time

        except Exception as e:
            print(f"Route calculation error: {e}")
            return 15  # Default fallback


class ActivityList:
    def __init__(self):
        self.activities = {}
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vietmap = VietmapService()
        self.next_activity_id = 1

    def add_activity(self, activity: Activity):
        self.activities[activity.id] = activity

    def remove_activity(self, activity: Activity):
        if activity.id in self.activities:
            del self.activities[activity.id]

    def _create_activity_from_vietmap(self, place_data: Dict, time_slot: str = "afternoon") -> Activity:
        """Create Activity object from Vietmap data"""
        try:
            # Generate unique ID
            activity_id = self.next_activity_id
            self.next_activity_id += 1

            # Extract place information
            name = place_data.get("name", "Unknown Place")
            if not name or name == "Unknown Place":
                name = place_data.get("display_name", "Unknown Place").split(",")[0]

            # Get coordinates
            lat = float(place_data.get("lat", 10.8231))
            lon = float(place_data.get("lon", 106.6297))

            # Get address
            address = place_data.get("display_name", "")
            address_parts = address.split(",")[:3] if address else []
            short_address = ", ".join(address_parts) if address_parts else "Ho Chi Minh City"

            # Estimate price based on place type
            place_type = place_data.get("type", "attraction")
            price_mapping = {
                "restaurant": 150000,
                "cafe": 50000,
                "hotel": 0,
                "attraction": 50000,
                "museum": 40000,
                "park": 0,
                "shopping": 100000,
                "location": 0
            }
            price = price_mapping.get(place_type, 50000)

            # Estimate duration based on type
            duration_mapping = {
                "restaurant": 90,
                "cafe": 60,
                "museum": 120,
                "park": 90,
                "shopping": 150,
                "attraction": 120,
                "location": 90
            }
            duration = duration_mapping.get(place_type, 120)

            # Create Time object
            time = Time(duration_minutes=duration, time_slot=time_slot)

            # Create Location object
            location = Location(
                name=name,
                address=short_address,
                latitude=lat,
                longitude=lon
            )

            # Create Activity
            activity = Activity(
                id=activity_id,
                name=name,
                time=time,
                location=location,
                price=price
            )

            # Set additional properties
            activity.types = [place_type]
            activity.vietmap_rating = 4.0  # Default rating
            activity.place_id = f"vietmap_{lat}_{lon}"

            return activity

        except Exception as e:
            print(f"Error creating activity: {e}")
            return None

    def recommend_activities(self, chat_message: str, user_constraints: 'ConstraintList') -> List[Activity]:
        """Recommend activities based on chat input"""
        print(f"Processing chat: '{chat_message}'")

        # Extract search intent
        search_terms = self._extract_search_terms(chat_message)
        if not search_terms:
            search_terms = ["attraction"]

        # Search Vietmap for places
        all_activities = []
        for term in search_terms[:3]:  # Limit to 3 search terms
            try:
                vietmap_places = self.vietmap.search_places(term)

                # Convert to Activity objects
                for place in vietmap_places[:5]:  # Limit to 5 results per term
                    activity = self._create_activity_from_vietmap(place)
                    if activity:
                        # Add to our list
                        self.add_activity(activity)
                        all_activities.append(activity)

            except Exception as e:
                print(f"Failed to search for '{term}': {e}")
                continue

        if not all_activities:
            print("No activities found from Vietmap")
            return []

        # Filter based on constraints
        filtered = self.filter_activities(all_activities, user_constraints)

        # Score activities
        scored = self.score_activities(filtered, user_constraints, chat_message)

        return scored

    def _extract_search_terms(self, chat_message: str) -> List[str]:
        """Extract search terms from chat message"""
        chat_lower = chat_message.lower()

        # Map common phrases to search terms
        term_mapping = {
            "restaurant": ["restaurant", "food", "eat", "dining", "meal", "lunch", "dinner"],
            "cafe": ["cafe", "coffee", "tea", "bakery"],
            "museum": ["museum", "gallery", "art", "history", "exhibition"],
            "park": ["park", "garden", "outdoor", "nature", "walk"],
            "shopping": ["shopping", "mall", "store", "market", "buy"],
            "temple": ["temple", "church", "pagoda", "religious"],
            "hotel": ["hotel", "accommodation", "stay", "lodging"],
            "attraction": ["attraction", "place", "visit", "see", "tourist"]
        }

        found_terms = []
        for term, keywords in term_mapping.items():
            if any(keyword in chat_lower for keyword in keywords):
                found_terms.append(term)

        # If no specific terms found, use general ones
        if not found_terms:
            if "something" in chat_lower or "what" in chat_lower or "do" in chat_lower:
                found_terms = ["attraction", "restaurant", "park"]
            else:
                # Use the chat message itself as search term
                words = chat_lower.split()
                found_terms = [word for word in words if len(word) > 3][:2]

        return list(set(found_terms))  # Remove duplicates

    def filter_activities(self, activities: List[Activity], user_constraints: 'ConstraintList') -> List[Activity]:
        """Filter activities based on hard constraints"""
        if not activities:
            return []

        filtered = []
        for activity in activities:
            meets_all = True

            for constraint in user_constraints.hard_constraints.values():
                if not self._meets_constraint(activity, constraint):
                    meets_all = False
                    break

            if meets_all:
                filtered.append(activity)

        print(f"Filtered {len(activities)} -> {len(filtered)} activities")
        return filtered

    def _meets_constraint(self, activity: Activity, constraint: 'Constraint') -> bool:
        """Check if activity meets a constraint"""
        try:
            if constraint.type == ConstraintType.PRICE:
                return activity.price <= constraint.intValue

            elif constraint.type == ConstraintType.LOCATION:
                if constraint.strValue:
                    search_term = constraint.strValue.lower()
                    return (search_term in activity.location.name.lower() or
                            search_term in activity.location.address.lower())
                return True

            elif constraint.type == ConstraintType.TIME:
                # Check if activity duration fits within time constraint
                return activity.time.duration_minutes <= constraint.intValue

            elif constraint.type == ConstraintType.INTEREST:
                if constraint.strValue:
                    interest = constraint.strValue.lower()
                    return any(interest in tag.lower() for tag in activity.types)
                return True

            elif constraint.type == ConstraintType.DURATION:
                return activity.time.duration_minutes <= constraint.intValue

            return True

        except Exception as e:
            print(f"Constraint check error: {e}")
            return True  # Default to True on error

    def score_activities(self, activities: List[Activity], user_constraints: 'ConstraintList',
                         chat_message: str) -> List[Activity]:
        """Score activities based on multiple factors"""
        if not activities:
            return []

        scored = []
        for activity in activities:
            try:
                score = 0

                # Base score from Vietmap rating (if available)
                score += activity.vietmap_rating * 10

                # User rating score (if available)
                if activity.average_ratings > 0:
                    score += activity.average_ratings * 5

                # Soft constraint satisfaction
                soft_score = 0
                for constraint in user_constraints.soft_constraints.values():
                    if self._meets_constraint(activity, constraint):
                        soft_score += 5
                score += soft_score

                # Semantic similarity with chat message
                try:
                    activity_text = f"{activity.name} {' '.join(activity.types)} {activity.location.address}"
                    activity_embedding = self.sentence_model.encode(activity_text)
                    chat_embedding = self.sentence_model.encode(chat_message)
                    similarity = util.cos_sim(activity_embedding, chat_embedding).item()
                    score += similarity * 20
                except:
                    score += 5  # Default similarity score

                activity.recommendation_score = score
                scored.append(activity)

            except Exception as e:
                print(f"Scoring error for {activity.name}: {e}")
                activity.recommendation_score = 0
                scored.append(activity)

        # Sort by score descending
        scored.sort(key=lambda x: x.recommendation_score, reverse=True)
        return scored

    def pick_activities(self, scored_activities: List[Activity], user_constraints: 'ConstraintList') -> List[Activity]:
        """Select optimal activities considering time and location"""
        if not scored_activities:
            return []

        # Start with highest scored activities
        selected = scored_activities[:5]  # Take top 5

        # Try to optimize for location proximity
        if len(selected) > 1:
            selected = self._optimize_location_proximity(selected)

        # Apply time constraints
        selected = self._apply_time_constraints(selected, user_constraints)

        return selected

    def _optimize_location_proximity(self, activities: List[Activity]) -> List[Activity]:
        """Simple optimization to group nearby activities"""
        if len(activities) <= 1:
            return activities

        # Start with first activity
        optimized = [activities[0]]
        remaining = activities[1:]

        while remaining and len(optimized) < 5:
            current = optimized[-1]
            closest = None
            min_distance = float('inf')

            for activity in remaining:
                distance = self._calculate_distance(
                    current.location.latitude, current.location.longitude,
                    activity.location.latitude, activity.location.longitude
                )

                if distance < min_distance:
                    min_distance = distance
                    closest = activity

            if closest:
                # Estimate travel time (1 minute per 0.5 km)
                travel_time = int(min_distance * 2)
                closest.travel_time_to_next = travel_time
                optimized.append(closest)
                remaining.remove(closest)
            else:
                break

        return optimized

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        # Haversine formula
        R = 6371  # Earth's radius in km

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c

        return distance

    def _apply_time_constraints(self, activities: List[Activity], user_constraints: 'ConstraintList') -> List[Activity]:
        """Ensure total time doesn't exceed constraints"""
        total_time = 0
        filtered = []

        # Find time constraint
        max_time = 480  # Default 8 hours
        for constraint in user_constraints.hard_constraints.values():
            if constraint.type in [ConstraintType.TIME, ConstraintType.DURATION]:
                max_time = constraint.intValue
                break

        for activity in activities:
            activity_time = activity.time.duration_minutes + activity.travel_time_to_next

            if total_time + activity_time <= max_time:
                filtered.append(activity)
                total_time += activity_time
            else:
                break

        return filtered

    def recommend_plan(self, chat_message: str, user_id: int) -> List[Activity]:
        """Main method to recommend a plan"""
        user_constraints = get_constraint_list(user_id)

        # Step 1: Get recommended activities
        activities = self.recommend_activities(chat_message, user_constraints)

        if not activities:
            print("No activities to recommend")
            return []

        # Step 2: Pick optimal activities
        plan = self.pick_activities(activities, user_constraints)

        # Step 3: Assign time slots
        self._assign_time_slots(plan)

        return plan

    def _assign_time_slots(self, activities: List[Activity]):
        """Assign actual time slots to activities"""
        if not activities:
            return

        # Start at 9:00 AM
        current_time = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)

        for i, activity in enumerate(activities):
            # Set start time
            activity.time.start_time = current_time

            # Calculate end time
            end_time = current_time + timedelta(minutes=activity.time.duration_minutes)
            activity.time.end_time = end_time

            # Set time slot based on hour
            hour = current_time.hour
            if 6 <= hour < 12:
                activity.time.time_slot = "morning"
            elif 12 <= hour < 17:
                activity.time.time_slot = "afternoon"
            else:
                activity.time.time_slot = "evening"

            # Move to next activity start time
            if i < len(activities) - 1:
                current_time = end_time + timedelta(minutes=activity.travel_time_to_next)


class Constraint:
    def __init__(self, id: int, type: ConstraintType, isHardConstraint: bool,
                 intValue: int = 0, strValue: str = ""):
        self.id = id
        self.type = type
        self.isHardConstraint = isHardConstraint
        self.intValue = intValue
        self.strValue = strValue


class ConstraintList:
    def __init__(self, userID: int):
        self.userID = userID
        self.hard_constraints = {}
        self.soft_constraints = {}
        self.next_constraint_id = 1

    def add_constraint(self, constraint: Constraint):
        if constraint.isHardConstraint:
            self.hard_constraints[constraint.id] = constraint
        else:
            self.soft_constraints[constraint.id] = constraint

    def remove_constraint(self, constraint: Constraint):
        if constraint.isHardConstraint:
            if constraint.id in self.hard_constraints:
                del self.hard_constraints[constraint.id]
        else:
            if constraint.id in self.soft_constraints:
                del self.soft_constraints[constraint.id]

    def add_constraint_from_text(self, text: str):
        """Simple constraint extraction from text"""
        text_lower = text.lower()

        # Price constraints
        if "cheap" in text_lower or "budget" in text_lower:
            constraint = Constraint(
                id=self.next_constraint_id,
                type=ConstraintType.PRICE,
                isHardConstraint=True,
                intValue=50000
            )
            self.add_constraint(constraint)
            self.next_constraint_id += 1

        # Location constraints
        if "district" in text_lower:
            # Extract district number
            import re
            match = re.search(r'district\s*(\d+)', text_lower)
            if match:
                constraint = Constraint(
                    id=self.next_constraint_id,
                    type=ConstraintType.LOCATION,
                    isHardConstraint=False,
                    strValue=f"district {match.group(1)}"
                )
                self.add_constraint(constraint)
                self.next_constraint_id += 1

        # Time constraints
        if "hour" in text_lower or "hours" in text_lower:
            import re
            match = re.search(r'(\d+)\s*hour', text_lower)
            if match:
                constraint = Constraint(
                    id=self.next_constraint_id,
                    type=ConstraintType.TIME,
                    isHardConstraint=True,
                    intValue=int(match.group(1)) * 60
                )
                self.add_constraint(constraint)
                self.next_constraint_id += 1


# Example usage
def main():
    # Initialize
    activity_list = get_activity_list()
    user_id = 1
    constraint_list = get_constraint_list(user_id)

    # Add some constraints
    constraint_list.add_constraint_from_text("I want cheap places for 2 hours")

    # Test recommendation
    print("=" * 50)
    print("HCMC Activity Recommender with Vietmap API")
    print("=" * 50)

    test_queries = [
        "Find restaurants in Ho Chi Minh City",
        "Show me attractions to visit",
        "What parks are there?",
        "Recommend museums for today"
    ]

    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        print("-" * 30)

        plan = activity_list.recommend_plan(query, user_id)

        if plan:
            print(f"✅ Recommended {len(plan)} activities:")
            for i, activity in enumerate(plan, 1):
                print(f"\n{i}. {activity.name}")
                print(f"   📍 {activity.location.address}")
                print(f"   💰 Price: ~{activity.price:,} VND")
                print(f"   ⏰ Duration: {activity.time.duration_minutes} min")
                print(f"   🎯 Score: {activity.recommendation_score:.1f}")
                if activity.travel_time_to_next > 0 and i < len(plan):
                    print(f"   ➡️ Travel to next: {activity.travel_time_to_next} min")
        else:
            print("❌ No recommendations found")

    print("\n" + "=" * 50)
    print("Note: Replace VIETMAP_API_KEY with your actual key")
    print("=" * 50)


if __name__ == "__main__":
    main()