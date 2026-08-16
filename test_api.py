import requests; print(requests.post('http://localhost:8000/api/search', json={'query': 'despacito', 'limit': 5}).json())
