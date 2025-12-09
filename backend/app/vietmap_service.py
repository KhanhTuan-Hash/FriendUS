import requests
from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Place:
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    distance: Optional[float] = None
    rating: Optional[float] = None
    phone: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'distance': self.distance,
            'rating': self.rating,
            'phone': self.phone
        }


class VietmapLocationService:
    BASE_URL = "https://api.vietmap.vn/api"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({'api-key': api_key})
    
    def search_filtered(
        self,
        keyword: str,
        bounds: Optional[Dict[str, float]] = None,
        limit: int = 10
    ) -> List[Place]:
        endpoint = f"{self.BASE_URL}/search/text"
        
        params = {
            'text': keyword,
            'limit': limit
        }
        
        if bounds:
            if 'north' in bounds and 'south' in bounds and 'east' in bounds and 'west' in bounds:
                bbox = f"{bounds['west']},{bounds['south']},{bounds['east']},{bounds['north']}"
                params['bbox'] = bbox
        
        try:
            response = self.session.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            places = []
            for result in data.get('results', []):
                place = Place(
                    id=result.get('id', ''),
                    name=result.get('name', ''),
                    address=result.get('address', ''),
                    latitude=result.get('lat', 0.0),
                    longitude=result.get('lng', 0.0),
                    rating=result.get('rating', None),
                    phone=result.get('phone', None)
                )
                places.append(place)
            
            return places
        except requests.RequestException as e:
            raise VietmapAPIError(f"Search filtered failed: {str(e)}")
    
    def search_nearby(
        self,
        keyword: str,
        latitude: float,
        longitude: float,
        distance_km: float = 5.0,
        limit: int = 10
    ) -> List[Place]:
        endpoint = f"{self.BASE_URL}/search/nearby"
        
        params = {
            'text': keyword,
            'lat': latitude,
            'lng': longitude,
            'range': int(distance_km * 1000),
            'limit': limit
        }
        
        try:
            response = self.session.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            places = []
            for result in data.get('results', []):
                distance = self._calculate_distance(
                    latitude,
                    longitude,
                    result.get('lat', 0.0),
                    result.get('lng', 0.0)
                )
                
                place = Place(
                    id=result.get('id', ''),
                    name=result.get('name', ''),
                    address=result.get('address', ''),
                    latitude=result.get('lat', 0.0),
                    longitude=result.get('lng', 0.0),
                    distance=distance,
                    rating=result.get('rating', None),
                    phone=result.get('phone', None)
                )
                places.append(place)
            
            places.sort(key=lambda p: p.distance if p.distance else float('inf'))
            return places
        except requests.RequestException as e:
            raise VietmapAPIError(f"Search nearby failed: {str(e)}")
    
    @staticmethod
    def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        from math import radians, cos, sin, asin, sqrt
        
        lon1, lat1, lon2, lat2 = map(radians, [lng1, lat1, lng2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return round(km, 2)
    
    def search_by_address(
        self,
        address: str,
        limit: int = 5
    ) -> Optional[Tuple[float, float]]:
        endpoint = f"{self.BASE_URL}/geocoding"
        
        params = {
            'address': address
        }
        
        try:
            response = self.session.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('results'):
                result = data['results'][0]
                return (result.get('lat'), result.get('lng'))
            
            return None
        except requests.RequestException as e:
            raise VietmapAPIError(f"Geocoding failed: {str(e)}")
    
    def reverse_geocoding(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[str]:
        endpoint = f"{self.BASE_URL}/reverse_geocoding"
        
        params = {
            'lat': latitude,
            'lng': longitude
        }
        
        try:
            response = self.session.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('results'):
                return data['results'][0].get('address', '')
            
            return None
        except requests.RequestException as e:
            raise VietmapAPIError(f"Reverse geocoding failed: {str(e)}")


class VietmapAPIError(Exception):
    pass
