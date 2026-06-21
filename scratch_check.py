import urllib.request
import json
import os

url = "https://gfvcqoxtrthpueycelem.supabase.co/rest/v1/"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdmNxb3h0cnRocHVleWNlbGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODcxNjMsImV4cCI6Mj90..." # We can load it from .env or write it directly from what we read

# Let's read from .env directly
env_data = {}
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            if "=" in line:
                k, v = line.strip().split("=", 1)
                env_data[k.strip()] = v.strip()

supabase_url = env_data.get("NEXT_PUBLIC_SUPABASE_URL")
anon_key = env_data.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def test_endpoint(table):
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/{table}?limit=1",
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Table '{table}' response:", data)
    except Exception as e:
        print(f"Table '{table}' error:", e)

test_endpoint("faculties")
test_endpoint("departments")
test_endpoint("degrees")
