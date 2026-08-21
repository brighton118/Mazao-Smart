import requests
import json
import time
import os

url = "http://127.0.0.1:8445/api/chat"
test_questions = [
    "What is the recommended soil pH for growing tea versus maize in Uganda?",
    "How can a smallholder farmer in Karamoja manage dry seasons for their vegetables?",
    "At what growth stage is a bean crop most vulnerable to water stress?",
    "Should a farmer irrigate their coffee trees heavily during a rainy period?",
    "What is the best way to make organic compost for a small farm?",
    "I'm seeing yellowing leaves on my banana plants and strange oozing sap. What could it be?",
    "How can I manage the Tomato leafminer using IPM instead of toxic chemicals?",
    "Why is my farmyard cattle manure burning the young roots of my maize?",
    "What are some key records I should continuously track on my farm?",
    "If the real-time sensor node 2 says moisture is 22% and critical is 35%, what is the system doing?"
]

mock_state = {
    "sensors": [
        {
            "id": 2,
            "plot": "Plot B",
            "crop": "Coffee",
            "moisture": 22,
            "minMoisture": 35,
            "maxMoisture": 70,
            "temp": 28,
            "online": True,
            "irrigating": True
        }
    ],
    "log": [
        {"type": "alert", "message": "CRITICAL DROUGHT: Coffee on Plot B is below 35%."}
    ],
    "solarOutput": 120,
    "batteryLevel": 85,
    "tankLevel": 2000,
    "pumpActive": True
}

def run_tests():
    print("Testing AgriSense AI RAG System with 10 questions...\n")
    results = []
    
    for i, q in enumerate(test_questions):
        print(f"[{i+1}/10] Querying: {q}")
        try:
            payload = {
                "query": q,
                "state": mock_state,
                "history": []
            }
            res = requests.post(url, json=payload, timeout=30)
            if res.status_code == 200:
                answer = res.json().get("response", "No response found")
                # Summarize answer to console
                print(f"Response snippet: {answer[:150]}...\n")
                results.append({"query": q, "answer": answer, "status": "success"})
            else:
                print(f"HTTP Error {res.status_code}: {res.text}\n")
                results.append({"query": q, "answer": f"HTTP Error {res.status_code}", "status": "error"})
        except Exception as e:
            print(f"Connection failed: {e}\n")
            results.append({"query": q, "answer": str(e), "status": "error"})
        
        if i < len(test_questions) - 1:
            print("Waiting 15 seconds to respect API rate limits...")
            time.sleep(15)
            
    # Write full output to a log file
    with open("rag_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Full results saved to rag_test_results.json.")

if __name__ == "__main__":
    run_tests()
