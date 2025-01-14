import requests

for _ in range(1000):
    r = requests.get(url = "https://con4-app.onrender.com")
    print(r.text[:100])