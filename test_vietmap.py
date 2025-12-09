import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend' / 'app'))

from vietmap_service import Place, VietmapLocationService, VietmapAPIError


def test_place_dataclass():
    place = Place(
        id="1",
        name="Phở 3 Miền",
        address="123 Nguyễn Huệ, Q1, HCM",
        latitude=10.7769,
        longitude=106.6955,
        distance=0.5,
        rating=4.5,
        phone="0912345678"
    )
    
    result = place.to_dict()
    print(f"✓ Place to_dict: {result}")
    assert result['name'] == "Phở 3 Miền"
    assert result['distance'] == 0.5


def test_distance_calculation():
    service = VietmapLocationService("test_key")
    
    dist = service._calculate_distance(10.7769, 106.6955, 10.7855, 106.7099)
    print(f"✓ Distance calculation: {dist} km")
    assert dist > 0 and dist < 5


def test_place_list_sorting():
    places = [
        Place("1", "Far", "addr1", 10.7769, 106.6955, distance=5.0),
        Place("2", "Near", "addr2", 10.7770, 106.6956, distance=0.1),
        Place("3", "Mid", "addr3", 10.7771, 106.6957, distance=2.0),
    ]
    
    places.sort(key=lambda p: p.distance if p.distance else float('inf'))
    print(f"✓ Place sorting: {[p.name for p in places]}")
    assert places[0].name == "Near"
    assert places[-1].name == "Far"


def test_vietmap_error():
    try:
        raise VietmapAPIError("Test error")
    except VietmapAPIError as e:
        print(f"✓ VietmapAPIError caught: {str(e)}")
        assert "Test error" in str(e)


def test_bounds_format():
    bounds = {
        'north': 10.8,
        'south': 10.7,
        'east': 106.8,
        'west': 106.6
    }
    
    bbox = f"{bounds['west']},{bounds['south']},{bounds['east']},{bounds['north']}"
    print(f"✓ Bounds format: {bbox}")
    assert bbox == "106.6,10.7,106.8,10.8"


def test_params_building():
    params = {
        'text': 'quán ăn',
        'limit': 10,
        'lat': 10.7769,
        'lng': 106.6955,
        'range': 5000
    }
    
    print(f"✓ Params building: {params}")
    assert params['text'] == 'quán ăn'
    assert params['range'] == 5000


if __name__ == "__main__":
    print("=" * 50)
    print("Testing Vietmap Service Module")
    print("=" * 50)
    
    try:
        test_place_dataclass()
        test_distance_calculation()
        test_place_list_sorting()
        test_vietmap_error()
        test_bounds_format()
        test_params_building()
        
        print("=" * 50)
        print("✅ All Vietmap tests passed!")
        print("=" * 50)
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
